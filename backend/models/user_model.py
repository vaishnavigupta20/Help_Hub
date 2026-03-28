from datetime import datetime
from bson.objectid import ObjectId


class UserModel:
    """
    HelpHub user model (normal user, NGO, volunteer, admin, donor, etc.)
    """

    # Common roles (extend as needed)
    ROLES = [
        "user",      # general help seeker / helper
        "ngo",       # NGO / rescue organization
        "volunteer", # active helper / rescuer
        "donor",     # regular donor of food / clothes / blood / money
        "admin",     # platform admin
    ]

    # User types (optional, can be inferred from roles in UI)
    USER_TYPES = {
        "individual": "Normal individual user",
        "organisation": "NGO / Rescue group / Hospital / Blood bank",
    }

    @classmethod
    def build_document(
        cls,
        name,
        email,
        password_hash,
        role="user",
        user_type="individual",
        phone="",
        latitude=None,
        longitude=None,
        area="",
        full_address="",
        preferences=None,
    ):
        """
        Create a sanitized user document ready to be inserted into `users_collection`.
        """
        if not name or not email or not password_hash:
            raise ValueError("name, email, and password_hash are required")

        if role not in cls.ROLES:
            raise ValueError(f"Invalid role: {role}")
        if user_type not in cls.USER_TYPES:
            raise ValueError(f"Invalid user_type: {user_type}")

        # Preferences: which alerts this user wants
        if preferences is None:
            preferences = {
                "help_requests": True,         # food/clothes/medicine
                "animal_rescue": True,
                "blood_requests": True,
                "lost_pet_alerts": True,
            }

        return {
            "name": name.strip(),
            "email": email.strip().lower(),
            "password": password_hash,        # already hashed outside

            "role": role,
            "user_type": user_type,

            "phone": phone.strip(),
            "latitude": latitude,
            "longitude": longitude,
            "area": area.strip(),
            "full_address": full_address.strip(),

            "preferences": preferences,  # notification preferences

            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),

            "is_active": True,
            "is_verified": False,       # for email/phone verification later
            "verifiedAt": None,

            # Optional: social / NGO‑specific fields (set later)
            "organisation_name": None,   # for NGOs / blood banks
            "organisation_type": None,   # shelter, hospital, blood bank, etc.
            "website": None,
            "contact_info": {},         # {email, phone, address, etc.}
        }

    @classmethod
    def from_db(cls, doc, include_password=False):
        """
        Convert a MongoDB document into a structured dictionary (DTO).
        If include_password=False, password is stripped (safe for JSON / API responses).
        """
        user = {
            "id": str(doc["_id"]),
            "name": doc.get("name"),
            "email": doc.get("email"),
            "role": doc.get("role"),
            "user_type": doc.get("user_type"),
            "phone": doc.get("phone"),
            "latitude": doc.get("latitude"),
            "longitude": doc.get("longitude"),
            "area": doc.get("area"),
            "full_address": doc.get("full_address"),
            "preferences": doc.get("preferences"),
            "createdAt": doc.get("createdAt"),
            "updatedAt": doc.get("updatedAt"),
            "is_active": doc.get("is_active"),
            "is_verified": doc.get("is_verified"),
            "verifiedAt": doc.get("verifiedAt"),
            "organisation_name": doc.get("organisation_name"),
            "organisation_type": doc.get("organisation_type"),
            "website": doc.get("website"),
            "contact_info": doc.get("contact_info"),
        }
        if not include_password:
            user.pop("password", None)
        return user

    @classmethod
    def strip_sensitive(cls, doc):
        """
        Strip sensitive fields (password, etc.) from a user doc.
        Useful for API serialization.
        """
        safe = cls.from_db(doc, include_password=False)
        return safe