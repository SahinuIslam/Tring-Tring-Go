from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Place, Hospital, PoliceStation, PostOffice, ChatMessage
from .serializers import PlaceSerializer, HospitalSerializer, PoliceStationSerializer, PostOfficeSerializer, ChatMessageSerializer
from django.db.models import Q

@api_view(['GET'])
def top_places(request):
    places = Place.objects.order_by('-rating')[:10]
    return Response(PlaceSerializer(places, many=True).data)

@api_view(['GET'])
def places_search(request):
    q = request.GET.get('q','')
    places = Place.objects.filter(Q(name__icontains=q) | Q(area__icontains=q)).order_by('-rating')[:10]
    return Response(PlaceSerializer(places, many=True).data)

@api_view(['GET'])
def hospitals_near(request):
    area = request.GET.get('area','')
    hospitals = Hospital.objects.filter(area__icontains=area)[:10]
    return Response(HospitalSerializer(hospitals, many=True).data)

@api_view(['GET'])
def police_near(request):
    area = request.GET.get('area','')
    stations = PoliceStation.objects.filter(area__icontains=area)[:10]
    return Response(PoliceStationSerializer(stations, many=True).data)

@api_view(['GET'])
def postoffice_near(request):
    area = request.GET.get('area','')
    offices = PostOffice.objects.filter(area__icontains=area)[:10]
    return Response(PostOfficeSerializer(offices, many=True).data)

@api_view(['POST'])
def chat(request):
    data = request.data
    message = data.get('message','').strip()
    if not message:
        return Response({'reply':'Please send a message.'})
    ChatMessage.objects.create(role='user', message=message)
    text = message.lower()
    if any(k in text for k in ['top place', 'top places', 'top-rated', 'top recommended']):
        places = Place.objects.order_by('-rating')[:5]
        if places:
            reply_lines = [f"{p.name} — rating: {p.rating}" for p in places]
            reply = "Top places:\n" + "\n".join(reply_lines)
        else:
            reply = "No places found."
    elif 'hospital' in text and 'near' in text:
        area = text.split('near')[-1].strip()
        hospitals = Hospital.objects.filter(area__icontains=area)[:10]
        if hospitals:
            reply = 'Hospitals near ' + area + ': ' + ', '.join([h.name for h in hospitals])
        else:
            reply = f'No hospitals found near {area}.'
    elif 'police' in text and 'near' in text:
        area = text.split('near')[-1].strip()
        stations = PoliceStation.objects.filter(area__icontains=area)[:10]
        if stations:
            reply = 'Police stations near ' + area + ': ' + ', '.join([s.name for s in stations])
        else:
            reply = f'No police stations found near {area}.'
    elif 'post office' in text and 'near' in text:
        area = text.split('near')[-1].strip()
        offices = PostOffice.objects.filter(area__icontains=area)[:10]
        if offices:
            reply = 'Post offices near ' + area + ': ' + ', '.join([o.name for o in offices])
        else:
            reply = f'No post offices found near {area}.'
    elif 'history' in text or 'show history' in text:
        msgs = ChatMessage.objects.order_by('-created_at')[:50]
        reply = '\n'.join([f"{m.role}: {m.message}" for m in msgs[::-1]])
    else:
        reply = ("Sorry, I didn't understand. Try commands like:\n"
                 "- top places\n"
                 "- hospital near <place>\n"
                 "- police near <place>\n"
                 "- post office near <place>\n"
                 "Or use /api/places-search?q=... .")
    ChatMessage.objects.create(role='bot', message=reply)
    return Response({'reply': reply})
