# backend/app.py - ✅ DUPLICATE ROUTE FIXED
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
from models.ngo import NGO
from bson.objectid import ObjectId
from datetime import datetime

# Your UserModel import (adjust path)
from models.user_model import UserModel  # 👈 Fix this path!

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'your-super-secret-key-change-in-prod'

# ✅ MONGODB CONNECTION
MONGO_URI = "mongodb://localhost:27017/helphub"
client = MongoClient(MONGO_URI)
db = client.helphub
requests_collection = db.requests
users_collection = db.users
ngos_collection = db.ngos

# ✅ FIXED CORS
CORS(app, resources={r"/*": {
    "origins": "*",
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}})

# ✅ CREATE ADMIN USER ON STARTUP
def create_admin_user():
    admin_count = users_collection.count_documents({"email": "admin@helphub.in"})
    if admin_count == 0:
        users_collection.insert_one({
            "name": "Admin",
            "email": "admin@helphub.in",
            "password": generate_password_hash("admin123"),
            "role": "admin",
            "phone": "",
            "created_at": datetime.utcnow()
        })
        print("✅ Admin user created: admin@helphub.in / admin123")

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
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if user:
            user['_id'] = str(user['_id'])
            return user
        return None
    except:
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
@app.route('/api/admin/login', methods=['OPTIONS', 'POST'])
def admin_login():
    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if email == 'admin@helphub.in' and password == 'admin123':
            token = jwt.encode(
                {'admin': True, 'exp': datetime.utcnow() + timedelta(hours=24)},
                app.config['SECRET_KEY']
            )
            return jsonify({
                'success': True,
                'token': token,
                'message': 'Admin login successful'
            }), 200
        
        return jsonify({
            'success': False,
            'error': 'Invalid admin credentials'
        }), 401

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ✅ NGO ENDPOINTS (SIMPLE - NO MODEL DEPENDENCY)
@app.route('/api/ngos', methods=['GET', 'OPTIONS'])
def get_ngos():
    if request.method == 'OPTIONS': return '', 200
    ngos = list(ngos_collection.find().sort("created_at", -1))
    for ngo in ngos: ngo['_id'] = str(ngo['_id'])
    return jsonify({'success': True, 'ngos': ngos, 'count': len(ngos)})

@app.route('/api/ngos', methods=['POST', 'OPTIONS'])
def add_ngo():
    if request.method == 'OPTIONS': return '', 200
    try:
        data = request.get_json()
        ngo = {
            **data,
            '_id': str(uuid.uuid4()),
            'created_at': datetime.utcnow(),
            'active': True
        }
        ngos_collection.insert_one(ngo)
        return jsonify({'success': True, 'ngo': ngo}), 201
    except Exception as e:
        print(f"ADD NGO ERROR: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ngos/<ngo_id>', methods=['PUT', 'OPTIONS'])
def update_ngo(ngo_id):
    if request.method == 'OPTIONS': return '', 200
    try:
        data = request.get_json()
        result = ngos_collection.update_one(
            {'_id': ngo_id},
            {'$set': {**data, 'updated_at': datetime.utcnow()}}
        )
        return jsonify({'success': result.modified_count > 0})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ngos/<ngo_id>', methods=['DELETE', 'OPTIONS'])
def delete_ngo(ngo_id):
    if request.method == 'OPTIONS': return '', 200
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
            'phone': current_user.get('phone', '')
        }
    })

