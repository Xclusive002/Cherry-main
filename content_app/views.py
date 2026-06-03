from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from .models import ContentItem


def require_age_verification(request):
    if request.session.get('age_verified'):
        return True
    return False


def age_gate(request):
    if request.method == 'POST':
        confirmed = request.POST.get('confirm_age') == 'yes'
        if confirmed:
            request.session['age_verified'] = True
            next_url = request.POST.get('next') or reverse('home')
            return redirect(next_url)
    return render(request, 'content_app/age_gate.html')


def home(request):
    items = ContentItem.objects.filter(is_published=True)
    return render(request, 'content_app/home.html', {'items': items})


def detail(request, pk):
    item = get_object_or_404(ContentItem, pk=pk, is_published=True)
    if item.age_restricted and not require_age_verification(request):
        return render(request, 'content_app/age_gate.html', {'next': request.path})
    return render(request, 'content_app/detail.html', {'item': item})


def stories(request):
    items = ContentItem.objects.filter(is_published=True, content_type='story')
    return render(request, 'content_app/story_list.html', {'items': items})
