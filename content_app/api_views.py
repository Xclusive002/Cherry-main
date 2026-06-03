import json
import time
import uuid
import logging
import pycountry
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.db.models import Q, Sum
from django.http import JsonResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.utils.text import slugify
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import ChatMessage, ChatThread, ContentItem, DatingMatch, DatingSwipe, PrivateRoom, Profile, Purchase, Subscription, Notification
from django.conf import settings
import hmac
import hashlib
import requests
from django.views.decorators.csrf import csrf_exempt

User = get_user_model()


def serialize_content(item, user=None):
    has_access = False
    if user and user.is_authenticated:
        # direct purchases
        purchased = Purchase.objects.filter(user=user, content=item).exists()
        # subscription to the creator grants access too
        subscribed = False
        if item.creator:
            try:
                creator_profile = Profile.objects.get(user=item.creator)
                subscribed = Subscription.objects.filter(subscriber=user, creator=creator_profile, active=True).exists()
            except Profile.DoesNotExist:
                subscribed = False
        has_access = purchased or subscribed

    creator_data = None
    if item.creator:
        creator_data = {
            'id': item.creator.id,
            'username': item.creator.username,
        }

    allow_access = not item.is_paid or has_access
    return {
        'id': item.id,
        'title': item.title,
        'description': item.description,
        'content_type': item.content_type,
        'publish_date': item.publish_date.isoformat(),
        'is_published': item.is_published,
        'age_restricted': item.age_restricted,
        'price': float(item.price),
        'is_paid': item.is_paid,
        'video_file': item.video_file.url if item.video_file and allow_access else None,
        'image_file': item.image_file.url if item.image_file and allow_access else None,
        'thumbnail': item.thumbnail.url if item.thumbnail else None,
        'story_text': item.story_text,
        'source_url': item.source_url if allow_access else None,
        'private_room_id': item.private_room.id if item.private_room else None,
        'creator': creator_data,
        'has_purchased': has_access,
    }


def serialize_room(room, user=None):
    is_member = False
    if user and user.is_authenticated:
        is_member = room.members.filter(id=user.id).exists()

    return {
        'id': room.id,
        'title': room.title,
        'slug': room.slug,
        'description': room.description,
        'price': float(room.price),
        'is_active': room.is_active,
        'creator': {
            'id': room.creator.id,
            'username': room.creator.username,
        },
        'member_count': room.members.count(),
        'is_member': is_member,
        'created_at': room.created_at.isoformat(),
    }


def serialize_message(message):
    return {
        'id': message.id,
        'thread_id': message.thread.id,
        'sender': {
            'id': message.sender.id,
            'username': message.sender.username,
        },
        'text': message.text,
        'created_at': message.created_at.isoformat(),
    }


def serialize_thread(thread, user):
    last_message = thread.messages.order_by('-created_at').first()
    other_user = thread.creator if user.id != thread.creator.id else thread.user
    return {
        'id': thread.id,
        'creator_id': thread.creator.id,
        'user_id': thread.user.id,
        'other': {
            'id': other_user.id,
            'username': other_user.username,
        },
        'last_message': serialize_message(last_message) if last_message else None,
        'updated_at': thread.updated_at.isoformat(),
        'messages_count': thread.messages.count(),
    }


def serialize_creator(profile, user=None):
    is_following = False
    if user and user.is_authenticated:
        is_following = profile.followers.filter(id=user.id).exists()

    is_subscribed = False
    if user and user.is_authenticated:
        is_subscribed = Subscription.objects.filter(subscriber=user, creator=profile, active=True).exists()

    return {
        'id': profile.id,
        'username': profile.user.username,
        'display_name': profile.user.get_full_name() or profile.user.username,
        'bio': profile.bio,
        'avatar': profile.avatar.url if profile.avatar else None,
        'is_creator': profile.is_creator,
        'subscription_price': float(profile.subscription_price),
        'allow_direct_messages': profile.allow_direct_messages,
        'show_profile_public': profile.show_profile_public,
        'hide_followers': profile.hide_followers,
        'allow_subscriptions': profile.allow_subscriptions,
        'notification_newsletter': profile.notification_newsletter,
        'total_followers': profile.followers.count(),
        'total_contents': profile.user.content_items.filter(is_published=True).count(),
        'is_following': is_following,
        'is_subscribed': is_subscribed,
    }