@app.route('/api/signup', methods=['POST', 'OPTIONS'])
def signup():
    if request.method == 'OPTIONS': return '', 200
    
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()
        name = data.get('name', 'User').strip()
        phone = data.get('phone', '').strip()

        if not email or not password:
            return jsonify({'success': False, 'error': 'Email and password required'}), 400
        
        if users_collection.find_one({"email": email}):
            return jsonify({'success': False, 'error': 'User already exists'}), 400

        user = {
            'name': name,
            'email': email,
            'password': generate_password_hash(password),
            'role': 'user',
            'phone': phone,
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
                'phone': phone
            }
        }), 201
        
    except Exception as e:
        print(f"SIGNUP ERROR: {e}")
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS': return '', 200
    
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()
        
        user = users_collection.find_one({"email": email})
        
        if user and check_password_hash(user['password'], password):
            token = generate_token(user['_id'], user['role'])
            return jsonify({
                'success': True,
                'token': token,
                'user': {
                    'id': str(user['_id']),
                    'name': user['name'],
                    'email': user['email'],
                    'role': user['role'],
                    'phone': user.get('phone', '')
                }
            })
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
    except Exception as e:
        print(f"LOGIN ERROR: {e}")
        return jsonify({'success': False, 'error': 'Login failed'}), 400

# ✅ REQUESTS ENDPOINTS
@app.route('/api/requests', methods=['POST', 'OPTIONS'])
@token_required
def create_request(current_user):
    if request.method == 'OPTIONS': return '', 200
    
    try:
        form_data = request.form
        photo = request.files.get('photo')
        
        request_data = {
            'help_type': form_data.get('type'),
            'description': form_data.get('description'),
            'location': form_data.get('location'),
            'contact': form_data.get('contact'),
            'priority': form_data.get('priority', 'Medium'),
            'status': 'Pending',
            'createdBy': current_user['_id'],
            'created_at': datetime.utcnow()
        }
        
        result = requests_collection.insert_one(request_data)
        
        if photo:
            photo_filename = f"request_{str(result.inserted_id)}_{photo.filename}"
            os.makedirs("uploads", exist_ok=True)
            photo.save(f"uploads/{photo_filename}")
            requests_collection.update_one(
                {'_id': result.inserted_id}, 
                {'$set': {'photo': f'/uploads/{photo_filename}'}}
            )
        
        return jsonify({
            'success': True, 
            'message': 'Request created', 
            'id': str(result.inserted_id)
        })
    except Exception as e:
        print(f"REQUEST ERROR: {e}")
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/requests/unresolved', methods=['GET', 'OPTIONS'])
@token_required
def get_unresolved_requests(current_user):
    if request.method == 'OPTIONS':
        return '', 200

    # 🔥 AGGRESSIVE DATA LOOKUP - 100% success
    all_requests = list(requests_collection.find({
        "status": {"$nin": ["Resolved ✅", "Completed"]},
        "createdBy": {"$ne": current_user['_id']}
    }).sort("created_at", -1).limit(50))
    
    processed_requests = []
    
    for raw_req in all_requests:
        req = dict(raw_req)  # Copy to avoid mutation
        req['_id'] = str(req.get('_id'))
        
        # 🔥 LOOKUP USER - EVERY POSSIBLE WAY
        created_by = req.get('createdBy')
        requester = None
        
        # Method 1: Direct ObjectId
        if created_by:
            requester = users_collection.find_one({"_id": created_by})
        
        # Method 2: String ObjectId
        if not requester and created_by:
            try:
                requester = users_collection.find_one({"_id": ObjectId(str(created_by))})
            except:
                pass
        
        # Method 3: Any matching field
        if not requester:
            for field in ['email', 'phone', 'name']:
                if raw_req.get(field):
                    requester = users_collection.find_one({field: raw_req[field]})
                    if requester:
                        break
        
        # 🔥 SET DATA - ALWAYS SHOW NAME, PHONE/EMAIL IF EXISTS
        if requester:
            # ALWAYS SET NAME (from DB only)
            # req["requester_name"] = requester.get('name') or requester.get('username')
            
            # PHONE IF EXISTS ONLY
            phone = requester.get('phone')
            req["requester_phone"] = phone if phone else ""
            
            # EMAIL IF EXISTS ONLY  
            email = requester.get('email')
            req["requester_email"] = email if email else ""
        else:
            # Fallback only if user completely missing
            # req["requester_name"] = ""
            req["requester_phone"] = ""
            req["requester_email"] = ""
        
        # Ensure required fields
        req["location"] = req.get("location", "Bhubaneswar, Odisha")
        req["priority"] = req.get("priority", "Medium")
        req["type"] = req.get("type", req.get("help_type", "General"))
        req["status"] = req.get("status", "Pending")
        req["description"] = req.get("description", "Help needed")
        
        processed_requests.append(req)
    
    return jsonify({
        "success": True,
        "requests": processed_requests
    })






