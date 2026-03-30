from flask import Flask, jsonify, request
from flask_cors import CORS
from functools import wraps
import jwt
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo import MongoClient
import os
from bson import ObjectId
import uuid
from dotenv import load_dotenv

import firebase_admin
from firebase_admin import credentials, messaging
import cloudinary
import cloudinary.uploader

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Cloudinary configuration
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

CORS(
    app,
    resources={
        r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    }
)

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-super-secret-key-change-in-prod')

# ✅ MONGODB CONNECTION (ATLAS)
mongo_uri = os.getenv("MONGO_URI")

if not mongo_uri:
    raise Exception("❌ MONGO_URI not found in environment variables")

client = MongoClient(
    mongo_uri,
    tls=True,
    tlsAllowInvalidCertificates=True
)

try:
    client.admin.command('ping')
    print("✅ Connected to MongoDB Atlas")
except Exception as e:
    print(f"❌ MongoDB Atlas connection failed: {e}")

db = client["HelpHub"]

requests_collection = db.requests
users_collection = db.users
ngos_collection = db.ngos

# ✅ FIREBASE INIT — guard against missing credentials file
import json

firebase_json = os.getenv("FIREBASE_CREDENTIALS_JSON")

if not firebase_admin._apps:
    try:
        if firebase_json:
            cred_dict = json.loads(firebase_json)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized from ENV")
        else:
            print("⚠️ Firebase credentials not found. Push disabled.")
    except Exception as e:
        print(f"❌ Firebase init error: {e}")
# ✅ TWILIO SMS CONFIG
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "").strip()

try:
    from twilio.rest import Client as TwilioClient
    TWILIO_AVAILABLE = True
except ImportError:
    TwilioClient = None
    TWILIO_AVAILABLE = False

twilio_client = None
if TWILIO_AVAILABLE and TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER:
    try:
        twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        print("✅ Twilio SMS enabled")
    except Exception as e:
        print(f"❌ Twilio init failed: {e}")
        twilio_client = None
else:
    print("⚠️ Twilio SMS not configured or twilio package missing. SMS sending disabled.")


# -------------------------------------------------------------------
# HELPERS
# -------------------------------------------------------------------

def parse_object_id(value):
    try:
        return ObjectId(value)
    except Exception:
        return None


def serialize_doc(doc):
    if not doc:
        return doc
    doc = dict(doc)
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    for key, value in list(doc.items()):
        if isinstance(value, ObjectId):
            doc[key] = str(value)
    return doc


def send_sms(to_number, body):
    if not twilio_client:
        print("⚠️ SMS skipped: Twilio not configured")
        return {"sent": False, "error": "Twilio not configured"}

    if not to_number:
        return {"sent": False, "error": "Phone number missing"}

    try:
        message = twilio_client.messages.create(
            body=body[:1600],
            from_=TWILIO_PHONE_NUMBER,
            to=to_number
        )
        print(f"✅ SMS SENT TO {to_number}: {message.sid}")
        return {"sent": True, "sid": message.sid}
    except Exception as e:
        print(f"❌ SMS ERROR to {to_number}: {e}")
        return {"sent": False, "error": str(e)}


# ✅ FCM PUSH FUNCTION — only runs if Firebase is initialised
def send_push_to_all_users(request_data):
    if not firebase_admin._apps:
        print("⚠️ Push skipped: Firebase not initialised")
        return {"sent": 0, "failed": 0}

    sent = 0
    failed = 0

    users = list(users_collection.find({
        "fcm_token": {"$exists": True, "$ne": ""}
    }))

    for user in users:
        try:
            fcm_token = user.get("fcm_token", "").strip()
            if not fcm_token:
                continue

            message = messaging.Message(
                token=fcm_token,
                notification=messaging.Notification(
                    title="HelpHub Alert",
                    body=(
                        f"New {request_data.get('help_type', 'Help')} request at "
                        f"{request_data.get('location', 'N/A')}"
                    )[:120]
                ),
                data={
                    "help_type": str(request_data.get("help_type", "Help")),
                    "location": str(request_data.get("location", "N/A")),
                    "priority": str(request_data.get("priority", "Medium")),
                    "contact": str(request_data.get("contact", "N/A")),
                    "click_action": "OPEN_REQUESTS"
                },
                android=messaging.AndroidConfig(
                    priority="high",
                    notification=messaging.AndroidNotification(
                        sound="default",
                        channel_id="helphub_alerts"
                    )
                ),
                webpush=messaging.WebpushConfig(
                    notification=messaging.WebpushNotification(
                        title="HelpHub Alert",
                        body=(
                            f"New {request_data.get('help_type', 'Help')} request at "
                            f"{request_data.get('location', 'N/A')}"
                        )[:120]
                    )
                )
            )

            response = messaging.send(message)
            print(f"✅ PUSH SENT TO {user.get('email', 'unknown')}: {response}")
            sent += 1

        except Exception as e:
            failed += 1
            print(f"❌ FCM ERROR for user {user.get('_id')}: {e}")

            error_text = str(e).lower()
            if "registration-token-not-registered" in error_text or "invalid registration token" in error_text:
                users_collection.update_one(
                    {"_id": user["_id"]},
                    {"$unset": {"fcm_token": ""}}
                )

    return {"sent": sent, "failed": failed}