def serialize_dating_profile(profile, user=None):
    liked = False
    passed = False
    matched = False
    if user and user.is_authenticated:
        liked = DatingSwipe.objects.filter(user=user, target=profile.user, direction='like').exists()
        passed = DatingSwipe.objects.filter(user=user, target=profile.user, direction='pass').exists()
        matched = DatingMatch.objects.filter(
            (Q(user1=user) & Q(user2=profile.user)) | (Q(user1=profile.user) & Q(user2=user))
        ).exists()

    photos = [profile.dating_photo_1, profile.dating_photo_2, profile.dating_photo_3]
    photo_urls = [photo.url for photo in photos if photo]

    return {
        'id': profile.user.id,
        'username': profile.user.username,
        'display_name': profile.user.get_full_name() or profile.user.username,
        'bio': profile.bio,
        'age': profile.dating_age,
        'gender': profile.dating_gender,
        'location': profile.dating_location,
        'looking_for': profile.dating_looking_for,
        'interests': profile.dating_interests,
        'photos': photo_urls,
        'profile_public': profile.dating_profile_public,
        'profile_complete': profile.dating_profile_complete,
        'is_creator': profile.is_creator,
        'avatar': profile.avatar.url if profile.avatar else None,
        'has_liked': liked,
        'has_passed': passed,
        'is_match': matched,
    }


def json_response(payload, status=200):
    return JsonResponse(payload, safe=False, status=status)


def get_json_body(request):
    try:
        return json.loads(request.body.decode('utf-8') or '{}')
    except json.JSONDecodeError:
        return {}


def parse_request_body(request):
    if request.content_type and 'multipart/form-data' in request.content_type:
        return request.POST
    return get_json_body(request)


def parse_bool(value, default=False):
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    return str(value).lower() in ['true', '1', 'yes', 'on']


def current_user(request):
    if request.user.is_authenticated:
        profile = getattr(request.user, 'profile', None)
        return json_response({
            'id': request.user.id,
            'username': request.user.username,
            'is_authenticated': True,
            'is_creator': profile.is_creator if profile else False,
            'profile': {
                'subscription_price': float(profile.subscription_price) if profile else 0,
                'allow_direct_messages': profile.allow_direct_messages if profile else True,
                'show_profile_public': profile.show_profile_public if profile else True,
                'hide_followers': profile.hide_followers if profile else False,
                'allow_subscriptions': profile.allow_subscriptions if profile else True,
                'notification_newsletter': profile.notification_newsletter if profile else False,
                'bio': profile.bio if profile else '',
                'dating_gender': profile.dating_gender if profile else '',
                'dating_age': profile.dating_age if profile else None,
                'dating_location': profile.dating_location if profile else '',
                'dating_looking_for': profile.dating_looking_for if profile else '',
                'dating_interests': profile.dating_interests if profile else '',
                'dating_profile_public': profile.dating_profile_public if profile else False,
                'dating_profile_complete': profile.dating_profile_complete if profile else False,
            },
        })
    return json_response({'is_authenticated': False})


def dating_discover(request):
    # Allow discovery to be visible to all users (authenticated or not)
    # Swiped ids only apply for authenticated users
    if request.user.is_authenticated:
        swiped_ids = DatingSwipe.objects.filter(user=request.user).values_list('target_id', flat=True)
    else:
        swiped_ids = []

    age_min = request.GET.get('age_min')
    age_max = request.GET.get('age_max')
    location = request.GET.get('location')
    looking_for = request.GET.get('looking_for')

    queryset = Profile.objects.filter(
        dating_profile_public=True,
        dating_profile_complete=True,
    )
    if request.user.is_authenticated:
        queryset = queryset.exclude(user=request.user)

    if age_min and age_min.isdigit():
        queryset = queryset.filter(dating_age__gte=int(age_min))
    if age_max and age_max.isdigit():
        queryset = queryset.filter(dating_age__lte=int(age_max))
    if location:
        queryset = queryset.filter(dating_location__icontains=location)
    if looking_for:
        queryset = queryset.filter(dating_looking_for__icontains=looking_for)

    queryset = queryset.exclude(user__id__in=swiped_ids)[:20]
    return json_response([serialize_dating_profile(profile, request.user) for profile in queryset])


def dating_profile_detail(request, pk):
    profile = get_object_or_404(Profile, user__id=pk)
    # Allow viewing of dating profiles to all users; sensitive actions still require auth
    return json_response(serialize_dating_profile(profile, request.user))


