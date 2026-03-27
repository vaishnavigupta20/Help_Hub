// src/pages/RequestHelp.js - AUTO LOCATION + PHOTO
import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const HELP_TYPES = [
  { value: "food", label: "Food" },
  { value: "clothes", label: "Clothes" },
  { value: "medicine", label: "Medicine" },
  { value: "blood", label: "Blood Request" },
  { value: "animal_rescue", label: "Animal Rescue" },
  { value: "general", label: "General Help" },
];

export default function RequestHelp() {
  const { user, isLoggedIn } = useAuth();
  const [form, setForm] = useState({
    type: "general",
    description: "",
    location: "",
    contact: "",
    priority: "Medium",
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);  // ✅ GPS status
  const locationInputRef = useRef(null);  // ✅ Focus after GPS
  const navigate = useNavigate();

  if (!isLoggedIn) {
    return (
      <div className="container">
        <h2>Request Help</h2>
        <p>Please <a href="/login">login</a> to request help.</p>
      </div>
    );
  }

  // ✅ AUTO DETECT LOCATION (GPS)
  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Reverse geocode coordinates to address
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          const location = data.display_name || 
                          `${data.address?.city || 'Area'}, ${data.address?.state || ''}`;
          
          setForm(prev => ({ ...prev, location }));
          locationInputRef.current?.focus();
          
          alert(`📍 Location detected: ${location}`);
        } catch (error) {
          // Fallback to coordinates
          setForm(prev => ({ 
            ...prev, 
            location: `Lat: ${position.coords.latitude.toFixed(2)}, Lng: ${position.coords.longitude.toFixed(2)}`
          }));
          alert('📍 GPS coordinates captured!');
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocating(false);
        alert('GPS access denied. Please enter location manually.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.description.trim()) newErrors.description = "Description required";
    if (!form.location.trim()) newErrors.location = "Location required";
    if (!form.contact.trim()) newErrors.contact = "Contact required";
    if (!photo) newErrors.photo = "📸 Photo proof REQUIRED";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      alert('✅ Request submitted successfully!');
      navigate("/status");
    }, 2000);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '20px 0', background: 'white' }}>
      <div style={{ 
        maxWidth: '500px', 
        margin: '0 auto', 
        padding: '40px 24px', 
        background: 'white', 
        borderRadius: '16px', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.08)' 
      }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: '8px' }}>
          Request Help
        </h2>
        <p style={{ color: '#6b7280', textAlign: 'center', marginBottom: '32px' }}>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Type */}
          <div>
            <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>
              Type of Help
            </label>
            <select name="type" value={form.type} onChange={handleChange} disabled={loading}
              style={{ width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '16px', background: '#f9fafb' }}>
              {HELP_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>
              Description
            </label>
            <textarea name="description" rows="4" value={form.description} onChange={handleChange} disabled={loading}
              style={{ width: '100%', padding: '12px 16px', border: errors.description ? '2px solid #ef4444' : '2px solid #e5e7eb', borderRadius: '12px', fontSize: '16px', background: '#f9fafb', resize: 'vertical' }}
              placeholder="Describe your situation..." />
            {errors.description && <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>{errors.description}</p>}
          </div>

          {/* ✅ LOCATION WITH AUTO-DETECT */}
          <div>
            <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>
              📍 Location <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input 
                ref={locationInputRef}
                name="location" 
                type="text" 
                value={form.location} 
                onChange={handleChange}
                style={{
                  flex: 1, padding: '12px 16px',
                  border: errors.location ? '2px solid #ef4444' : '2px solid #e5e7eb',
                  borderRadius: '12px', fontSize: '16px', background: '#f9fafb'
                }} 
                placeholder="Enter location or click GPS..." 
                disabled={loading || locating}
              />
              <button 
                type="button"
                onClick={detectLocation}
                disabled={loading || locating}
                style={{
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: locating ? 'not-allowed' : 'pointer',
                  minWidth: '60px'
                }}
              >
                {locating ? '🔄' : '📍'}
              </button>
            </div>
            {errors.location && <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>{errors.location}</p>}
            <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
              Click 📍 for auto-detection or type manually
            </p>
          </div>

          {/* Contact */}
          <div>
            <label style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' }}>
              Contact (Phone/Email)
            </label>
            <input name="contact" type="text" value={form.contact} onChange={handleChange} disabled={loading}
              style={{ width: '100%', padding: '12px 16px', border: errors.contact ? '2px solid #ef4444' : '2px solid #e5e7eb', borderRadius: '12px', fontSize: '16px', background: '#f9fafb' }}
              placeholder="Phone number or email" />
          </div>

          {/* Photo Upload */}
          <div>
            <label style={{ fontWeight: '600', color: '#374151', marginBottom: '12px', display: 'block' }}>
              📸 Photo Proof (REQUIRED) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input type="file" accept="image/*" onChange={handlePhotoChange} required disabled={loading}
              style={{ width: '100%', padding: '12px', border: errors.photo ? '2px solid #ef4444' : '2px solid #e5e7eb', borderRadius: '12px', background: '#f9fafb' }} />
            {photoPreview && (
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <img src={photoPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
                <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>✅ {photo.name}</p>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading || !photo} style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white', padding: '16px 32px', border: 'none', borderRadius: '12px',
            fontSize: '18px', fontWeight: '700', cursor: loading || !photo ? 'not-allowed' : 'pointer',
            opacity: loading || !photo ? 0.6 : 1
          }}>
            {loading ? '📤 Submitting...' : '📤 Send Request'}
          </button>
        </form>
      </div>
    </div>
  );
}