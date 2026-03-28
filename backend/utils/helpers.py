import os
import uuid
from flask import flash
from werkzeug.utils import secure_filename


UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}


def is_allowed_image(filename: str) -> bool:
    """
    Check if file extension is in allowed image types.
    """
    ext = (filename.rsplit(".", 1)[-1].lower()
           if "." in filename else "")
    return ext in ALLOWED_IMAGE_EXTENSIONS


def save_uploaded_photo(file, prefix="photo") -> str | None:
    """
    Save an uploaded photo file to UPLOAD_FOLDER.
    Returns the filename used, or None on error.
    """
    if not file or not file.filename:
        return None

    if not is_allowed_image(file.filename):
        flash(
            "Invalid image format. Use JPG, PNG, or WebP.",
            "error",
        )
        return None

    ext = file.filename.rsplit(".", 1)[-1].lower()
    filename = f"{prefix}_{str(uuid.uuid4())}.{ext}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)

    file.save(filepath)
    return filename


def ensure_dir(path: str) -> None:
    """
    Ensure a directory exists; create it if not.
    """
    if not os.path.exists(path):
        os.makedirs(path, exist_ok=True)


def to_fixed(v, digits=2):
    """
    Round a number to fixed decimal places; return float.
    Useful for coordinates / amounts.
    """
    return round(float(v), digits) if v is not None else None


def truncate_text(text: str, max_len: int = 100) -> str:
    """
    Truncate long text and append ellipsis if needed.
    """
    if not text:
        return ""
    if len(text) <= max_len:
        return text
    return text[:max_len] + "…"


def human_readable_datetime(dt) -> str:
    """
    Convert a datetime (UTC) into a human‑readable string.
    """
    if not dt:
        return ""
    return dt.strftime("%b %d, %Y at %H:%M")