@csrf_exempt
@require_http_methods(['POST'])
def update_dating_profile(request):
    if not request.user.is_authenticated:
        return json_response({'error': 'Authentication required.'}, status=401)

    profile = getattr(request.user, 'profile', None)
    if profile is None:
        return json_response({'error': 'Profile not found.'}, status=404)

    data = parse_request_body(request)
    profile.dating_gender = data.get('dating_gender', profile.dating_gender)
    profile.dating_age = int(data.get('dating_age')) if data.get('dating_age') else profile.dating_age
    profile.dating_location = data.get('dating_location', profile.dating_location)
    profile.dating_looking_for = data.get('dating_looking_for', profile.dating_looking_for)
    profile.dating_interests = data.get('dating_interests', profile.dating_interests)
    profile.dating_profile_public = parse_bool(data.get('dating_profile_public', profile.dating_profile_public))

    if request.FILES.get('dating_photo_1'):
        profile.dating_photo_1 = request.FILES.get('dating_photo_1')
    if request.FILES.get('dating_photo_2'):
        profile.dating_photo_2 = request.FILES.get('dating_photo_2')
    if request.FILES.get('dating_photo_3'):
        profile.dating_photo_3 = request.FILES.get('dating_photo_3')

    profile.update_dating_status()
    profile.save()

    return json_response({'message': 'Dating profile updated successfully.', 'profile': serialize_dating_profile(profile, request.user)})


@csrf_exempt
@require_http_methods(['POST'])
def dating_swipe(request):
    if not request.user.is_authenticated:
        return json_response({'error': 'Authentication required.'}, status=401)

    data = get_json_body(request)
    target_id = data.get('target_id')
    direction = data.get('direction')
    if not target_id or direction not in ['like', 'pass']:
        return json_response({'error': 'Invalid swipe parameters.'}, status=400)

    if request.user.id == target_id:
        return json_response({'error': 'Cannot swipe on yourself.'}, status=400)

    target_profile = get_object_or_404(Profile, user__id=target_id)
    swipe, _ = DatingSwipe.objects.update_or_create(
        user=request.user,
        target=target_profile.user,
        defaults={'direction': direction},
    )

    matched = False
    match_id = None
    if direction == 'like':
        mutual = DatingSwipe.objects.filter(user=target_profile.user, target=request.user, direction='like').exists()
        if mutual:
            match, created = DatingMatch.objects.get_or_create(
                user1=request.user if request.user.id < target_profile.user.id else target_profile.user,
                user2=target_profile.user if request.user.id < target_profile.user.id else request.user,
            )
            matched = True
            match_id = match.id

    return json_response({
        'matched': matched,
        'match_id': match_id,
        'profile': serialize_dating_profile(target_profile, request.user),
    })


def dating_matches(request):
    if not request.user.is_authenticated:
        return json_response({'error': 'Authentication required.'}, status=401)

    matches = DatingMatch.objects.filter(Q(user1=request.user) | Q(user2=request.user))
    output = []
    for match in matches:
        other = match.user2 if match.user1 == request.user else match.user1
        other_profile = getattr(other, 'profile', None)
        if other_profile:
            output.append({
                'id': match.id,
                'matched_at': match.matched_at.isoformat(),
                'user': serialize_dating_profile(other_profile, request.user),
            })
    return json_response(output)


@csrf_exempt
@require_http_methods(['GET', 'POST'])
def content_list(request):
    if request.method == 'POST':
        if not request.user.is_authenticated:
            return json_response({'error': 'Authentication required.'}, status=401)

        profile = getattr(request.user, 'profile', None)
        if profile is None or not profile.is_creator:
            return json_response({'error': 'Only creators can upload content.'}, status=403)

        data = parse_request_body(request)
        title = (data.get('title') or '').strip()
        description = (data.get('description') or '').strip()
        content_type = (data.get('content_type') or 'video').strip()
        price = float(data.get('price') or 0)
        is_paid_raw = data.get('is_paid')
        if isinstance(is_paid_raw, str):
            is_paid = is_paid_raw.lower() in ['true', '1', 'yes']
        else:
            is_paid = bool(is_paid_raw) if is_paid_raw is not None else price > 0
        age_restricted_raw = data.get('age_restricted')
        if isinstance(age_restricted_raw, str):
            age_restricted = age_restricted_raw.lower() in ['true', '1', 'yes']
        else:
            age_restricted = bool(age_restricted_raw)

        source_url = (data.get('source_url') or '').strip()
        story_text = (data.get('story_text') or '').strip()
        video_file = request.FILES.get('video_file')
        image_file = request.FILES.get('image_file')
        thumbnail = request.FILES.get('thumbnail')

        if not title:
            return json_response({'error': 'Content title is required.'}, status=400)

        if content_type not in ['video', 'leak', 'story', 'image']:
            return json_response({'error': 'Invalid content type.'}, status=400)

        if content_type == 'video' and not video_file and not source_url:
            return json_response({'error': 'Video file or source URL is required for video content.'}, status=400)

        if content_type == 'leak' and not source_url and not video_file:
            return json_response({'error': 'A leak source URL or video upload is required.'}, status=400)

        if content_type == 'image' and not image_file:
            return json_response({'error': 'An image file is required for image content.'}, status=400)

        if content_type == 'story' and not story_text:
            return json_response({'error': 'Story text is required for story content.'}, status=400)

        item = ContentItem.objects.create(
            creator=request.user,
            title=title,
            description=description,
            content_type=content_type,
            is_published=True,
            age_restricted=age_restricted,
            price=price,
            is_paid=is_paid,
            show_on_home=True,
            story_text=story_text,
            source_url=source_url,
            video_file=video_file,
            image_file=image_file,
            thumbnail=thumbnail,
        )
        return json_response(serialize_content(item, request.user), status=201)

    queryset = ContentItem.objects.filter(is_published=True)
    content_type = request.GET.get('type')
    creator_id = request.GET.get('creator_id')
    home_only = request.GET.get('home')
    if content_type:
        queryset = queryset.filter(content_type=content_type)
        # For video listing, only show items that have an associated creator
        if content_type == 'video':
            queryset = queryset.filter(creator__isnull=False, creator__profile__is_creator=True)
    if creator_id:
        queryset = queryset.filter(creator__id=creator_id)
    if home_only:
        queryset = queryset.filter(show_on_home=True)

    items = [serialize_content(item, request.user) for item in queryset]
    return json_response(items)


