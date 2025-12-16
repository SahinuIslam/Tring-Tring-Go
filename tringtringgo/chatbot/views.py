# chatbot/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Avg

from .models import ChatMessage
from travel.models import Service, Place, Review  # adjust if your review model is named differently


def extract_area(text, keyword="near"):
    """
    Extract area name after the word 'near'.
    Example: 'hospitals near Dhanmondi' -> 'Dhanmondi'
    """
    parts = text.split(keyword, 1)
    if len(parts) < 2:
        return ""
    return parts[1].strip()


def format_service_detail(s: Service, index: int | None = None) -> str:
    """
    Return a numbered, multi-line string with full service details.

    Example:
    1. Apollo Hospital
       Area: Dhanmondi
       Address: ...
       Phone: ...
    """
    lines = []

    if index is not None:
        lines.append(f"{index}. {s.name}")
    else:
        lines.append(s.name)

    # Area
    area_line = None
    try:
        if s.area and getattr(s.area, "name", None):
            area_line = f"Area: {s.area.name}"
    except Exception:
        pass
    if not area_line and getattr(s, "area_name", None):
        area_line = f"Area: {s.area_name}"
    if area_line:
        lines.append(f"   {area_line}")

    # Optional fields (change names if your model is different)
    if getattr(s, "address", None):
        lines.append(f"   Address: {s.address}")
    if getattr(s, "phone", None):
        lines.append(f"   Phone: {s.phone}")
    if getattr(s, "open_hours", None):
        lines.append(f"   Open hours: {s.open_hours}")
    if getattr(s, "notes", None):
        lines.append(f"   Notes: {s.notes}")

    return "\n".join(lines)


def format_place_detail(p: Place, index: int | None = None, avg: float | None = None) -> str:
    """
    Return a numbered, multi-line string with place details.

    Example:
    1. Dhanmondi Lake
       Category: Park
       Area: Dhanmondi
       Rating: 4.5 stars ★★★★☆
    """
    lines = []

    # First line: number + name
    if index is not None:
        lines.append(f"{index}. {p.name}")
    else:
        lines.append(p.name)

    # Category
    try:
        category = p.get_category_display()
    except Exception:
        category = "Place"
    lines.append(f"   Category: {category}")

    # Area
    try:
        area_name = p.area.name
    except Exception:
        area_name = ""
    if area_name:
        lines.append(f"   Area: {area_name}")

    # Rating
    if avg is not None:
        avg_str = f"{avg:.1f}"
        full_stars = int(round(avg))
        full_stars = min(max(full_stars, 0), 5)
        stars = "★" * full_stars + "☆" * (5 - full_stars)
        lines.append(f"   Rating: {avg_str} stars {stars}")

    # Optional description/notes if your Place model has it
    if getattr(p, "description", None):
        lines.append(f"   About: {p.description}")

    return "\n".join(lines)


