from django.contrib import admin
from .models import ContentItem, Profile, PrivateRoom, Purchase, Notification, DatingSwipe, DatingMatch


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_creator', 'dating_profile_public', 'dating_profile_complete', 'created_at')
    list_filter = ('is_creator', 'dating_profile_public', 'dating_profile_complete')
    search_fields = ('user__username', 'bio', 'dating_interests', 'dating_location')


@admin.register(PrivateRoom)
class PrivateRoomAdmin(admin.ModelAdmin):
    list_display = ('title', 'creator', 'price', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('title', 'creator__username', 'description')


@admin.register(ContentItem)
class ContentItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'creator', 'content_type', 'price', 'is_paid', 'is_published', 'age_restricted', 'show_on_home', 'publish_date')
    list_filter = ('content_type', 'is_published', 'age_restricted', 'is_paid', 'show_on_home')
    search_fields = ('title', 'description', 'story_text', 'creator__username')
    readonly_fields = ('publish_date',)
    
    def save_model(self, request, obj, form, change):
        # When content is created/edited via the admin panel, do not attribute it
        # to the admin user as a creator — leave creator as None so it appears
        # as platform content on the public videos page.
        if request.user.is_staff:
            obj.creator = None
            # Admin content shouldn't be featured on home by default
            obj.show_on_home = False
        super().save_model(request, obj, form, change)


@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
    list_display = ('user', 'content', 'room', 'purchased_at')
    list_filter = ('purchased_at',)
    search_fields = ('user__username', 'content__title', 'room__title')


@admin.register(DatingSwipe)
class DatingSwipeAdmin(admin.ModelAdmin):
    list_display = ('user', 'target', 'direction', 'created_at')
    list_filter = ('direction', 'created_at')
    search_fields = ('user__username', 'target__username')


@admin.register(DatingMatch)
class DatingMatchAdmin(admin.ModelAdmin):
    list_display = ('user1', 'user2', 'matched_at')
    list_filter = ('matched_at',)
    search_fields = ('user1__username', 'user2__username')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('title', 'message')
    readonly_fields = ('created_at',)

