from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('stories/', views.stories, name='stories'),
    path('age-gate/', views.age_gate, name='age_gate'),
    path('content/<int:pk>/', views.detail, name='content_detail'),
]
