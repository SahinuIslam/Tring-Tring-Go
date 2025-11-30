import firebase_admin
from firebase_admin import credentials

import os
from django.conf import settings

if not firebase_admin._apps:
    cred_path = os.path.join(settings.BASE_DIR, "firebase_key.json")
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
