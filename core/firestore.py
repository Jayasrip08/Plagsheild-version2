import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
cred_file = BASE_DIR / 'firebase-key.json'

def init_firebase():
    if firebase_admin._apps:
        return
    
    if os.path.exists(cred_file):
        try:
            cred = credentials.Certificate(str(cred_file))
            firebase_admin.initialize_app(cred)
            print("Firebase Admin initialized successfully using firebase-key.json")
        except Exception as e:
            print(f"Error loading firebase-key.json: {e}")
    elif os.environ.get('FIREBASE_CREDENTIALS_JSON'):
        try:
            cred_dict = json.loads(os.environ.get('FIREBASE_CREDENTIALS_JSON'))
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin initialized successfully using FIREBASE_CREDENTIALS_JSON env var")
        except Exception as e:
            print(f"Error initializing Firebase from env var: {e}")
    else:
        print("Warning: Neither firebase-key.json nor FIREBASE_CREDENTIALS_JSON env var found.")

def get_db():
    init_firebase()
    if firebase_admin._apps:
        return firestore.client()
    return None
