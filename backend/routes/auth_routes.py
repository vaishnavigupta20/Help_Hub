from flask import (
    Blueprint,
    request,
    render_template,
    redirect,
    url_for,
    flash,
    session,
    jsonify,
)

from datetime import datetime
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
from models.user_model import UserModel
from config import users_collection

auth_bp = Blueprint("auth_bp", __name__)


# ---- Web routes ----


@auth_bp.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        name = request.form.get("name")
        email = request.form.get("email")
        password = request.form.get("password")
        role = request.form.get("role", "user")  # default: normal user
        phone = request.form.get("phone", "")

        # Optional: location fields (for future geo‑filtering)
        latitude = request.form.get("latitude") or None
        longitude = request.form.get("longitude") or None
        area = request.form.get("area", "")
        full_address = request.form.get("full_address", "")

        # ---------------- Validations ----------------
        if not name or not email or not password:
            flash("Name, email, and password are required.", "error")
            return render_template("signup.html")

        if "@" not in email:
            flash("Please enter a valid email address.", "error")
            return render_template("signup.html")

        if len(password) < 6:
            flash("Password must be at least 6 characters long.", "error")
            return render_template("signup.html")

        # Check if user already exists
        existing = users_collection.find_one({"email": email.lower()})
        if existing:
            flash("An account with this email already exists.", "warning")
            return render_template("signup.html")

        # Hash password
        password_hash = generate_password_hash(password)

        # Build user document
        user_doc = UserModel.build_document(
            name=name,
            email=email,
            password_hash=password_hash,
            role=role,
            phone=phone,
            latitude=float(latitude) if latitude else None,
            longitude=float(longitude) if longitude else None,
            area=area,
            full_address=full_address,
        )

        # Insert into MongoDB
        result = users_collection.insert_one(user_doc)
        user_id = str(result.inserted_id)

        # Login the user immediately
        session["user_id"] = user_id
        session["role"] = role
        session["name"] = name

        # --- Optional: set default preferences (you can move this to frontend JS later) ---
        # users_collection.update_one(
        #     {"_id": ObjectId(user_id)},
        #     {"$set": {"preferences.help_requests": True, "preferences.animal_rescue": True, ...}}
        # )

        flash("Signup successful! You are logged in.", "success")

        # Role‑based redirect
        if role == "ngo":
            return redirect(url_for("auth_bp.ngo_dashboard"))
        return redirect(url_for("auth_bp.dashboard"))

    return render_template("signup.html")


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")

        if not email or not password:
            flash("Email and password are required.", "error")
            return render_template("login.html")

        user = users_collection.find_one({"email": email.lower()})
        if not user:
            flash("User not found.", "warning")
            return render_template("login.html")

        if not check_password_hash(user["password"], password):
            flash("Incorrect password.", "warning")
            return render_template("login.html")

        # Mark user as active
        users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"is_active": True, "updatedAt": datetime.utcnow()}}
        )

        # Login: store basic info in session
        session["user_id"] = str(user["_id"])
        session["role"] = user["role"]
        session["name"] = user.get("name", "")

        flash("Login successful!", "success")

        # Role‑based redirect
        if user["role"] == "ngo":
            return redirect(url_for("auth_bp.ngo_dashboard"))
        return redirect(url_for("auth_bp.dashboard"))

    return render_template("login.html")


@auth_bp.route("/logout")
def logout():
    user_id = session.get("user_id")
    if user_id:
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"is_active": False, "updatedAt": datetime.utcnow()}}
        )
    session.clear()
    flash("You have been logged out.", "info")
    return redirect(url_for("auth_bp.login"))


# ---- Optional: Web role‑based dashboards ----


@auth_bp.route("/dashboard")
def dashboard():
    user_id = session.get("user_id")
    if not user_id:
        flash("Please login first.", "info")
        return redirect(url_for("auth_bp.login"))

    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        flash("User not found.", "error")
        return redirect(url_for("auth_bp.login"))

    # Later: fetch user‑specific requests / donations
    return render_template("dashboard.html", user=user)


@auth_bp.route("/ngo-dashboard")
def ngo_dashboard():
    user_id = session.get("user_id")
    role = session.get("role")

    if not user_id or role != "ngo":
        flash("Access restricted to NGOs.", "warning")
        return redirect(url_for("auth_bp.dashboard"))

    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        flash("User not found.", "error")
        return redirect(url_for("auth_bp.login"))

    # Later: show NGO‑specific rescue / blood / help lists
    return render_template("ngo_dashboard.html", user=user)


# ---- API routes (for React later) ----


@auth_bp.route("/api/signup", methods=["POST"])
def api_signup():
    name = request.json.get("name")
    email = request.json.get("email")
    password = request.json.get("password")
    role = request.json.get("role", "user")
    phone = request.json.get("phone", "")

    # Same validation as web; can be extracted into a helper later
    if not name or not email or not password or "@" not in email:
        return jsonify({
            "success": False,
            "error": "Invalid or missing fields."
        }), 400

    if len(password) < 6:
        return jsonify({
            "success": False,
            "error": "Password must be at least 6 characters."
        }), 400

    existing = users_collection.find_one({"email": email.lower()})
    if existing:
        return jsonify({"success": False, "error": "Email already exists."}), 409

    password_hash = generate_password_hash(password)

    user_doc = UserModel.build_document(
        name=name,
        email=email,
        password_hash=password_hash,
        role=role,
        phone=phone,
    )

    result = users_collection.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # In API‑style, usually return tokens instead of using Flask session
    # For now, we keep it simple with basic JSON.
    return jsonify({
        "success": True,
        "message": "User created successfully.",
        "userId": user_id,
        "role": role,
    }), 201


@auth_bp.route("/api/login", methods=["POST"])
def api_login():
    email = request.json.get("email")
    password = request.json.get("password")

    if not email or not password:
        return jsonify({"success": False, "error": "Email and password required."}), 400

    user = users_collection.find_one({"email": email.lower()})
    if not user or not check_password_hash(user["password"], password):
        return jsonify({"success": False, "error": "Invalid credentials."}), 401

    # In production, use JWT here instead of Flask session
    user_dto = UserModel.from_db(user, include_password=False)

    return jsonify({
        "success": True,
        "user": user_dto,
    }), 200