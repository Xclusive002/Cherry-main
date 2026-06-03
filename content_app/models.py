from django.conf import settings
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    is_creator = models.BooleanField(default=False)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    subscription_price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    allow_direct_messages = models.BooleanField(default=True)
    show_profile_public = models.BooleanField(default=True)
    hide_followers = models.BooleanField(default=False)
    allow_subscriptions = models.BooleanField(default=True)
    notification_newsletter = models.BooleanField(default=False)
    dating_gender = models.CharField(max_length=16, blank=True, choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')])
    dating_age = models.PositiveIntegerField(blank=True, null=True)
    dating_location = models.CharField(max_length=120, blank=True)
    dating_looking_for = models.CharField(max_length=64, blank=True)
    dating_interests = models.TextField(blank=True)
    dating_photo_1 = models.ImageField(upload_to='dating_photos/', blank=True, null=True)
    dating_photo_2 = models.ImageField(upload_to='dating_photos/', blank=True, null=True)
    dating_photo_3 = models.ImageField(upload_to='dating_photos/', blank=True, null=True)
    dating_profile_public = models.BooleanField(default=False)
    dating_profile_complete = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    followers = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='following_creators', blank=True)

    def __str__(self):
        return f"{self.user.username} Profile"

    def update_dating_status(self):
        self.dating_profile_complete = bool(
            self.dating_gender and self.dating_age and self.dating_location and self.dating_looking_for and self.dating_interests
        )
        self.save()


class DatingSwipe(models.Model):
    SWIPE_CHOICES = [
        ('like', 'Like'),
        ('pass', 'Pass'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='dating_swipes', on_delete=models.CASCADE)
    target = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='dating_swiped_by', on_delete=models.CASCADE)
    direction = models.CharField(max_length=8, choices=SWIPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'target')

    def __str__(self):
        return f"{self.user.username} {self.direction} {self.target.username}"


class DatingMatch(models.Model):
    user1 = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='dating_matches_one', on_delete=models.CASCADE)
    user2 = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='dating_matches_two', on_delete=models.CASCADE)
    matched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user1', 'user2')

    def save(self, *args, **kwargs):
        if self.user1.id > self.user2.id:
            self.user1, self.user2 = self.user2, self.user1
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Match between {self.user1.username} and {self.user2.username}"


class PrivateRoom(models.Model):
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='private_rooms', on_delete=models.CASCADE)
    title = models.CharField(max_length=220)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='joined_rooms', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.creator.username})"


class ContentItem(models.Model):
    CONTENT_TYPE_CHOICES = [
        ('video', 'Video'),
        ('leak', 'Leak'),
        ('story', 'Story'),
        ('image', 'Image'),
    ]

    creator = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='content_items', on_delete=models.CASCADE, blank=True, null=True)
    title = models.CharField(max_length=220)
    description = models.TextField(blank=True)
    content_type = models.CharField(max_length=16, choices=CONTENT_TYPE_CHOICES, default='video')
    publish_date = models.DateTimeField(auto_now_add=True)
    is_published = models.BooleanField(default=True)
    age_restricted = models.BooleanField(default=True)
    price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    is_paid = models.BooleanField(default=False)
    show_on_home = models.BooleanField(default=True)
    video_file = models.FileField(upload_to='videos/', blank=True, null=True)
    image_file = models.ImageField(upload_to='images/', blank=True, null=True)
    thumbnail = models.ImageField(upload_to='thumbnails/', blank=True, null=True)
    story_text = models.TextField(blank=True)
    source_url = models.URLField(blank=True)
    private_room = models.ForeignKey(PrivateRoom, blank=True, null=True, on_delete=models.SET_NULL, related_name='content_items')

    class Meta:
        ordering = ['-publish_date']

    def __str__(self):
        creator_name = self.creator.username if self.creator else 'Admin'
        return f"{self.title} by {creator_name}"


class Purchase(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='purchases', on_delete=models.CASCADE)
    content = models.ForeignKey(ContentItem, related_name='purchases', on_delete=models.CASCADE, blank=True, null=True)
    room = models.ForeignKey(PrivateRoom, related_name='purchases', on_delete=models.CASCADE, blank=True, null=True)
    purchased_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (
            ('user', 'content'),
            ('user', 'room'),
        )

    def __str__(self):
        target = self.content or self.room
        return f"Purchase by {self.user.username} -> {target}"


class Subscription(models.Model):
    subscriber = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='subscriptions', on_delete=models.CASCADE)
    creator = models.ForeignKey(Profile, related_name='subscribers', on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    active = models.BooleanField(default=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('subscriber', 'creator')

    def __str__(self):
        return f"{self.subscriber.username} subscribed to {self.creator.user.username}"


class Notification(models.Model):
    title = models.CharField(max_length=220)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification: {self.title}"

class ChatThread(models.Model):
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='creator_threads', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='user_threads', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('creator', 'user')

    def __str__(self):
        return f"Chat between {self.user.username} and {self.creator.username}"


class ChatMessage(models.Model):
    thread = models.ForeignKey(ChatThread, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.sender.username} at {self.created_at.isoformat()}"


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