def content_detail(request, pk):
    item = get_object_or_404(ContentItem, pk=pk, is_published=True)
    return json_response(serialize_content(item, request.user))


def creators_list(request):
    profiles = Profile.objects.filter(is_creator=True)
    return json_response([serialize_creator(profile, request.user) for profile in profiles])


def creator_detail(request, pk):
    profile = get_object_or_404(Profile, pk=pk, is_creator=True)
    contents = profile.user.content_items.filter(is_published=True)
    rooms = profile.user.private_rooms.filter(is_active=True)

    return json_response({
        'creator': serialize_creator(profile, request.user),
        'contents': [serialize_content(item, request.user) for item in contents],
        'rooms': [serialize_room(room, request.user) for room in rooms],
    })


def creator_self(request):
    if not request.user.is_authenticated:
        return json_response({'error': 'Authentication required.'}, status=401)

    profile = getattr(request.user, 'profile', None)
    if profile is None or not profile.is_creator:
        return json_response({'error': 'Creator profile not found.'}, status=403)

    contents = request.user.content_items.filter(is_published=True)
    rooms = request.user.private_rooms.filter(is_active=True)
    content_revenue = Purchase.objects.filter(content__creator=request.user).aggregate(revenue=Sum('content__price'))['revenue'] or 0
    room_revenue = Purchase.objects.filter(room__creator=request.user).aggregate(revenue=Sum('room__price'))['revenue'] or 0

    return json_response({
        'creator': serialize_creator(profile, request.user),
        'contents': [serialize_content(item, request.user) for item in contents],
        'rooms': [serialize_room(room, request.user) for room in rooms],
        'performance': {
            'total_content_sales': Purchase.objects.filter(content__creator=request.user).count(),
            'total_room_sales': Purchase.objects.filter(room__creator=request.user).count(),
            'total_earned': float(content_revenue + room_revenue),
        },
    })


def chat_threads(request):
    if not request.user.is_authenticated:
        return json_response({'error': 'Authentication required.'}, status=401)

    threads = ChatThread.objects.filter(Q(user=request.user) | Q(creator=request.user)).order_by('-updated_at')
    return json_response([serialize_thread(thread, request.user) for thread in threads])


def chat_detail(request, pk):
    if not request.user.is_authenticated:
        return json_response({'error': 'Authentication required.'}, status=401)

    thread = get_object_or_404(ChatThread, pk=pk)
    if request.user != thread.user and request.user != thread.creator:
        return json_response({'error': 'Not authorized.'}, status=403)

    messages = thread.messages.order_by('created_at')
    return json_response({
        'thread': serialize_thread(thread, request.user),
        'messages': [serialize_message(message) for message in messages],
    })


@csrf_exempt
@require_http_methods(['POST'])
def start_chat(request):
    if not request.user.is_authenticated:
        return json_response({'error': 'Authentication required.'}, status=401)

    data = get_json_body(request)
    creator_id = data.get('creator_id')
    profile = get_object_or_404(Profile, pk=creator_id, is_creator=True)
    if not profile.allow_direct_messages:
        return json_response({'error': 'This creator is not accepting direct messages right now.'}, status=403)

    creator = profile.user
    if creator == request.user:
        return json_response({'error': 'Cannot start a chat with yourself.'}, status=400)

    is_subscribed = Subscription.objects.filter(
        subscriber=request.user,
        creator=profile,
        active=True
    ).exists()

    if not is_subscribed:
        return json_response(
            {'error': 'You must be subscribed to this creator to send them messages.'},
            status=403
        )

    thread, _ = ChatThread.objects.get_or_create(creator=creator, user=request.user)
    return json_response({'thread_id': thread.id})


