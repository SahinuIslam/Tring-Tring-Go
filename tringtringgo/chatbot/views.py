from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Place, Hospital, PoliceStation, ATM, Pharmacies, Transport, ChatMessage
from .serializers import PlaceSerializer, HospitalSerializer, PoliceStationSerializer, ATMSerializer, PharmaciesSerializer, TransportSerializer, ChatMessageSerializer
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
def atm_near(request):
    area = request.GET.get('area','')
    offices = ATM.objects.filter(area__icontains=area)[:10]
    return Response(ATMSerializer(offices, many=True).data)

@api_view(['GET'])
def pharmacies_near(request):
    area = request.GET.get('area','')
    offices = Pharmacies.objects.filter(area__icontains=area)[:10]
    return Response(PharmaciesSerializer(offices, many=True).data)

@api_view(['GET'])
def transport_near(request):
    area = request.GET.get('area','')
    offices = Transport.objects.filter(area__icontains=area)[:10]
    return Response(TransportSerializer(offices, many=True).data)

@api_view(['POST'])
def chat(request):
    data = request.data
    message = data.get('message', '').strip()
    if not message:
        return Response({'reply': 'Please send a message.'})

    # save user message
    ChatMessage.objects.create(role='user', message=message)

    text = message.lower()

    # top places
    if any(k in text for k in ['top place', 'top places', 'top-rated', 'top recommended']):
        places = Place.objects.order_by('-rating')[:5]
        if places:
            reply_lines = [f"{p.name} — rating: {p.rating}" for p in places]
            reply = "Top places:\n" + "\n".join(reply_lines)
        else:
            reply = "No places found."

    # hospitals near <area>
    elif 'hospital' in text and 'near' in text:
        area = text.split('near')[-1].strip()
        hospitals = Hospital.objects.filter(area__icontains=area)[:10]
        if hospitals:
            reply = 'Hospitals near ' + area + ': ' + ', '.join(h.name for h in hospitals)
        else:
            reply = f'No hospitals found near {area}.'

    # police near <area>
    elif 'police' in text and 'near' in text:
        area = text.split('near')[-1].strip()
        stations = PoliceStation.objects.filter(area__icontains=area)[:10]
        if stations:
            reply = 'Police stations near ' + area + ': ' + ', '.join(s.name for s in stations)
        else:
            reply = f'No police stations found near {area}.'

    # ATM near <area>
    elif 'atm' in text and 'near' in text:
        area = text.split('near')[-1].strip()
        atms = ATM.objects.filter(area__icontains=area)[:10]
        if atms:
            reply = 'ATMs near ' + area + ': ' + ', '.join(a.name for a in atms)
        else:
            reply = f'No ATMs found near {area}.'

    # pharmacy near <area>
    elif ('pharmacy' in text or 'pharmacies' in text) and 'near' in text:
        area = text.split('near')[-1].strip()
        pharms = Pharmacies.objects.filter(area__icontains=area)[:10]
        if pharms:
            reply = 'Pharmacies near ' + area + ': ' + ', '.join(p.name for p in pharms)
        else:
            reply = f'No pharmacies found near {area}.'

    # transport near <area>
    elif 'transport' in text and 'near' in text:
        area = text.split('near')[-1].strip()
        transports = Transport.objects.filter(area__icontains=area)[:10]
        if transports:
            reply = 'Transport hubs near ' + area + ': ' + ', '.join(t.name for t in transports)
        else:
            reply = f'No transport hubs found near {area}.'

    # history
    elif 'history' in text or 'show history' in text:
        msgs = ChatMessage.objects.order_by('-created_at')[:50]
        reply = '\n'.join(f"{m.role}: {m.message}" for m in reversed(msgs))

    # default fallback
    else:
        reply = (
            "Sorry, I didn't understand. Try commands like:\n"
            "- top places\n"
            "- hospital near <place>\n"
            "- police near <place>\n"
            "- atm near <place>\n"
            "- pharmacy near <place>\n"
            "- transport near <place>\n"
            "Or use /api/places-search?q=... ."
        )

    # save bot reply
    ChatMessage.objects.create(role='bot', message=reply)
    return Response({'reply': reply})
