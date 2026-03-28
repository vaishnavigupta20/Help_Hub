from flask import (
    Blueprint,
    request,
    render_template,
    redirect,
    url_for,
    flash,
    jsonify,
    session,
)
from bson.objectid import ObjectId
from datetime import datetime

from config import users_collection, requests_collection, donation_collection
from models.user_model import UserModel
from utils.auth import login_required


user_bp = Blueprint("user_bp", __name__, url_prefix="/user")


# ---- Web routes ----


@user_bp.route("/profile")
@login_required
def profile():
    user_id = session.get("user_id")
    if not user_id:
        flash("Please login first.", "info")
        return redirect(url_for("auth_bp.login"))

    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
    except Exception:
        flash("User not found.", "error")
        return redirect(url_for("auth_bp.login"))

    if not user:
        flash("User not found.", "error")
        return redirect(url_for("auth_bp.login"))

    # Activity stats (can be moved to analytics later)
    total_requests = requests_collection.count_documents({"createdBy": user_id})
    completed_requests = requests_collection.count_documents({"completedBy": user_id})
    donations = donation_collection.count_documents({"donorId": user_id})

    safe_user = UserModel.from_db(user, include_password=False)

    return render_template(
        "profile.html",
        user=safe_user,
        total_requests=total_requests,
        completed_requests=completed_requests,
        donations=donations,
    )


@user_bp.route("/edit", methods=["GET", "POST"])
@login_required
def edit_profile():
    user_id = session.get("user_id")
    if not user_id:
        flash("Please login first.", "info")
        return redirect(url_for("auth_bp.login"))

    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        flash("User not found.", "error")
        return redirect(url_for("auth_bp.login"))

    if request.method == "POST":
        name = request.form.get("name")
        phone = request.form.get("phone", "")
        latitude = request.form.get("latitude") or None
        longitude = request.form.get("longitude") or None
        area = request.form.get("area", "")
        full_address = request.form.get("full_address", "")

        # Optional: organisation details (for NGOs / hospitals / blood banks)
        organisation_name = request.form.get("organisation_name", "")
        organisation_type = request.form.get("organisation_type", "")
        website = request.form.get("website", "")

        if not name:
            flash("Name is required.", "error")
            return redirect(url_for("user_bp.edit_profile"))

        latitude = float(latitude) if latitude else None
        longitude = float(longitude) if longitude else None

        update_doc = {
            "name": name,
            "phone": phone,
            "latitude": latitude,
            "longitude": longitude,
            "area": area,
            "full_address": full_address,
            "organisation_name": organisation_name,
            "organisation_type": organisation_type,
            "website": website,
            "updatedAt": datetime.utcnow(),
        }

        # Optional: handle preferences
        preferences = {}
        for k in request.form.keys():
            if k.startswith("preferences_"):
                preferences[k.replace("preferences_", "")] = request.form.get(k) == "on"
        if preferences:
            update_doc["preferences"] = preferences

        users_collection.update_one({"_id": ObjectId(user_id)}, {"$set": update_doc})

        # Update session name if changed
        if user["name"] != name:
            session["name"] = name

        flash("Profile updated successfully!", "success")
        return redirect(url_for("user_bp.profile"))

    # GET: show edit form
    safe_user = UserModel.from_db(user, include_password=False)
    return render_template("edit_profile.html", user=safe_user)


# ---- API routes (for React later) ----


@user_bp.route("/api/<id>", methods=["GET"])
def api_get_user(id):
    try:
        user_id = ObjectId(id)
    except Exception:
        return jsonify({"success": False, "error": "Invalid user ID."}), 400

    user = users_collection.find_one({"_id": user_id})
    if not user:
        return jsonify({"success": False, "error": "User not found."}), 404

    safe_user = UserModel.from_db(user, include_password=False)
    return jsonify({"success": True, "user": safe_user}), 200


@user_bp.route("/api/<id>/stats", methods=["GET"])
def api_user_stats(id):
    try:
        user_id = ObjectId(id)
    except Exception:
        return jsonify({"success": False, "error": "Invalid user ID."}), 400

    total_requests = requests_collection.count_documents({"createdBy": id})
    completed_requests = requests_collection.count_documents({"completedBy": id})
    donations = donation_collection.count_documents({"donorId": id})

    return jsonify({
        "success": True,
        "stats": {
            "total_requests": total_requests,
            "completed_requests": completed_requests,
            "donations": donations,
        }
    }), 200


@user_bp.route("/api/<id>", methods=["PUT"])
@login_required
def api_update_user(id):
    if session.get("user_id") != id:
        return jsonify({"success": False, "error": "Not allowed to edit this user."}), 403

    body = request.json

    name = body.get("name")
    phone = body.get("phone", "")
    latitude = body.get("latitude")
    longitude = body.get("longitude")
    area = body.get("area", "")
    full_address = body.get("full_address", "")

    organisation_name = body.get("organisation_name", "")
    organisation_type = body.get("organisation_type", "")
    website = body.get("website", "")

    if not name:
        return jsonify({"success": False, "error": "Name is required."}), 400

    latitude = float(latitude) if latitude else None
    longitude = float(longitude) if longitude else None

    update_doc = {
        "name": name,
        "phone": phone,
        "latitude": latitude,
        "longitude": longitude,
        "area": area,
        "full_address": full_address,
        "organisation_name": organisation_name,
        "organisation_type": organisation_type,
        "website": website,
        "updatedAt": datetime.utcnow(),
    }

    preferences = body.get("preferences")
    if preferences and isinstance(preferences, dict):
        update_doc["preferences"] = preferences

    try:
        result = users_collection.update_one(
            {"_id": ObjectId(id)},
            {"$set": update_doc},
        )
        if result.matched_count == 0:
            return jsonify({"success": False, "error": "User not found."}), 404
        return jsonify({"success": True, "message": "Profile updated."}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500