import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const RequestHelp = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    type: "",
    description: "",
    location: "",
    contact: "",
    priority: "Medium",
  });

  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(""); // browser preview
  const [locationCoords, setLocationCoords] = useState({ lat: "", lng: "" });
  const [locationPermission, setLocationPermission] = useState(false); // 1. still keep for UI
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // ✅ YOUR BACKEND URL (keep as before)
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

  // get auth token
  const TOKEN = localStorage.getItem("token");

  // Check geolocation support and request permission on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported by your browser.");
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          if (result.state === "granted") {
            setLocationPermission(true);
          } else if (result.state === "prompt") {
            setMessage(
              "Please allow location access for GPS-enabled tracking.",
            );
          }
        })
        .catch(() => {
          // on older browsers or error, still allow manual capture
        });
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // optional: preview thumbnail
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
      setPhoto(file);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported by your browser.");
      return;
    }

    setLoadingLocation(true);
    setMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLocationCoords({
          lat: lat.toString(),
          lng: lng.toString(),
        });
        setLocationPermission(true); // 2. keep for UI badge
        setLoadingLocation(false);
        setMessage("GPS location captured successfully.");
      },
      (error) => {
        console.error("Location error:", error);
        setLoadingLocation(false);

        let errorMsg = "Could not fetch GPS location.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Location access denied. GPS permission is required.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "GPS location unavailable. Please try again.";
        }
        setMessage(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      },
    );
  };

  // ✅ FIXED handleSubmit WITH REDIRECT
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Check GPS is captured (⚠️ use coords, not permission)
    if (!locationCoords.lat || !locationCoords.lng) {
      setMessage("Please capture GPS location before submitting.");
      return;
    }

    let imageUrl = "";
    setSubmitting(true);
    setMessage("");

    // 2. Upload photo if exists
    if (photo) {
      const imgData = new FormData();
      imgData.append("photo", photo);

      try {
        const uploadRes = await fetch(`${API_BASE}/api/upload-photo`, {
          method: "POST",
          body: imgData,
          headers: {
            ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
          },
        });

        const uploadResult = await uploadRes.json();

        if (!uploadResult.success) {
          alert(uploadResult.error);
          setSubmitting(false);
          return;
        }

        imageUrl = uploadResult.image_url;
      } catch (err) {
        console.error("Photo upload failed:", err);
        setMessage("Failed to upload photo. Please retry.");
        setSubmitting(false);
        return;
      }
    }

    // 3. Build main request data
    const formDataToSend = new FormData();
    formDataToSend.append("type", formData.type);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("location", formData.location);
    formDataToSend.append("contact", formData.contact);
    formDataToSend.append("priority", formData.priority);
    formDataToSend.append("latitude", locationCoords.lat);
    formDataToSend.append("longitude", locationCoords.lng);
    formDataToSend.append("photo", imageUrl); // URL string

    // 4. submit to Flask
    try {
      const res = await fetch(`${API_BASE}/api/requests`, {
        method: "POST",
        body: formDataToSend,
        headers: {
          ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
        },
      });

      const result = await res.json();

      if (result.success) {
        setMessage("Help request submitted successfully ✅");

        // ❌ OLD: only reset form
        // ✅ NEW: redirect to Status page and then reset
        navigate("/status"); // <-- REDIRECT HERE

        // if you also want to clear the form immediately
        setFormData({
          type: "",
          description: "",
          location: "",
          contact: "",
          priority: "Medium",
        });
        setPhoto(null);
        setPhotoPreview("");
        setLocationCoords({ lat: "", lng: "" });
        setLocationPermission(false);
      } else {
        setMessage(`Error: ${result.error || "Request failed"}`);
      }
    } catch (err) {
      console.error("Submit request error:", err);
      setMessage("Error submitting request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Request Help</h2>

        {message && <div style={styles.message}>{message}</div>}

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          {/* Help type */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Help Type <span style={styles.required}>*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              style={styles.input}
            >
              <option value="">Select help type</option>
              <option value="Medical">Medical</option>
              <option value="Accident">Accident</option>
              <option value="Fire">Fire</option>
              <option value="Food">Food</option>
              <option value="Shelter">Shelter</option>
              <option value="Rescue">Rescue</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Description <span style={styles.required}>*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              style={styles.textarea}
              placeholder="Describe the situation in detail"
            />
          </div>

          {/* Location address */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Location Address <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="Enter exact address (GPS location also required)"
            />
          </div>

          {/* Contact */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Contact Number <span style={styles.required}>*</span>
            </label>
            <input
              type="tel"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="Enter 10-digit phone number"
            />
          </div>

          {/* Priority */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Priority <span style={styles.required}>*</span>
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              required
              style={styles.input}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          {/* GPS Location */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              GPS Location <span style={styles.required}>*</span>
            </label>
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={loadingLocation} // 3. disable only while loading, always allow retry
              style={{
                ...styles.locationButton,
                ...(locationCoords.lat && locationCoords.lng
                  ? styles.locationButtonSuccess
                  : {}),
              }}
            >
              {loadingLocation
                ? "Fetching GPS location..."
                : locationCoords.lat && locationCoords.lng
                  ? "✓ GPS Location Captured (Tap to Refresh)"
                  : "Enable GPS Location (Required)"}
            </button>

            {locationCoords.lat && locationCoords.lng && (
              <p style={styles.coords}>
                📍 GPS: {locationCoords.lat}, {locationCoords.lng}
              </p>
            )}
          </div>

          {/* Photo upload */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Photo (optional)</label>
            <input
              id="photo"
              type="file"
              accept="image/jpeg, image/jpg, image/png"
              onChange={handlePhotoChange}
              style={styles.input}
            />
            {photoPreview && (
              <div style={styles.previewContainer}>
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={styles.previewImage}
                />
              </div>
            )}
            <small style={styles.helpText}>
              Image will be uploaded and its URL saved in the database
            </small>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting || !locationCoords.lat || !locationCoords.lng} // 4. disable if GPS not captured
            style={{
              ...styles.submitButton,
              ...(submitting || !locationCoords.lat || !locationCoords.lng
                ? styles.submitButtonDisabled
                : {}),
            }}
          >
            {submitting ? "Submitting..." : "Submit Help Request"}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f4f6f8",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "600px",
    backgroundColor: "#ffffff",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  },
  heading: {
    marginBottom: "20px",
    textAlign: "center",
    color: "#222",
  },
  message: {
    marginBottom: "15px",
    padding: "12px",
    borderRadius: "8px",
    backgroundColor: "#eef6ff",
    color: "#1d4f91",
    fontSize: "14px",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "600",
    color: "#333",
  },
  required: {
    color: "#ef4444",
    fontSize: "14px",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    resize: "vertical",
    boxSizing: "border-box",
  },
  locationButton: {
    padding: "12px 18px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    width: "100%",
  },
  locationButtonSuccess: {
    backgroundColor: "#16a34a",
    cursor: "default",
  },
  coords: {
    marginTop: "12px",
    fontSize: "14px",
    color: "#059669",
    fontWeight: "500",
    backgroundColor: "#ecfdf5",
    padding: "8px 12px",
    borderRadius: "6px",
    borderLeft: "4px solid #16a34a",
  },
  helpText: {
    color: "#6b7280",
    fontSize: "12px",
    display: "block",
    marginTop: "4px",
  },
  submitButton: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#16a34a",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
  },
  submitButtonDisabled: {
    backgroundColor: "#9ca3af",
    cursor: "not-allowed",
  },
  previewContainer: {
    marginTop: "12px",
  },
  previewImage: {
    width: "100px",
    height: "100px",
    borderRadius: "8px",
    objectFit: "cover",
    border: "1px solid #d1d5db",
  },
};

export default RequestHelp;