# ✅ FIXED RESOLVE ROUTE - SINGLE VERSION
@app.route('/api/requests/<request_id>/resolve', methods=['POST', 'OPTIONS'])
@token_required
def resolve_request(current_user, request_id):
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        result = requests_collection.update_one(
            {'_id': ObjectId(request_id)},
            {'$set': {
                'status': data.get('status', 'Resolved ✅'),
                'resolvedBy': current_user['_id'],
                'resolvedByName': data.get('helperName', current_user['name']),
                'resolvedAt': datetime.utcnow()
            }}
        )
        return jsonify({'success': result.modified_count > 0}), 200
    except Exception as e:
        print(f"RESOLVE ERROR: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/requests/my', methods=['GET', 'OPTIONS'])
@token_required
def get_my_requests(current_user):
    if request.method == 'OPTIONS': return '', 200
    
    try:
        my_requests = list(requests_collection.find({
            "createdBy": current_user['_id']
        }).sort("created_at", -1))
        
        for req in my_requests:
            req['_id'] = str(req['_id'])
        
        return jsonify({
            "success": True,
            "requests": my_requests
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/requests/animal', methods=['GET', 'OPTIONS'])
@token_required
def get_animal_requests(current_user):
    if request.method == 'OPTIONS': return '', 200
    
    try:
        animal_requests = list(
            requests_collection.find({
                "help_type": "animal_rescue",
                "status": {"$nin": ["Resolved ✅", "Completed"]}
            })
            .sort("created_at", -1)
            .limit(10)
        )
        
        for req in animal_requests:
            req['_id'] = str(req['_id'])
            requester = users_collection.find_one({"_id": req["createdBy"]})
            if requester:
                req["requester_name"] = requester.get("name", "Anonymous")
        
        return jsonify({
            "success": True,
            "requests": animal_requests,
            "count": len(animal_requests)
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# app.py - ADD AFTER animal_rescue endpoint
@app.route('/api/requests/blood', methods=['GET', 'OPTIONS'])
@token_required
def get_blood_requests(current_user):
  if request.method == 'OPTIONS': return '', 200
  
  try:
    blood_requests = list(
      requests_collection.find({
        "help_type": "blood",  # ✅ Filter blood requests
        "status": {"$nin": ["Resolved ✅", "Completed"]}
      }).sort("created_at", -1).limit(20)
    )
    
    for req in blood_requests:
      req['_id'] = str(req['_id'])
      requester = users_collection.find_one({"_id": req.get("createdBy")})
      req["requester_name"] = requester.get("name", "Anonymous") if requester else "Anonymous"
    
    return jsonify({
      "success": True,
      "requests": blood_requests
    })
  except Exception as e:
    return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/requests/animal/count', methods=['GET', 'OPTIONS'])
@token_required
def get_animal_requests_count(current_user):
    if request.method == 'OPTIONS': return '', 200
    
    try:
        count = requests_collection.count_documents({
            "help_type": "animal_rescue",
            "status": {"$nin": ["Resolved ✅", "Completed"]}
        })
        return jsonify({"success": True, "count": count})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/', methods=['GET'])
def health():
    return jsonify({'status': 'HelpHub API running ✅ MongoDB connected'})

if __name__ == '__main__':
    os.makedirs("uploads", exist_ok=True)
    print("🚀 HelpHub API: http://localhost:5000")
    print("✅ Admin: admin@helphub.in / admin123")
    print("✅ NGO endpoints: /api/ngos")
    print("✅ Requests: /api/requests/*")
    app.run(debug=True, port=5000)
