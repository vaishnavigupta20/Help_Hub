from flask import (
    Blueprint,
    request,
    render_template,
    redirect,
    url_for,
    flash,
    jsonify,
)
from datetime import datetime
from bson.objectid import ObjectId

from config import donation_collection, users_collection
from utils.auth import login_required


donation_bp = Blueprint("donation_bp", __name__, url_prefix="/donation")


# ---- Donation types/constants ----

DONATION_TYPES = [
    "food",
    "clothes",
    "medicine",
    "blood",
    "money",  # for general donation
]

STATUSES = ["Pending", "Confirmed", "Delivered"]


# ---- Helper: create donation doc ----

def build_donation_doc(
    donor_name,
    item,
    amount,
    donor_id,
    donation_type="food",
    status="Pending",
    description="",
    location="",
    area="",
    full_address="",
    latitude=None,
    longitude=None,
):
    """Utility to build a donation document."""
    if donation_type not in DONATION_TYPES:
        raise ValueError(f"Invalid donation_type: {donation_type}")
    if status not in STATUSES:
        raise ValueError(f"Invalid status: {status}")

    return {
        "donor_name": donor_name.strip(),
        "item": item.strip(),
        "amount": amount or None,
        "description": description.strip(),
        "location": location.strip(),
        "area": area.strip(),
        "full_address": full_address.strip(),
        "latitude": latitude,
        "longitude": longitude,

        "donation_type": donation_type,
        "status": status,

        "donorId": str(ObjectId(donor_id)) if isinstance(donor_id, str) else donor_id,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }


# ---- Web routes ----


@donation_bp.route("/", methods=["GET", "POST"])
@login_required
def donate():
    if request.method == "POST":
        donor_name = request.form.get("donor_name")
        item = request.form.get("item")
        amount = request.form.get("amount")
        donation_type = request.form.get("donation_type", "food")
        description = request.form.get("description", "")
        location = request.form.get("location", "")
        area = request.form.get("area", "")
        full_address = request.form.get("full_address", "")

        latitude = request.form.get("latitude") or None
        longitude = request.form.get("longitude") or None

        if not donor_name or not item:
            flash("Donor name and item are required.", "error")
            return render_template("donate.html")

        latitude = float(latitude) if latitude else None
        longitude = float(longitude) if longitude else None

        try:
            donation_doc = build_donation_doc(
                donor_name=donor_name,
                item=item,
                amount=amount,
                donor_id=request.session["user_id"],
                donation_type=donation_type,
                description=description,
                location=location,
                area=area,
                full_address=full_address,
                latitude=latitude,
                longitude=longitude,
            )
            donation_collection.insert_one(donation_doc)
            flash(
                "Your donation has been recorded. Thank you for your generosity!",
                "success",
            )
            return redirect(url_for("donation_bp.donations_list"))
        except ValueError as e:
            flash(str(e), "error")
            return render_template("donate.html")

    # GET: show donation form
    return render_template("donate.html")


@donation_bp.route("/list")
@login_required
def donations_list():
    # Filter by donor (optionally by donation_type, status, location)
    filters = {}

    user_id = request.session.get("user_id")
    if user_id:
        filters["donorId"] = user_id

    # Example: show only food and clothes for normal user
    # if request.session["role"] != "ngo":
    #     filters["donation_type"] = {"$in": ["food", "clothes"]}

    data = list(
        donation_collection.find(filters)
        .sort("createdAt", -1)
        .limit(100)
    )
    return render_template("donations_list.html", data=data)


@donation_bp.route("/analytics")
@login_required
def analytics():
    """
    Donation‑specific analytics (you can merge with app‑level analytics later).
    """
    total = donation_collection.count_documents({})
    by_type = list(
        donation_collection.aggregate([
            {"$group": {"_id": "$donation_type", "count": {"$sum": 1}}},
        ])
    )
    by_status = list(
        donation_collection.aggregate([
            {"$group": {"_id": "$status", "count": {"$sum": 1}}},
        ])
    )

    return render_template(
        "donation_analytics.html",
        total=total,
        by_type=by_type,
        by_status=by_status,
    )


# ---- API routes (for React later) ----


@donation_bp.route("/api", methods=["GET"])
def api_list_donations():
    filters = {}

    user_id = request.args.get("user_id")
    if user_id:
        filters["donorId"] = user_id

    try:
        data = list(donation_collection.find(filters).sort("createdAt", -1))
        return jsonify({"success": True, "data": data}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@donation_bp.route("/api", methods=["POST"])
@login_required
def api_create_donation():
    body = request.json

    donor_name = body.get("donor_name")
    item = body.get("item")
    amount = body.get("amount")
    donation_type = body.get("donation_type", "food")
    description = body.get("description", "")
    location = body.get("location", "")
    area = body.get("area", "")
    full_address = body.get("full_address", "")

    latitude = body.get("latitude") or None
    longitude = body.get("longitude") or None

    if not donor_name or not item:
        return jsonify({"success": False, "error": "donor_name and item required"}), 400

    latitude = float(latitude) if latitude else None
    longitude = float(longitude) if longitude else None

    try:
        donation_doc = build_donation_doc(
            donor_name=donor_name,
            item=item,
            amount=amount,
            donor_id=request.session["user_id"],
            donation_type=donation_type,
            description=description,
            location=location,
            area=area,
            full_address=full_address,
            latitude=latitude,
            longitude=longitude,
        )
        donation_collection.insert_one(donation_doc)
        return jsonify({"success": True, "message": "Donation created"}), 201
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": "Internal error"}), 500