def send_sms_to_all_users(request_data):
    if not twilio_client:
        return {"sent": 0, "failed": 0}

    sms_sent = 0
    sms_failed = 0

    users = list(users_collection.find({
        "phone": {"$exists": True, "$ne": ""}
    }))

    sms_text = (
        f"HelpHub Alert: {request_data.get('help_type', 'Help')} needed at "
        f"{request_data.get('location', 'N/A')}. "
        f"Priority: {request_data.get('priority', 'Medium')}. "
        f"Contact: {request_data.get('contact', 'N/A')}"
    )

    for user in users:
        phone = user.get("phone", "").strip()
        if not phone:
            continue

        result = send_sms(phone, sms_text)
        if result.get("sent"):
            sms_sent += 1
        else:
            sms_failed += 1

    return {"sent": sms_sent, "failed": sms_failed}


# ✅ CREATE ADMIN USER ON STARTUP
def create_admin_user():
    admin_email = os.getenv("ADMIN_EMAIL", "admin@helphub.in")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")

    existing = users_collection.find_one({"email": admin_email})
    if not existing:
        users_collection.insert_one({
            "name": "Admin",
            "email": admin_email,
            "password": generate_password_hash(admin_password),
            "role": "admin",
            "phone": "",
            "fcm_token": "",
            "created_at": datetime.utcnow()
        })
        print(f"✅ Admin created: {admin_email}")
    else:
        print(f"✅ Admin already exists: {admin_email}")


create_admin_user()


