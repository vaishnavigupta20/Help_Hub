# backend/models/ngo.py - ✅ NGO MODEL
from datetime import datetime
from bson import ObjectId
import uuid

class NGO:
    def __init__(self, name, description="", phone="", upi="", color="#FF6B35", active=True):
        self._id = str(uuid.uuid4())
        self.name = name.strip()
        self.description = description.strip()
        self.phone = phone.strip()
        self.upi = upi.strip()
        self.color = color
        self.active = active
        self.qr = f"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={upi}"
        self.stats = {
            "totalDonations": 0,
            "totalAmount": 0,
            "created_at": datetime.utcnow()
        }
        self.updated_at = datetime.utcnow()

    def to_dict(self):
        """Convert to JSON serializable dict"""
        return {
            '_id': self._id,
            'name': self.name,
            'description': self.description,
            'phone': self.phone,
            'upi': self.upi,
            'color': self.color,
            'active': self.active,
            'qr': self.qr,
            'stats': self.stats,
            'updated_at': self.updated_at.isoformat()
        }

    def update(self, data):
        """Update NGO fields"""
        update_fields = {
            'name': data.get('name', self.name).strip(),
            'description': data.get('description', self.description).strip(),
            'phone': data.get('phone', self.phone).strip(),
            'upi': data.get('upi', self.upi).strip(),
            'color': data.get('color', self.color),
            'active': data.get('active', self.active)
        }
        
        # Update QR if UPI changed
        if update_fields['upi'] != self.upi:
            self.qr = f"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={update_fields['upi']}"
        
        self.__dict__.update(update_fields)
        self.updated_at = datetime.utcnow()
        return self.to_dict()

    @classmethod
    def from_mongo(cls, mongo_doc):
        """Create NGO from MongoDB document"""
        ngo = cls(mongo_doc.get('name', ''), 
                 mongo_doc.get('description', ''),
                 mongo_doc.get('phone', ''),
                 mongo_doc.get('upi', ''))
        ngo._id = str(mongo_doc.get('_id', uuid.uuid4()))
        ngo.active = mongo_doc.get('active', True)
        ngo.color = mongo_doc.get('color', '#FF6B35')
        ngo.stats = mongo_doc.get('stats', {})
        ngo.updated_at = mongo_doc.get('updated_at', datetime.utcnow())
        return ngo

    @staticmethod
    def validate(data):
        """Validate NGO data"""
        required = ['name', 'upi']
        for field in required:
            if not data.get(field) or data[field].strip() == '':
                return False, f"{field.capitalize()} is required"
        if len(data['name']) < 2:
            return False, "Name must be at least 2 characters"
        if '@' not in data['upi']:
            return False, "Invalid UPI format"
        return True, "Valid"

# Add this to end of ngo.py