@csrf_exempt
@require_http_methods(['POST'])
def send_message(request, pk):
    if not request.user.is_authenticated:
        return json_response({'error': 'Authentication required.'}, status=401)

    thread = get_object_or_404(ChatThread, pk=pk)
    if request.user != thread.user and request.user != thread.creator:
        return json_response({'error': 'Not authorized.'}, status=403)

    data = get_json_body(request)
    text = data.get('text', '').strip()
    if not text:
        return json_response({'error': 'Message cannot be empty.'}, status=400)

    message = ChatMessage.objects.create(thread=thread, sender=request.user, text=text)
    thread.save()  # update timestamp
    return json_response(serialize_message(message), status=201)


def subscriptions_list(request):
    if not request.user.is_authenticated:
        return json_response({'error': 'Authentication required.'}, status=401)

    subscriptions = Subscription.objects.filter(subscriber=request.user, active=True)
    return json_response([
        {
            'id': subscription.id,
            'creator': serialize_creator(subscription.creator, request.user),
            'price': float(subscription.price),
            'subscribed_at': subscription.subscribed_at.isoformat(),
        }
        for subscription in subscriptions
    ])


@csrf_exempt
@require_http_methods(['POST'])
def subscribe_creator(request, pk):
    if not request.user.is_authenticated:
        return json_response({'error': 'Authentication required.'}, status=401)

    profile = get_object_or_404(Profile, pk=pk, is_creator=True)
    if profile.user == request.user:
        return json_response({'error': 'Cannot subscribe to yourself.'}, status=400)

    if not profile.allow_subscriptions:
        return json_response({'error': 'Creator subscriptions are disabled.'}, status=403)

    if profile.subscription_price <= 0:
        return json_response({'error': 'Creator subscription pricing is not set.'}, status=400)

    subscription, created = Subscription.objects.get_or_create(
        subscriber=request.user,
        creator=profile,
        defaults={'price': profile.subscription_price},
    )
    if not created and not subscription.active:
        subscription.active = True
        subscription.price = profile.subscription_price
        subscription.save()

    return json_response({
        'message': 'Subscribed to creator successfully.',
        'subscription': {
            'id': subscription.id,
            'price': float(subscription.price),
            'active': subscription.active,
        },
    })


@csrf_exempt
@require_http_methods(['POST'])
def update_settings(request):
    if not request.user.is_authenticated:
        return json_response({'error': 'Authentication required.'}, status=401)

    profile = getattr(request.user, 'profile', None)
    if profile is None:
        return json_response({'error': 'Profile not found.'}, status=404)

    data = get_json_body(request)
    profile.subscription_price = data.get('subscription_price', profile.subscription_price)
    profile.allow_direct_messages = bool(data.get('allow_direct_messages', profile.allow_direct_messages))
    profile.show_profile_public = bool(data.get('show_profile_public', profile.show_profile_public))
    profile.hide_followers = bool(data.get('hide_followers', profile.hide_followers))
    profile.allow_subscriptions = bool(data.get('allow_subscriptions', profile.allow_subscriptions))
    profile.notification_newsletter = bool(data.get('notification_newsletter', profile.notification_newsletter))
    profile.bio = data.get('bio', profile.bio)
    profile.dating_gender = data.get('dating_gender', profile.dating_gender)
    profile.dating_age = data.get('dating_age', profile.dating_age)
    profile.dating_location = data.get('dating_location', profile.dating_location)
    profile.dating_looking_for = data.get('dating_looking_for', profile.dating_looking_for)
    profile.dating_interests = data.get('dating_interests', profile.dating_interests)
    profile.dating_profile_public = parse_bool(data.get('dating_profile_public', profile.dating_profile_public))
    profile.update_dating_status()
    profile.save()

    return json_response({'message': 'Settings updated successfully.'})


def notifications_stream(request):
    last_id = int(request.GET.get('last_id', 0) or 0)

    def event_stream():
        nonlocal last_id
        while True:
            notifications = Notification.objects.filter(is_active=True, id__gt=last_id).order_by('created_at')
            if notifications.exists():
                for notification in notifications:
                    payload = json.dumps({
                        'id': notification.id,
                        'title': notification.title,
                        'message': notification.message,
                        'created_at': notification.created_at.isoformat(),
                    })
                    yield f"event: notification\ndata: {payload}\n\n"
                    last_id = notification.id
            time.sleep(3)

    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response


def locations_countries(request):
    """Return list of countries with alpha2 codes."""
    countries = []
    try:
        for c in pycountry.countries:
            countries.append({'name': c.name, 'code': getattr(c, 'alpha_2', None)})
        countries = sorted(countries, key=lambda x: x['name'])
    except Exception:
        logging.exception('Failed to load countries')
    return json_response(countries)