def generate_token(user_id, role):
    payload = {
        'user_id': str(user_id),
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')


def get_current_user(token):
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload.get('user_id')
        if not user_id:
            return None
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if user:
            user['_id'] = str(user['_id'])
            return user
        return None
    except Exception:
        return None


# ✅ TOKEN DECORATOR
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS':
            return '', 200

        token = request.headers.get('Authorization')
        if not token or not token.startswith('Bearer '):
            return jsonify({'error': 'Token missing'}), 401

        token = token.split(' ')[1]
        current_user = get_current_user(token)

        if not current_user:
            return jsonify({'error': 'Invalid token'}), 401

        return f(current_user, *args, **kwargs)
    return decorated


# ✅ ADMIN LOGIN
# FIX: now reads from DB and issues a token with user_id so token_required works for admins too
@app.route('/api/admin/login', methods=['OPTIONS', 'POST'])
def admin_login():
    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.get_json() or {}
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()

        user = users_collection.find_one({"email": email, "role": "admin"})
        if user and check_password_hash(user['password'], password):
            token = generate_token(user['_id'], 'admin')
            return jsonify({
                'success': True,
                'token': token,
                'message': 'Admin login successful'
            }), 200

        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ✅ NGO ENDPOINTS
@app.route('/api/ngos', methods=['GET', 'OPTIONS'])
def get_ngos():
    if request.method == 'OPTIONS':
        return '', 200

    ngos = list(ngos_collection.find().sort("created_at", -1))
    ngos = [serialize_doc(ngo) for ngo in ngos]

    return jsonify({'success': True, 'ngos': ngos, 'count': len(ngos)})


@app.route('/api/ngos', methods=['POST', 'OPTIONS'])
def add_ngo():
    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.get_json() or {}
        ngo = {
            **data,
            '_id': str(uuid.uuid4()),
            'created_at': datetime.utcnow(),
            'active': True
        }
        ngos_collection.insert_one(ngo)
        return jsonify({'success': True, 'ngo': serialize_doc(ngo)}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/ngos/<ngo_id>', methods=['PUT', 'OPTIONS'])
def update_ngo(ngo_id):
    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.get_json() or {}
        result = ngos_collection.update_one(
            {'_id': ngo_id},
            {'$set': {**data, 'updated_at': datetime.utcnow()}}
        )
        return jsonify({'success': result.modified_count > 0})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/ngos/<ngo_id>', methods=['DELETE', 'OPTIONS'])
def delete_ngo(ngo_id):
    if request.method == 'OPTIONS':
        return '', 200

    try:
        result = ngos_collection.delete_one({'_id': ngo_id})
        return jsonify({'success': result.deleted_count > 0})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ✅ USER ROUTES
@app.route('/api/user/me', methods=['GET', 'OPTIONS'])
@token_required
def user_me(current_user):
    return jsonify({
        'success': True,
        'user': {
            'id': str(current_user['_id']),
            'name': current_user['name'],
            'email': current_user['email'],
            'role': current_user['role'],
            'phone': current_user.get('phone', ''),
            'fcm_token': current_user.get('fcm_token', '')
        }
    })


@app.route('/api/signup', methods=['POST', 'OPTIONS'])
def signup():
    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.get_json() or {}
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()
        name = data.get('name', 'User').strip()
        phone = data.get('phone', '').strip()
        fcm_token = data.get('fcm_token', '').strip()

        if not email or not password or not name or not phone:
            return jsonify({'success': False, 'error': 'Name, email, phone and password are required'}), 400

        if users_collection.find_one({"email": email}):
            return jsonify({'success': False, 'error': 'User already exists'}), 400

        user = {
            'name': name,
            'email': email,
            'password': generate_password_hash(password),
            'role': 'user',
            'phone': phone,
            'fcm_token': fcm_token,
            'created_at': datetime.utcnow()
        }

        result = users_collection.insert_one(user)
        token = generate_token(result.inserted_id, 'user')

        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': str(result.inserted_id),
                'name': name,
                'email': email,
                'phone': phone,
                'role': 'user',
                'fcm_token': fcm_token
            }
        }), 201

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.get_json() or {}
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()
        fcm_token = data.get('fcm_token', '').strip()

        user = users_collection.find_one({"email": email})

        if user and check_password_hash(user['password'], password):
            update_fields = {"last_login": datetime.utcnow()}
            if fcm_token:
                update_fields["fcm_token"] = fcm_token

            users_collection.update_one(
                {"_id": user["_id"]},
                {"$set": update_fields}
            )

            token = generate_token(user['_id'], user['role'])
            return jsonify({
                'success': True,
                'token': token,
                'user': {
                    'id': str(user['_id']),
                    'name': user['name'],
                    'email': user['email'],
                    'role': user['role'],
                    'phone': user.get('phone', ''),
                    'fcm_token': fcm_token or user.get('fcm_token', '')
                }
            })

        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'success': False, 'error': f'Login failed: {str(e)}'}), 400


