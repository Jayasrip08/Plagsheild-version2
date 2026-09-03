import os
import json
import firebase_admin
from firebase_admin import credentials, firestore, storage
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
cred_file = BASE_DIR / 'firebase-key.json'
DEFAULT_BUCKET = os.environ.get('FIREBASE_STORAGE_BUCKET', 'plagiarism-platform-4f7f5.appspot.com')

def init_firebase():
    if firebase_admin._apps:
        return
    
    options = {'storageBucket': DEFAULT_BUCKET}

    if os.path.exists(cred_file):
        try:
            cred = credentials.Certificate(str(cred_file))
            firebase_admin.initialize_app(cred, options)
            print(f"Firebase Admin & Storage initialized using firebase-key.json (bucket: {DEFAULT_BUCKET})")
        except Exception as e:
            print(f"Error loading firebase-key.json: {e}")
    elif os.environ.get('FIREBASE_CREDENTIALS_JSON'):
        try:
            cred_dict = json.loads(os.environ.get('FIREBASE_CREDENTIALS_JSON'))
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred, options)
            print(f"Firebase Admin & Storage initialized using FIREBASE_CREDENTIALS_JSON env var (bucket: {DEFAULT_BUCKET})")
        except Exception as e:
            print(f"Error initializing Firebase from env var: {e}")
    else:
        print("Warning: Neither firebase-key.json nor FIREBASE_CREDENTIALS_JSON env var found.")

def get_db():
    init_firebase()
    if firebase_admin._apps:
        return firestore.client()
    return None

def get_storage_bucket():
    init_firebase()
    if firebase_admin._apps:
        try:
            return storage.bucket()
        except Exception as e:
            print(f"Firebase Storage Bucket Error: {e}")
    return None