def locations_subdivisions(request):
    """Return subdivisions (states/provinces) for a given country code (?country=US).

    Accepts either a 2-letter country code or a country name. Returns list of {code, name}.
    """
    country = request.GET.get('country') or request.GET.get('country_code')
    subdivisions = []
    if not country:
        return json_response(subdivisions)
    try:
        # Accept full country name as input; try to resolve to alpha_2
        country_code = country.upper()
        if len(country_code) > 2:
            # try to find by name
            found = None
            for c in pycountry.countries:
                if c.name.lower() == country.lower() or getattr(c, 'official_name', '').lower() == country.lower():
                    found = getattr(c, 'alpha_2', None)
                    break
            if found:
                country_code = found

        # Use pycountry.subdivisions to get subdivisions for the country code
        subs = [s for s in pycountry.subdivisions if getattr(s, 'country_code', '').upper() == country_code]
        for s in subs:
            subdivisions.append({'code': getattr(s, 'code', None), 'name': s.name})
        subdivisions = sorted(subdivisions, key=lambda x: x['name'])
    except Exception:
        logging.exception('Failed to load subdivisions for country %s', country)
    return json_response(subdivisions)


def terms_text(request):
    """Return Terms & Conditions text for creator onboarding."""
    text = (
        "By applying to be a creator on Cherry you agree to the following: \n"
        "- Creators receive 80% of subscription revenue; admin receives 20% for platform maintenance.\n"
        "- Subscriptions are processed via Paystack. Creators must provide valid payout details.\n"
        "- Withdrawals to Nigerian bank accounts are processed weekly on Fridays by Paystack (if eligible).\n"
        "- Creators must comply with site policies; failure to comply may result in account suspension.\n"
        "\nThis is a summary; by agreeing you accept full Terms & Conditions."
    )
    return json_response({'terms': text})


@csrf_exempt
@require_http_methods(['POST'])
def paystack_initialize_subscription(request, pk):
    if not request.user.is_authenticated:
        return json_response({'error': 'Authentication required.'}, status=401)

    profile = get_object_or_404(Profile, pk=pk, is_creator=True)
    data = get_json_body(request)
    recurring = bool(data.get('recurring', True))
    amount = float(data.get('amount') or profile.subscription_price or 0)
    if amount <= 0:
        return json_response({'error': 'Invalid subscription amount.'}, status=400)

    email = request.user.email or f'{request.user.username}@example.invalid'
    payload = {
        'email': email,
        'amount': int(amount * 100),
        'callback_url': f"{settings.SITE_URL.rstrip('/')}/payments/verify",
        'metadata': {
            'creator_profile_id': profile.id,
            'subscriber_id': request.user.id,
            'recurring': recurring,
        }
    }

    headers = {'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}'}
    try:
        resp = requests.post('https://api.paystack.co/transaction/initialize', json=payload, headers=headers, timeout=10)
        resp.raise_for_status()
        return json_response(resp.json())
    except Exception:
        logging.exception('Failed to initialize Paystack transaction')
        return json_response({'error': 'Failed to initialize payment.'}, status=500)


@csrf_exempt
@require_http_methods(['POST'])
def paystack_webhook(request):
    # Validate signature
    signature = request.META.get('HTTP_X_PAYSTACK_SIGNATURE')
    body = request.body
    secret = settings.PAYSTACK_SECRET_KEY.encode()
    computed = hmac.new(secret, body, hashlib.sha512).hexdigest()
    if not signature or not hmac.compare_digest(computed, signature):
        return json_response({'status': 'signature_mismatch'}, status=400)

    try:
        event = json.loads(body.decode('utf-8'))
    except Exception:
        return json_response({'status': 'invalid_json'}, status=400)

    # Handle successful charge
    event_type = event.get('event')
    data = event.get('data', {})
    if event_type in ('charge.success', 'transaction.success') or (data.get('status') == 'success'):
        metadata = data.get('metadata') or {}
        creator_profile_id = metadata.get('creator_profile_id')
        subscriber_id = metadata.get('subscriber_id')
        amount = (data.get('amount') or 0) / 100.0
        try:
            if creator_profile_id and subscriber_id:
                creator_profile = Profile.objects.get(pk=creator_profile_id, is_creator=True)
                subscriber = User.objects.get(pk=subscriber_id)
                subscription, created = Subscription.objects.get_or_create(
                    subscriber=subscriber,
                    creator=creator_profile,
                    defaults={'price': amount, 'active': True},
                )
                if not created:
                    subscription.active = True
                    subscription.price = amount
                    subscription.save()

                # Create a notification for the creator
                Notification.objects.create(
                    title='New subscription',
                    message=f"{subscriber.username} subscribed to your content. Amount: {amount}",
                )
        except Exception:
            logging.exception('Failed to process successful Paystack webhook')

    return json_response({'status': 'ok'})


