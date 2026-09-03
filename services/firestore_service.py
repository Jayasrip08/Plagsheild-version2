from firebase_admin import firestore
from core.firestore import get_db

def save_user_to_firestore(user):
    """
    Saves or updates a User document in Firestore collection 'users'
    """
    try:
        db = get_db()
        if not db:
            return
        
        doc_ref = db.collection('users').document(str(user.id))
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': getattr(user, 'role', 'b2c_student'),
            'first_name': getattr(user, 'first_name', ''),
            'last_name': getattr(user, 'last_name', ''),
            'phone': getattr(user, 'phone', '') or '',
            'department': getattr(user, 'department', '') or '',
            'college_name': user.college.college_name if getattr(user, 'college', None) else '',
            'is_active': user.is_active,
            'updated_at': firestore.SERVER_TIMESTAMP,
        }
        doc_ref.set(user_data, merge=True)
        print(f"Firestore Sync: Saved user #{user.id} ({user.username}) to Firestore.")
    except Exception as e:
        print(f"Firestore Sync Warning (save_user): {e}")

def save_order_to_firestore(order):
    """
    Saves or updates an Order document in Firestore collection 'orders'
    """
    try:
        db = get_db()
        if not db:
            return
        
        doc_ref = db.collection('orders').document(str(order.id))
        order_data = {
            'id': order.id,
            'user_id': order.user.id,
            'username': order.user.username,
            'email': order.user.email,
            'paper_title': getattr(order, 'paper_title', '') or '',
            'word_count': order.word_count,
            'price': float(order.price),
            'status': order.status,
            'package_tier': getattr(order, 'package_tier', 'check'),
            'is_express': getattr(order, 'is_express', False),
            'author_name': getattr(order, 'author_name', '') or '',
            'author_email': getattr(order, 'author_email', '') or '',
            'created_at': firestore.SERVER_TIMESTAMP,
        }
        doc_ref.set(order_data, merge=True)
        print(f"Firestore Sync: Saved order #{order.id} to Firestore.")
    except Exception as e:
        print(f"Firestore Sync Warning (save_order): {e}")