# ✅ SAVE / UPDATE FCM TOKEN
@app.route('/api/user/fcm-token', methods=['POST', 'OPTIONS'])
@token_required
def save_fcm_token(current_user):
    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.get_json() or {}
        fcm_token = data.get('fcm_token', '').strip()

        if not fcm_token:
            return jsonify({'success': False, 'error': 'FCM token required'}), 400

        users_collection.update_one(
            {"_id": ObjectId(current_user['_id'])},
            {
                "$set": {
                    "fcm_token": fcm_token,
                    "fcm_updated_at": datetime.utcnow()
                }
            }
        )

        return jsonify({'success': True, 'message': 'FCM token saved'}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ✅ REMOVE FCM TOKEN ON LOGOUT
@app.route('/api/user/fcm-token', methods=['DELETE', 'OPTIONS'])
@token_required
def delete_fcm_token(current_user):
    if request.method == 'OPTIONS':
        return '', 200

    try:
        users_collection.update_one(
            {"_id": ObjectId(current_user['_id'])},
            {
                "$unset": {"fcm_token": ""},
                "$set": {"fcm_removed_at": datetime.utcnow()}
            }
        )
        return jsonify({'success': True, 'message': 'FCM token removed'}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ✅ CLOUDINARY PHOTO UPLOAD
@app.route('/api/upload-photo', methods=['POST', 'OPTIONS'])
@token_required
def upload_photo(current_user):
    if request.method == 'OPTIONS':
        return '', 200

    try:
        if 'photo' not in request.files:
            return jsonify({'success': False, 'error': 'No photo file uploaded'}), 400

        photo = request.files['photo']

        if photo.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400

        allowed = {'png', 'jpg', 'jpeg'}
        ext = photo.filename.rsplit('.', 1)[-1].lower()
        if ext not in allowed:
            return jsonify({'success': False, 'error': 'Only JPG, JPEG, PNG allowed'}), 400

        upload_result = cloudinary.uploader.upload(
            photo,
            folder="helphub_requests",
            public_id=f"req_{current_user['_id']}_{str(uuid.uuid4())}"
        )

        image_url = upload_result.get('secure_url', '')
        public_id = upload_result.get('public_id', '')

        return jsonify({
            'success': True,
            'image_url': image_url,
            'public_id': public_id
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ✅ REQUESTS ENDPOINTS
# FIX: added OPTIONS to the methods list so CORS preflight works;
#      switched to request.get_json() so JSON bodies are parsed correctly.
@app.route('/api/requests', methods=['POST', 'OPTIONS'])
@token_required
def create_request(current_user):
    if request.method == 'OPTIONS':
        return '', 200

    try:
        # Support both JSON body and multipart form (e.g. when photo is sent inline)
        if request.content_type and 'application/json' in request.content_type:
            data = request.get_json() or {}
        else:
            data = request.form

        request_data = {
            'help_type': data.get('type'),
            'description': data.get('description'),
            'location': data.get('location'),
            'contact': data.get('contact'),
            'priority': data.get('priority', 'Medium'),
            'photo': data.get('photo', ''),
            'latitude': data.get('latitude', ''),
            'longitude': data.get('longitude', ''),
            'createdBy': str(current_user['_id']),
            'created_at': datetime.utcnow(),
            'status': 'Pending',
        }

        result = requests_collection.insert_one(request_data)

        try:
            send_push_to_all_users(request_data)
            send_sms_to_all_users(request_data)
        except Exception as e:
            print(f"⚠️ Notification error after create_request: {e}")

        return jsonify({
            'success': True,
            'request_id': str(result.inserted_id),
            'id': str(result.inserted_id)
        }), 201

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/requests/unresolved', methods=['GET', 'OPTIONS'])
@token_required
def get_unresolved_requests(current_user):
    if request.method == 'OPTIONS':
        return '', 200

    all_requests = list(requests_collection.find({
        "status": {"$nin": ["Resolved ✅", "Completed"]},
        "createdBy": {"$ne": str(current_user['_id'])}
    }).sort("created_at", -1).limit(50))

    processed_requests = []
    for raw_req in all_requests:
        req = dict(raw_req)
        req['_id'] = str(req.get('_id'))

        created_by = req.get('createdBy')
        requester = None

        if created_by:
            try:
                requester = users_collection.find_one({"_id": ObjectId(str(created_by))})
            except Exception:
                requester = users_collection.find_one({"_id": created_by})

        if requester:
            req["requester_phone"] = requester.get('phone', "")
            req["requester_email"] = requester.get('email', "")
        else:
            req["requester_phone"] = ""
            req["requester_email"] = ""

        req["location"] = req.get("location", "Bhubaneswar, Odisha")
        req["priority"] = req.get("priority", "Medium")
        req["type"] = req.get("help_type", "General")
        req["status"] = req.get("status", "Pending")
        req["description"] = req.get("description", "Help needed")
        req["photo"] = req.get("photo", "")
        req["latitude"] = req.get("latitude", "")
        req["longitude"] = req.get("longitude", "")

        processed_requests.append(req)

    return jsonify({"success": True, "requests": processed_requests})


@app.route('/api/requests/<request_id>/resolve', methods=['POST', 'OPTIONS'])
@token_required
def resolve_request(current_user, request_id):
    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.get_json() or {}
        object_id = parse_object_id(request_id)
        if not object_id:
            return jsonify({'success': False, 'error': 'Invalid request id'}), 400

        result = requests_collection.update_one(
            {'_id': object_id},
            {'$set': {
                'status': data.get('status', 'Resolved ✅'),
                'resolvedBy': current_user['_id'],
                'resolvedByName': data.get('helperName', current_user['name']),
                'resolvedAt': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }}
        )
        return jsonify({'success': result.modified_count > 0}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/requests/my', methods=['GET', 'OPTIONS'])
@token_required
def get_my_requests(current_user):
    if request.method == 'OPTIONS':
        return '', 200

    try:
        my_requests = list(requests_collection.find({
            "createdBy": str(current_user['_id'])
        }).sort("created_at", -1))

        my_requests = [serialize_doc(req) for req in my_requests]

        return jsonify({"success": True, "requests": my_requests})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/requests/animal', methods=['GET', 'OPTIONS'])
@token_required
def get_animal_requests(current_user):
    if request.method == 'OPTIONS':
        return '', 200

    try:
        animal_requests = list(
            requests_collection.find({
                "help_type": {"$in": ["animal_rescue", "Rescue"]},
                "status": {"$nin": ["Resolved ✅", "Completed"]}
            }).sort("created_at", -1).limit(10)
        )

        processed = []
        for req in animal_requests:
            req = serialize_doc(req)
            requester = None
            created_by = req.get("createdBy")
            if created_by:
                try:
                    requester = users_collection.find_one({"_id": ObjectId(str(created_by))})
                except Exception:
                    requester = None
            req["requester_name"] = requester.get("name", "Anonymous") if requester else "Anonymous"
            processed.append(req)

        return jsonify({
            "success": True,
            "requests": processed,
            "count": len(processed)
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/requests/blood', methods=['GET', 'OPTIONS'])
@token_required
def get_blood_requests(current_user):
    if request.method == 'OPTIONS':
        return '', 200

    try:
        blood_requests = list(
            requests_collection.find({
                "help_type": {"$in": ["blood", "blood_request"]},
                "status": {"$nin": ["Resolved ✅", "Completed"]}
            }).sort("created_at", -1).limit(20)
        )

        processed = []
        for req in blood_requests:
            req = serialize_doc(req)
            requester = None
            created_by = req.get("createdBy")
            if created_by:
                try:
                    requester = users_collection.find_one({"_id": ObjectId(str(created_by))})
                except Exception:
                    requester = None
            req["requester_name"] = requester.get("name", "Anonymous") if requester else "Anonymous"
            processed.append(req)

        return jsonify({"success": True, "requests": processed})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/requests/animal/count', methods=['GET', 'OPTIONS'])
@token_required
def get_animal_requests_count(current_user):
    if request.method == 'OPTIONS':
        return '', 200

    try:
        count = requests_collection.count_documents({
            "help_type": {"$in": ["animal_rescue", "Rescue"]},
            "status": {"$nin": ["Resolved ✅", "Completed"]}
        })
        return jsonify({"success": True, "count": count})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ✅ MANUAL SMS TEST ENDPOINT
@app.route('/api/test-sms', methods=['POST', 'OPTIONS'])
@token_required
def test_sms(current_user):
    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.get_json() or {}
        to = data.get("phone", "").strip()
        body = data.get("message", "HelpHub test SMS").strip()

        if not to:
            return jsonify({"success": False, "error": "Phone is required"}), 400

        result = send_sms(to, body)
        if result.get("sent"):
            return jsonify({"success": True, "message": "SMS sent", "sid": result.get("sid")}), 200
        return jsonify({"success": False, "error": result.get("error", "SMS failed")}), 500

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/', methods=['GET'])
def health():
    return jsonify({
        'status': 'HelpHub API running ✅',
        'fcm': 'ACTIVE' if firebase_admin._apps else 'NOT CONFIGURED',
        'sms': 'ACTIVE' if twilio_client else 'NOT CONFIGURED'
    })


if __name__ == '__main__':
    print("🚀 HelpHub API: http://localhost:5000")
    print("✅ Admin: admin@helphub.in / admin123")
    print("✅ Firebase Cloud Messaging enabled" if firebase_admin._apps else "⚠️ FCM not configured")
    print("✅ Cloudinary photo upload enabled")
    print("✅ SMS enabled" if twilio_client else "⚠️ SMS not configured")
    # app.run(debug=True, port=5000)
    app.run(debug=True, port=5000, use_reloader=False)
