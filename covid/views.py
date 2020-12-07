from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.
def index(request):
    return render(request, "covid/index.html")

def info(request):
    return render(request, "covid/info.html")