@csrf_exempt
@require_http_methods(['GET', 'POST'])
def register_user(request):
    try:
        data = get_json_body(request)
        username = data.get('username')
        password = data.get('password')
        email = data.get('email', '')
        is_creator = bool(data.get('is_creator', False))
        bio = data.get('bio', '')
        subscription_price = data.get('subscription_price', 0)

        if not username or not password:
            return json_response({'error': 'Username and password are required.'}, status=400)

        if User.objects.filter(username=username).exists():
            return json_response({'error': 'Username already exists.'}, status=400)

        # If the user is requesting to be a creator, they must agree to terms
        agree_terms = bool(data.get('agree_terms', False))
        if is_creator and not agree_terms:
            return json_response({'error': 'Creators must agree to the Terms & Conditions.'}, status=400)

        try:
            user = User.objects.create_user(username=username, password=password, email=email)
        except Exception as e:
            logging.exception('Failed to create user during registration')
            return json_response({'error': 'Failed to create user.', 'detail': str(e)}, status=500)

        profile = getattr(user, 'profile', None)
        if profile:
            try:
                profile.is_creator = is_creator
                profile.bio = bio
                profile.subscription_price = subscription_price if is_creator else 0
                profile.save()
            except Exception:
                logging.exception('Failed to update profile after registration')

        try:
            login(request, user)
        except Exception as e:
            logging.exception('Failed to log in user after registration')
            return json_response({'error': 'Failed to log in after registration.', 'detail': str(e)}, status=500)

        profile = getattr(user, 'profile', None)
        return json_response({
            'message': 'Registration successful.',
            'user': {
                'id': user.id,
                'username': user.username,
                'is_creator': profile.is_creator if profile else False,
                'profile': {
                    'subscription_price': float(profile.subscription_price) if profile else 0,
                    'allow_direct_messages': profile.allow_direct_messages if profile else True,
                    'show_profile_public': profile.show_profile_public if profile else True,
                    'hide_followers': profile.hide_followers if profile else False,
                    'allow_subscriptions': profile.allow_subscriptions if profile else True,
                    'notification_newsletter': profile.notification_newsletter if profile else False,
                    'bio': profile.bio if profile else '',
                    'dating_gender': profile.dating_gender if profile else '',
                    'dating_age': profile.dating_age if profile else None,
                    'dating_location': profile.dating_location if profile else '',
                    'dating_looking_for': profile.dating_looking_for if profile else '',
                    'dating_interests': profile.dating_interests if profile else '',
                    'dating_profile_public': profile.dating_profile_public if profile else False,
                    'dating_profile_complete': profile.dating_profile_complete if profile else False,
                },
            },
        })
    except Exception as e:
        logging.exception('Unexpected error in register_user')
        return json_response({'error': 'Unexpected registration error.', 'detail': str(e)}, status=500)


@csrf_exempt
@require_http_methods(['POST'])
def login_user(request):
    try:
        data = get_json_body(request)
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return json_response({'error': 'Username and password are required.'}, status=400)

        user = authenticate(request, username=username, password=password)
        if user is None:
            return json_response({'error': 'Invalid credentials.'}, status=401)

        try:
            login(request, user)
        except Exception as e:
            logging.exception('Failed to create login session')
            return json_response({'error': 'Failed to create login session.', 'detail': str(e)}, status=500)

        profile = getattr(user, 'profile', None)
        return json_response({
            'message': 'Login successful.',
            'user': {
                'id': user.id,
                'username': user.username,
                'is_creator': profile.is_creator if profile else False,
                'profile': {
                    'subscription_price': float(profile.subscription_price) if profile else 0,
                    'allow_direct_messages': profile.allow_direct_messages if profile else True,
                    'show_profile_public': profile.show_profile_public if profile else True,
                    'hide_followers': profile.hide_followers if profile else False,
                    'allow_subscriptions': profile.allow_subscriptions if profile else True,
                    'notification_newsletter': profile.notification_newsletter if profile else False,
                    'bio': profile.bio if profile else '',
                    'dating_gender': profile.dating_gender if profile else '',
                    'dating_age': profile.dating_age if profile else None,
                    'dating_location': profile.dating_location if profile else '',
                    'dating_looking_for': profile.dating_looking_for if profile else '',
                    'dating_interests': profile.dating_interests if profile else '',
                    'dating_profile_public': profile.dating_profile_public if profile else False,
                    'dating_profile_complete': profile.dating_profile_complete if profile else False,
                },
            },
        })
    except Exception as e:
        logging.exception('Unexpected error in login_user')
        return json_response({'error': 'Unexpected login error.', 'detail': str(e)}, status=500)