@api_view(["POST"])
@permission_classes([AllowAny])
def chat(request):
    message = request.data.get("message", "").strip()
    if not message:
        return Response({"reply": "Please send a message."})

    # save user message
    ChatMessage.objects.create(role="user", message=message)

    text = message.lower()

    # -------------------------------------------------
    # HISTORY (check before greetings so 'history' is not caught as 'hi')
    # -------------------------------------------------
    if "show history" in text or text.strip() == "history":
        msgs = ChatMessage.objects.order_by("-created_at")[:50]
        if not msgs:
            reply = "No chat history yet."
        else:
            lines = [f"{m.role}: {m.message}" for m in reversed(msgs)]
            reply = "\n".join(lines)

    # -------------------------------------------------
    # GREETINGS / HELP
    # -------------------------------------------------
    elif text.strip() in ("hi", "hello", "hey"):
        reply = (
            "👋 Hello! I’m here to help you find services and locations in your area. "
            "For a list of available commands, type help."
        )

    elif "help" in text:
        reply = (
            "You can try commands like:\n"
            "- hospitals near <area>\n"
            "- police near <area>\n"
            "- atm near <area>\n"
            "- pharmacy near <area>\n"
            "- transport near <area>\n"
            "- places near <area>\n"
            "- top places\n"
            "- all hospitals / all atms / all police etc.\n"
            "- show history"
        )

    # -------------------------------------------------
    # TOP PLACES (by average review stars) — numbered, detailed
    # -------------------------------------------------
    elif "top places" in text or ("top" in text and "places" in text):
        qs = (
            Place.objects
            .annotate(avg_rating=Avg("reviews__rating"))
            .order_by("-avg_rating")
        )[:10]

        if qs:
            lines = []
            for idx, p in enumerate(qs, start=1):
                avg = p.avg_rating if p.avg_rating is not None else 0
                detail = format_place_detail(p, index=idx, avg=avg)
                lines.append(detail)
            reply = "Top places by rating:\n\n" + "\n\n".join(lines)
        else:
            reply = "No places with reviews found."

    # -------------------------------------------------
    # ALL PLACES (no area filter) — numbered
    # -------------------------------------------------
    elif "all places" in text or (text.strip() == "places"):
        qs = Place.objects.all()[:50]
        if qs:
            lines = []
            for idx, p in enumerate(qs, start=1):
                detail = format_place_detail(p, index=idx, avg=None)
                lines.append(detail)
            reply = "All places:\n\n" + "\n\n".join(lines)
        else:
            reply = "No places found."

    # -------------------------------------------------
    # ALL SERVICES BY TYPE (NO AREA) — numbered, detailed
    # -------------------------------------------------
    elif "all hospitals" in text or (("hospital" in text or "hospitals" in text) and "near" not in text):
        qs = Service.objects.filter(category="HOSPITAL")[:20]
        if qs:
            items = [format_service_detail(s, index=i) for i, s in enumerate(qs, start=1)]
            reply = "All hospitals:\n\n" + "\n\n".join(items)
        else:
            reply = "No hospitals found."

    elif "all police" in text or ("police" in text and "near" not in text):
        qs = Service.objects.filter(category="POLICE")[:20]
        if qs:
            items = [format_service_detail(s, index=i) for i, s in enumerate(qs, start=1)]
            reply = "All police stations:\n\n" + "\n\n".join(items)
        else:
            reply = "No police stations found."

    elif "all atms" in text or ("atm" in text and "near" not in text):
        qs = Service.objects.filter(category="ATM")[:20]
        if qs:
            items = [format_service_detail(s, index=i) for i, s in enumerate(qs, start=1)]
            reply = "All ATMs:\n\n" + "\n\n".join(items)
        else:
            reply = "No ATMs found."

    elif "all pharmacies" in text or ("pharmacy" in text and "near" not in text):
        qs = Service.objects.filter(category="PHARMACY")[:20]
        if qs:
            items = [format_service_detail(s, index=i) for i, s in enumerate(qs, start=1)]
            reply = "All pharmacies:\n\n" + "\n\n".join(items)
        else:
            reply = "No pharmacies found."

    elif "all transport" in text or ("transport" in text and "near" not in text):
        qs = Service.objects.filter(category="TRANSPORT")[:20]
        if qs:
            items = [format_service_detail(s, index=i) for i, s in enumerate(qs, start=1)]
            reply = "All transport hubs:\n\n" + "\n\n".join(items)
        else:
            reply = "No transport hubs found."

    # -------------------------------------------------
    # SERVICES NEAR AREA — numbered, detailed
    # -------------------------------------------------
    elif "hospital" in text and "near" in text:
        area = extract_area(text)
        if not area:
            reply = "Please specify an area after 'near', e.g. 'hospitals near Dhanmondi'."
        else:
            qs = Service.objects.filter(category="HOSPITAL", area__name__icontains=area)[:10]
            if qs:
                items = [format_service_detail(s, index=i) for i, s in enumerate(qs, start=1)]
                reply = "Hospitals near " + area + ":\n\n" + "\n\n".join(items)
            else:
                reply = f"No hospitals found near {area}."

    elif "police" in text and "near" in text:
        area = extract_area(text)
        if not area:
            reply = "Please specify an area after 'near', e.g. 'police near Dhanmondi'."
        else:
            qs = Service.objects.filter(category="POLICE", area__name__icontains=area)[:10]
            if qs:
                items = [format_service_detail(s, index=i) for i, s in enumerate(qs, start=1)]
                reply = "Police stations near " + area + ":\n\n" + "\n\n".join(items)
            else:
                reply = f"No police stations found near {area}."

    elif "atm" in text and "near" in text:
        area = extract_area(text)
        if not area:
            reply = "Please specify an area after 'near', e.g. 'atm near Dhanmondi'."
        else:
            qs = Service.objects.filter(category="ATM", area__name__icontains=area)[:10]
            if qs:
                items = [format_service_detail(s, index=i) for i, s in enumerate(qs, start=1)]
                reply = "ATMs near " + area + ":\n\n" + "\n\n".join(items)
            else:
                reply = f"No ATMs found near {area}."

    elif ("pharmacy" in text or "pharmacies" in text) and "near" in text:
        area = extract_area(text)
        if not area:
            reply = "Please specify an area after 'near', e.g. 'pharmacy near Dhanmondi'."
        else:
            qs = Service.objects.filter(category="PHARMACY", area__name__icontains=area)[:10]
            if qs:
                items = [format_service_detail(s, index=i) for i, s in enumerate(qs, start=1)]
                reply = "Pharmacies near " + area + ":\n\n" + "\n\n".join(items)
            else:
                reply = f"No pharmacies found near {area}."

    elif "transport" in text and "near" in text:
        area = extract_area(text)
        if not area:
            reply = "Please specify an area after 'near', e.g. 'transport near Dhanmondi'."
        else:
            qs = Service.objects.filter(category="TRANSPORT", area__name__icontains=area)[:10]
            if qs:
                items = [format_service_detail(s, index=i) for i, s in enumerate(qs, start=1)]
                reply = "Transport hubs near " + area + ":\n\n" + "\n\n".join(items)
            else:
                reply = f"No transport hubs found near {area}."

    # -------------------------------------------------
    # PLACES NEAR AREA — numbered, detailed
    # -------------------------------------------------
    elif "places" in text and "near" in text:
        area = extract_area(text)
        if not area:
            reply = "Please specify an area after 'near', e.g. 'places near Dhanmondi'."
        else:
            qs = (
                Place.objects
                .filter(area__name__icontains=area)
                .annotate(avg_rating=Avg("reviews__rating"))
            )[:10]
            if qs:
                lines = []
                for idx, p in enumerate(qs, start=1):
                    avg = p.avg_rating if p.avg_rating is not None else None
                    detail = format_place_detail(p, index=idx, avg=avg)
                    lines.append(detail)
                reply = "Places near " + area + ":\n\n" + "\n\n".join(lines)
            else:
                reply = f"No places found near {area}."

    # -------------------------------------------------
    # DEFAULT FALLBACK
    # -------------------------------------------------
    else:
        reply = (
            "Sorry, I didn't understand. Try commands like:\n"
            "- hospitals near <area>\n"
            "- police near <area>\n"
            "- atm near <area>\n"
            "- pharmacy near <area>\n"
            "- transport near <area>\n"
            "- places near <area>\n"
            "- top places\n"
            "- all hospitals / all atms / all pharmacies / all police / all transport\n"
            "- show history"
        )

    # save bot reply
    ChatMessage.objects.create(role="bot", message=reply)
    return Response({"reply": reply})
