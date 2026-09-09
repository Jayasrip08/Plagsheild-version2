import time
from django.contrib.auth.hashers import make_password, check_password
from firebase_admin import firestore
from core.firestore import get_db

# ----------------------------------------------------
# USER OPERATIONS (FIRESTORE)
# ----------------------------------------------------

def create_firestore_user(username, email, password, role='b2c_student', first_name='', last_name='', phone='', college_name='', department=''):
    """
    Creates a new user directly in Firestore 'users' collection.
    """
    db = get_db()
    if not db:
        raise Exception("Firestore database is not connected.")

    # Check if user already exists
    users_ref = db.collection('users')
    email_query = users_ref.where('email', '==', email.lower()).get()
    if len(email_query) > 0:
        return None, "Email address is already registered."

    user_id = str(int(time.time() * 1000))
    user_doc = {
        'id': user_id,
        'username': username,
        'email': email.lower(),
        'password': make_password(password),
        'role': role,
        'first_name': first_name,
        'last_name': last_name,
        'phone': phone,
        'college_name': college_name,
        'department': department,
        'is_active': True,
        'created_at': firestore.SERVER_TIMESTAMP
    }
    
    users_ref.document(user_id).set(user_doc)
    print(f"Firestore: Created user {username} ({user_id})")
    return user_doc, None

def get_firestore_user_by_email_or_username(identifier):
    """
    Finds a user document by email or username in Firestore.
    """
    db = get_db()
    if not db:
        return None

    users_ref = db.collection('users')
    # Try email search
    q1 = users_ref.where('email', '==', identifier.lower()).get()
    if q1:
        return q1[0].to_dict()

    # Try username search
    q2 = users_ref.where('username', '==', identifier).get()
    if q2:
        return q2[0].to_dict()

    return None

def verify_firestore_user_password(identifier, password):
    """
    Verifies user credentials against Firestore user record.
    """
    user = get_firestore_user_by_email_or_username(identifier)
    if not user:
        return None, "Invalid username/email or password"
    
    if not user.get('is_active', True):
        return None, "Account is disabled"

    if check_password(password, user['password']):
        return user, None
    else:
        return None, "Invalid username/email or password"


# ----------------------------------------------------
# ORDER OPERATIONS (FIRESTORE)
# ----------------------------------------------------

def create_firestore_order(user_id, username, email, paper_title, word_count, price, package_tier, is_express, is_b2b=False, author_name='', author_email='', department='General'):
    """
    Creates an Order document directly in Firestore 'orders' collection.
    """
    db = get_db()
    if not db:
        raise Exception("Firestore database is not connected.")

    order_id = str(int(time.time() * 1000))
    status = 'Submitted' if is_b2b else 'Pending Payment'
    
    order_doc = {
        'id': order_id,
        'user_id': str(user_id),
        'username': username,
        'email': email,
        'paper_title': paper_title,
        'word_count': word_count,
        'price': float(price),
        'status': status,
        'package_tier': package_tier,
        'is_express': is_express,
        'is_b2b': is_b2b,
        'author_name': author_name,
        'author_email': author_email,
        'department': department,
        'similarity_score': None,
        'report_file_url': '',
        'created_at': firestore.SERVER_TIMESTAMP
    }

    db.collection('orders').document(order_id).set(order_doc)
    print(f"Firestore: Created order #{order_id} for user {username}")
    return order_doc

def get_firestore_orders_for_user(user_id):
    """
    Fetches all orders belonging to a specific user from Firestore.
    """
    db = get_db()
    if not db:
        return []

    docs = db.collection('orders').where('user_id', '==', str(user_id)).get()
    orders = [doc.to_dict() for doc in docs]
    orders.sort(key=lambda x: x.get('id', ''), reverse=True)
    return orders

def get_all_firestore_orders(search_query='', status_filter=''):
    """
    Fetches all orders from Firestore (for Super Admin queue).
    """
    db = get_db()
    if not db:
        return []

    query = db.collection('orders')
    docs = query.get()
    orders = []

    for doc in docs:
        data = doc.to_dict()
        # Exclude pending payment for admin queue if needed
        if status_filter and data.get('status', '').lower() != status_filter.lower():
            continue

        if search_query:
            sq = search_query.lower()
            u_name = str(data.get('username', '')).lower()
            p_title = str(data.get('paper_title', '')).lower()
            a_name = str(data.get('author_name', '')).lower()
            o_id = str(data.get('id', ''))
            if not (sq in u_name or sq in p_title or sq in a_name or sq == o_id):
                continue
        
        orders.append(data)

    orders.sort(key=lambda x: x.get('id', ''), reverse=True)
    return orders

def update_firestore_order_status(order_id, status, similarity_score=None, report_file_url=''):
    """
    Updates status and report details of an order directly in Firestore.
    """
    db = get_db()
    if not db:
        return False

    doc_ref = db.collection('orders').document(str(order_id))
    update_data = {
        'status': status,
        'updated_at': firestore.SERVER_TIMESTAMP
    }
    if similarity_score is not None:
        update_data['similarity_score'] = float(similarity_score)
    if report_file_url:
        update_data['report_file_url'] = report_file_url

    doc_ref.set(update_data, merge=True)
    print(f"Firestore: Updated order #{order_id} -> {status}")
    return True