@csrf_exempt
@require_http_methods(['POST'])
def logout_user(request):
    logout(request)
    return json_response({'message': 'Logged out successfully.'})


@csrf_exempt
@require_http_methods(['POST'])
def follow_creator(request, pk):
    if not request.user.is_authenticated:
        return json_response({'error': 'Authentication required.'}, status=401)

    profile = get_object_or_404(Profile, pk=pk, is_creator=True)
    profile.followers.add(request.user)
    return json_response({'message': 'Now following creator.'})


@csrf_exempt
@require_http_methods(['POST'])
def purchase_content(request, pk):
    if not request.user.is_authenticated:
        return json_response({'error': 'Authentication required.'}, status=401)

    item = get_object_or_404(ContentItem, pk=pk, is_published=True)
    if item.creator and item.creator == request.user:
        return json_response({'error': 'Cannot purchase your own content.'}, status=403)

    if item.price <= 0 or not item.is_paid:
        return json_response({'error': 'This content does not require purchase.'}, status=400)

    purchase, created = Purchase.objects.get_or_create(user=request.user, content=item)
    if not created:
        return json_response({'message': 'Content already purchased.', 'content_id': item.id}, status=200)

    return json_response({'message': 'Content purchased successfully.', 'content_id': item.id}, status=201)


@csrf_exempt
@require_http_methods(['POST'])
def join_room(request, pk):
    if not request.user.is_authenticated:
        return json_response({'error': 'Authentication required.'}, status=401)

    room = get_object_or_404(PrivateRoom, pk=pk, is_active=True)
    if room.creator == request.user:
        return json_response({'error': 'Room creators do not need to join their own room.'}, status=400)

    room.members.add(request.user)
    Purchase.objects.get_or_create(user=request.user, room=room)
    return json_response({'message': 'Joined private room successfully.', 'room_id': room.id})


@csrf_exempt
@require_http_methods(['GET', 'POST'])
def rooms_list(request):
    if request.method == 'POST':
        if not request.user.is_authenticated:
            return json_response({'error': 'Authentication required.'}, status=401)

        profile = getattr(request.user, 'profile', None)
        if profile is None or not profile.is_creator:
            return json_response({'error': 'Only creators can create rooms.'}, status=403)

        data = parse_request_body(request)
        title = (data.get('title') or '').strip()
        description = (data.get('description') or '').strip()
        price = float(data.get('price') or 0)
        is_active_raw = data.get('is_active')
        if isinstance(is_active_raw, str):
            is_active = is_active_raw.lower() in ['true', '1', 'yes']
        else:
            is_active = bool(is_active_raw) if is_active_raw is not None else True

        if not title:
            return json_response({'error': 'Room title is required.'}, status=400)

        slug_base = slugify(title) or str(uuid.uuid4())[:8]
        slug = slug_base
        if PrivateRoom.objects.filter(slug=slug).exists():
            slug = f"{slug_base}-{uuid.uuid4().hex[:6]}"

        room = PrivateRoom.objects.create(
            creator=request.user,
            title=title,
            slug=slug,
            description=description,
            price=price,
            is_active=is_active,
        )
        return json_response(serialize_room(room, request.user), status=201)

    rooms = PrivateRoom.objects.filter(is_active=True)
    return json_response([serialize_room(room, request.user) for room in rooms])


def room_detail(request, pk):
    room = get_object_or_404(PrivateRoom, pk=pk, is_active=True)
    return json_response(serialize_room(room, request.user))


@csrf_exempt
@require_http_methods(['GET', 'POST'])
def notifications_list(request):
    if request.method == 'POST':
        # Only admins can create notifications
        if not request.user.is_staff:
            return json_response({'error': 'Admin access required.'}, status=403)

        data = parse_request_body(request)
        title = (data.get('title') or '').strip()
        message = (data.get('message') or '').strip()

        if not title or not message:
            return json_response({'error': 'Title and message are required.'}, status=400)

        notification = Notification.objects.create(title=title, message=message, is_active=True)
        return json_response({
            'id': notification.id,
            'title': notification.title,
            'message': notification.message,
            'created_at': notification.created_at.isoformat(),
            'is_active': notification.is_active,
        }, status=201)

    # GET: return all active notifications
    notifications = Notification.objects.filter(is_active=True).order_by('-created_at')
    return json_response([
        {
            'id': n.id,
            'title': n.title,
            'message': n.message,
            'created_at': n.created_at.isoformat(),
        }
        for n in notifications
    ])

