from datetime import datetime
from bson.objectid import ObjectId


class RequestModel:
    """
    HelpHub request model (help request, animal rescue, blood/medicine, donation, etc.)
    """

    # Allowed categories (you can extend this)
    CATEGORIES = {
        "help_request": "General help (food, clothes, medicine, etc.)",
        "animal_rescue": "Injured / stray / lost animal rescue",
        "blood_request": "Blood donor / urgent blood",
        "medicine_request": "Medicine / healthcare delivery",
        "donation": "Donation of food, clothes, money, or medicine",
    }

    # Allowed statuses (you can augment later)
    STATUSES = [
        "Pending",
        "In Progress",
        "Completed",
        "Cancelled",
    ]

    # Priorities
    PRIORITIES = ["Low", "Medium", "High", "Urgent"]

    @classmethod
    def build_document(
        cls,
        help_type,
        description,
        location,
        contact,
        category="help_request",
        priority="Medium",
        createdBy=None,
        photo="",
    ):
        """
        Create a sanitized request document ready to be inserted into `requests_collection`.
        """
        assert category in cls.CATEGORIES, f"Invalid category: {category}"
        assert priority in cls.PRIORITIES, f"Invalid priority: {priority}"

        if not createdBy:
            raise ValueError("createdBy is required")

        return {
            "help_type": help_type.strip(),
            "description": description.strip(),
            "location": location.strip(),
            "contact": contact.strip(),
            "category": category,
            "priority": priority,
            "photo": photo or "",

            "status": "Pending",
            "createdBy": str(ObjectId(createdBy)) if isinstance(createdBy, str) else createdBy,

            "createdAt": datetime.utcnow(),
            "completedAt": None,
            "completedBy": None,
            "handledByNGO": False,

            # Optional fields (you can set them from API or forms later)
            "urgency_note": None,           # e.g., "Child in distress"
            "latitude": None,
            "longitude": None,
            "area": None,                   # neighborhood / area name
            "full_address": None,
        }

    @classmethod
    def from_db(cls, doc):
        """
        Convert a MongoDB document into a structured dictionary (or DTO).
        Useful for controllers / API responses.
        """
        return {
            "id": str(doc["_id"]),
            "help_type": doc.get("help_type"),
            "description": doc.get("description"),
            "location": doc.get("location"),
            "contact": doc.get("contact"),
            "category": doc.get("category"),
            "priority": doc.get("priority"),
            "photo": doc.get("photo"),
            "status": doc.get("status"),
            "createdBy": doc.get("createdBy"),
            "createdAt": doc.get("createdAt"),
            "completedAt": doc.get("completedAt"),
            "completedBy": doc.get("completedBy"),
            "handledByNGO": doc.get("handledByNGO", False),
            "urgency_note": doc.get("urgency_note"),
            "latitude": doc.get("latitude"),
            "longitude": doc.get("longitude"),
            "area": doc.get("area"),
            "full_address": doc.get("full_address"),
        }