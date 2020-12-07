from django.urls import path
from . import views

urlpatterns = [
    path("", views.info, name="info"),
    path("dashboard", views.index, name="index")
]