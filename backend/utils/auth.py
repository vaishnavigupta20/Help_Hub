from functools import wraps
from flask import (
    session,
    redirect,
    url_for,
    flash,
    jsonify,
    request,
)

# === HelpHub role constants (keep in sync with UserModel.ROLES) ===
HELP_HUB_ROLES = {
    "user",
    "ngo",
    "volunteer",
    "donor",
    "admin",
}

# --- 1. Generic login_required (you already have this) ---
def login_required(f):
    """
    Decorator: require user to be logged in.
    If not logged in, redirects to login page with flash message.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            flash("Please login first.", "info")
            return redirect(url_for("auth_bp.login"))

        # Optional: anti‑CSRF check on sensitive routes
        if request.method in ("POST", "PUT", "DELETE"):
            if not request.is_json:
                # HTML form: assume protection via Flask‑WTF somewhere later
                pass

        return f(*args, **kwargs)
    return decorated_function


# --- 2. NGO / volunteer / donor / admin checks ( HelpHub roles ) ---
def ngo_required(f):
    """
    Require role == "ngo".
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            flash("Please login first.", "info")
            return redirect(url_for("auth_bp.login"))
        role = session.get("role")
        if role != "ngo":
            flash("Access restricted to NGOs.", "warning")
            return redirect(url_for("user_bp.profile"))
        return f(*args, **kwargs)
    return decorated_function


def volunteer_required(f):
    """
    Require role == "volunteer".
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            flash("Please login first.", "info")
            return redirect(url_for("auth_bp.login"))
        role = session.get("role")
        if role != "volunteer":
            flash("Access restricted to volunteers.", "warning")
            return redirect(url_for("user_bp.profile"))
        return f(*args, **kwargs)
    return decorated_function


def donor_required(f):
    """
    Require role == "donor" (for blood / food / clothes donors).
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            flash("Please login first.", "info")
            return redirect(url_for("auth_bp.login"))
        role = session.get("role")
        if role != "donor":
            flash("Access restricted to donors.", "warning")
            return redirect(url_for("user_bp.profile"))
        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    """
    Require role == "admin".
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            flash("Please login first.", "info")
            return redirect(url_for("auth_bp.login"))
        role = session.get("role")
        if role != "admin":
            flash("Access restricted to admin.", "warning")
            return redirect(url_for("user_bp.profile"))
        return f(*args, **kwargs)
    return decorated_function


# --- 3. Flexible multi‑role decorator (HelpHub‑ready) ---
def role_required(*allowed_roles):
    """
    Decorator: allow one or more roles (user, ngo, volunteer, donor, etc.).
    Usage:
        @role_required("user", "ngo")
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if "user_id" not in session:
                flash("Please login first.", "info")
                return redirect(url_for("auth_bp.login"))

            role = session.get("role")
            if role not in allowed_roles:
                flash(
                    f"Access restricted to roles: {', '.join(allowed_roles)}.",
                    "warning",
                )
                return redirect(url_for("user_bp.profile"))
            return f(*args, **kwargs)
        return decorated_function
    return decorator


# --- 4. API‑level decorators (JSON flavors) ---
def api_login_required(f):
    """
    JSON API version: returns 401 on unauthenticated request.
    Useful for React / mobile API calls.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"success": False, "error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated_function


def api_role_required(role):
    """
    Require a specific role (JSON API).
    Example: @api_role_required("ngo")
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if "user_id" not in session:
                return jsonify({"success": False, "error": "Unauthorized"}), 401

            user_role = session.get("role")
            if user_role != role:
                return jsonify({
                    "success": False,
                    "error": "Insufficient permissions."
                }), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator


# --- 5. HelpHub‑specific: API multi‑role guard (donors + volunteers + NGOs) ---
def api_roles_required(*allowed_roles):
    """
    JSON API: allow a list of roles.
    Useful for:
      - animal rescue (volunteer, ngo, donor)
      - blood network (donor, hospital, ngo)
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if "user_id" not in session:
                return jsonify({"success": False, "error": "Unauthorized"}), 401

            user_role = session.get("role")
            if user_role not in allowed_roles:
                return jsonify({
                    "success": False,
                    "error": "Insufficient role permissions."
                }), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator