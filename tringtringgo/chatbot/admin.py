from django.contrib import admin
from .models import Place, Hospital, PoliceStation, ATM, Pharmacies, Transport, ChatMessage

admin.site.register(Place)
admin.site.register(Hospital)
admin.site.register(PoliceStation)
admin.site.register(ATM)
admin.site.register(Pharmacies)
admin.site.register(Transport)
admin.site.register(ChatMessage)