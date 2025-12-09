from django.contrib import admin
from .models import Place, Hospital, PoliceStation, PostOffice, ChatMessage

admin.site.register(Place)
admin.site.register(Hospital)
admin.site.register(PoliceStation)
admin.site.register(PostOffice)
admin.site.register(ChatMessage)
#admin.site.register()