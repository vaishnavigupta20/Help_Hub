from flask import (
    Blueprint,
    request,
    render_template,
    jsonify,
    redirect,
    url_for,
    flash,
)
from bson.objectid import ObjectId
from datetime import datetime

from config import requests_collection
from models.request_model import RequestModel
from utils.auth import login_required


request_bp = Blueprint("request_bp", __name__, url_prefix="/request")


# ---- Web routes ----


@request_bp.route("/", methods=["GET", "POST"])
@login_required
def request_help():
    if request.method == "POST":
        help_type = request.form.get("type")
        description = request.form.get("description")
        location = request.form.get("location")
        contact = request.form.get("contact")
        priority = request.form.get("priority", "Medium")
        category = request.form.get("category", "help_request")  # or map from UI

        if not help_type or not description or not location or not contact:
            flash("All required fields must be filled.", "error")
            return redirect(url_for("request_bp.request_help"))

        # Optional: handle photo upload (if form has a file input with name="photo")
        photo = request.files.get("photo")
        filename = ""
        if photo and photo.filename.strip():
            ext = photo.filename.split(".")[-1].lower()
            if ext not in {"jpg", "jpeg", "png", "webp"}:
                flash("Invalid image format. Use JPG/PNG/WebP.", "error")
                return redirect(url_for("request_bp.request_help"))
            filename = f"{ObjectId().__str__()}_{int(photo.mtime or 0)}.{ext}"
            photo.save(f"uploads/{filename}")

        req_doc = RequestModel.build_document(
            help_type=help_type,
            description=description,
            location=location,
            contact=contact,
            category=category,
            priority=priority,
            createdBy=request.session["user_id"],
            photo=filename,
        )

        requests_collection.insert_one(req_doc)
        flash("Your request has been posted. Help is on the way!", "success")
        return redirect(url_for("request_bp.dashboard"))

    return render_template("request_help.html")


@request_bp.route("/dashboard")
@login_required
def dashboard():
    # Basic sorting; later add filters by category, status, priority
    data = list(
        requests_collection.find()
        .sort("createdAt", -1)
        .limit(100)
    )
    return render_template("dashboard.html", data=data)


@request_bp.route("/my-requests")
@login_required
def my_requests():
    data = list(
        requests_collection.find({"createdBy": request.session["user_id"]})
        .sort("createdAt", -1)
    )
    return render_template("my_requests.html", data=data)


@request_bp.route("/accept/<id>")
@login_required
def accept_request(id):
    try:
        req_id = ObjectId(id)
    except Exception:
        flash("Invalid request ID.", "error")
        return redirect(url_for("request_bp.dashboard"))

    req = requests_collection.find_one({"_id": req_id})
    if not req:
        flash("Request not found.", "error")
        return redirect(url_for("request_bp.dashboard"))

    if req.get("createdBy") == request.session["user_id"]:
        flash("You cannot accept your own request.", "warning")
        return redirect(url_for("request_bp.dashboard"))

    update_doc = {
        "$set": {
            "status": "In Progress",
            "completedBy": request.session["user_id"],
            "completedAt": None,
        }
    }

    # If you want to mark it as “completed” immediately:
    # update_doc["$set"]["status"] = "Completed"
    # update_doc["$set"]["completedAt"] = datetime.utcnow()

    requests_collection.update_one({"_id": req_id}, update_doc)
    flash("You’ve accepted this request. Please help the person soon!", "success")
    return redirect(url_for("request_bp.dashboard"))


# ---- API routes (for React later) ----


@request_bp.route("/api", methods=["GET"])
def api_list_requests():
    # Optional: add filters (status, category, user_id, etc.)
    query = {}
    user_id = request.args.get("user_id")
    if user_id:
        query["createdBy"] = user_id

    try:
        data = [
            RequestModel.from_db(doc)
            for doc in requests_collection.find(query).sort("createdAt", -1)
        ]
        return jsonify({"success": True, "data": data}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@request_bp.route("/api/<id>", methods=["GET"])
def api_get_request(id):
    try:
        req_id = ObjectId(id)
    except Exception:
        return jsonify({"success": False, "error": "Invalid ID"}), 400

    doc = requests_collection.find_one({"_id": req_id})
    if not doc:
        return jsonify({"success": False, "error": "Request not found"}), 404

    return jsonify({"success": True, "data": RequestModel.from_db(doc)}), 200


@request_bp.route("/api/accept/<id>", methods=["POST"])
@login_required
def api_accept_request(id):
    try:
        req_id = ObjectId(id)
    except Exception:
        return jsonify({"success": False, "error": "Invalid ID"}), 400

    req = requests_collection.find_one({"_id": req_id})
    if not req:
        return jsonify({"success": False, "error": "Request not found"}), 404

    if req.get("createdBy") == request.session["user_id"]:
        return jsonify({"success": False, "error": "Cannot accept own request"}), 400

    try:
        requests_collection.update_one(
            {"_id": req_id},
            {
                "$set": {
                    "status": "In Progress",
                    "completedBy": request.session["user_id"],
                    "completedAt": None,
                }
            }
        )
        return jsonify({"success": True, "message": "Request accepted"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@request_bp.route("/api/complete/<id>", methods=["POST"])
@login_required
def api_complete_request(id):
    try:
        req_id = ObjectId(id)
    except Exception:
        return jsonify({"success": False, "error": "Invalid ID"}), 400

    req = requests_collection.find_one({"_id": req_id})
    if not req:
        return jsonify({"success": False, "error": "Request not found"}), 404

    try:
        requests_collection.update_one(
            {"_id": req_id},
            {
                "$set": {
                    "status": "Completed",
                    "completedBy": request.session["user_id"],
                    "completedAt": datetime.utcnow(),
                }
            }
        )
        return jsonify({"success": True, "message": "Request marked as completed"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500