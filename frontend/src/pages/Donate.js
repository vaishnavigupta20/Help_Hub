// src/pages/Donate.js - ✅ REAL API NGOs ONLY
import React, { useState, useEffect } from "react";

export default function Donate() {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

  // ✅ FETCH REAL NGOs FROM YOUR FLASK API
  useEffect(() => {
    const fetchNgos = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/api/ngos`);
        const data = await res.json();

        if (data.success && data.ngos) {
          // ✅ Handle both model & simple API responses
          setNgos(
            data.ngos.map((ngo) => ({
              _id: ngo._id || ngo.id,
              name: ngo.name,
              description: ngo.description || "Supporting communities in need",
              phone: ngo.phone || "Contact via HelpHub",
              upi: ngo.upi,
              color: ngo.color || "#FF6B35",
              qr:
                ngo.qr ||
                `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ngo.upi}`,
            })),
          );
        } else {
          setError("No NGOs available. Admin needs to add some first.");
          setNgos([]);
        }
      } catch (error) {
        console.error("Network error:", error);
        setError("Backend not running? Check http://localhost:5000");
        setNgos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNgos();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "100px 20px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>🙏</div>
        <h2>Loading NGOs...</h2>
        <p>Connecting to HelpHub backend</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <h1
          style={{
            fontSize: "36px",
            fontWeight: "800",
            color: "#111827",
            marginBottom: "16px",
          }}
        >
          🙏 Support HelpHub
        </h1>
        <p
          style={{
            fontSize: "20px",
            color: "#6b7280",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          Help real people in Odisha & across India.{" "}
          {ngos.length > 0
            ? `${ngos.length} NGOs ready to help!`
            : "Add NGOs via Admin Panel"}
        </p>

        {/* Error Message */}
        {error && (
          <div
            style={{
              background: "#fef2f2",
              color: "#dc2626",
              padding: "16px",
              borderRadius: "12px",
              borderLeft: "4px solid #ef4444",
              marginTop: "20px",
            }}
          >
            ⚠️ {error}
            <br />
            <small>
              Admin: Go to /admin-login → Add NGOs → They'll appear here
              instantly!
            </small>
          </div>
        )}
      </div>

      {/* NGO CARDS */}
      {ngos.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "32px",
          }}
        >
          {ngos.map((ngo, index) => (
            <div
              key={ngo._id || index}
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "32px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                border: `3px solid ${ngo.color}20`,
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow =
                  "0 30px 60px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.1)";
              }}
            >
              {/* NGO Info */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "16px",
                    background: ngo.color,
                    color: "white",
                    fontSize: "24px",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {ngo.name?.[0]?.toUpperCase() || index + 1}
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "24px",
                      fontWeight: "700",
                      color: "#111827",
                      margin: 0,
                    }}
                  >
                    {ngo.name}
                  </h3>
                  <p
                    style={{
                      color: "#6b7280",
                      margin: "4px 0 0 0",
                      fontSize: "16px",
                    }}
                  >
                    {ngo.description}
                  </p>
                </div>
              </div>

              {/* Contact */}
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  flexWrap: "wrap",
                  marginBottom: "20px",
                }}
              >
                {ngo.phone && (
                  <div
                    style={{
                      background: "#f3f4f6",
                      padding: "12px 20px",
                      borderRadius: "12px",
                      fontSize: "16px",
                      fontWeight: "600",
                    }}
                  >
                    📞 {ngo.phone}
                  </div>
                )}
                <div
                  style={{
                    background: "#f0f9ff",
                    padding: "12px 20px",
                    borderRadius: "12px",
                    color: "#0369a1",
                    fontWeight: "600",
                  }}
                >
                  💳 UPI: {ngo.upi}
                </div>
              </div>

              {/* QR CODE */}
              <div
                style={{
                  textAlign: "center",
                  padding: "24px",
                  background: "#f8fafc",
                  borderRadius: "16px",
                }}
              >
                <img
                  src={ngo.qr}
                  alt={`${ngo.name} UPI QR`}
                  style={{
                    width: "200px",
                    height: "200px",
                    margin: "0 auto 16px",
                    borderRadius: "12px",
                    border: `4px solid ${ngo.color}20`,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                  loading="lazy"
                />
                <p style={{ color: "#374151", fontSize: "14px", margin: 0 }}>
                  📱 Scan QR with GPay/PhonePe/Paytm
                </p>
              </div>

              {/* Copy UPI */}
              <div style={{ textAlign: "center", marginTop: "24px" }}>
                <button
                  onClick={(e) => {
                    navigator.clipboard.writeText(ngo.upi);
                    const btn = e.target;
                    const original = btn.textContent;
                    btn.textContent = "✅ Copied!";
                    btn.style.background = "#10b981";
                    setTimeout(() => {
                      btn.textContent = original;
                      btn.style.background = ngo.color;
                    }, 2000);
                  }}
                  style={{
                    background: ngo.color,
                    color: "white",
                    padding: "14px 32px",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "16px",
                    fontWeight: "700",
                    cursor: "pointer",
                    boxShadow: `0 8px 25px ${ngo.color}40`,
                  }}
                >
                  💰 Copy UPI ID
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "120px 40px",
            background: "#f8fafc",
            borderRadius: "20px",
            border: "2px dashed #d1d5db",
          }}
        >
          <div
            style={{ fontSize: "64px", marginBottom: "24px", color: "#10b981" }}
          >
            💰
          </div>
          <h2
            style={{ color: "#111827", margin: "0 0 12px 0", fontSize: "28px" }}
          >
            No NGOs Yet
          </h2>
          <p style={{ color: "#6b7280", fontSize: "18px", margin: "0 0 24px" }}>
            Admin needs to add NGOs first
          </p>
          <a
            href="/admin-login"
            style={{
              background: "#3b82f6",
              color: "white",
              padding: "16px 32px",
              textDecoration: "none",
              borderRadius: "12px",
              fontWeight: "700",
              fontSize: "16px",
            }}
          >
            🛠️ Go to Admin Panel
          </a>
        </div>
      )}

      {/* Why Donate */}
      {!error && (
        <div
          style={{
            textAlign: "center",
            marginTop: "64px",
            padding: "40px",
            background: "#f8fafc",
            borderRadius: "20px",
          }}
        >
          <h2
            style={{ color: "#111827", fontSize: "24px", marginBottom: "16px" }}
          >
            Why donate through HelpHub?
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "24px",
              maxWidth: "800px",
              margin: "0 auto",
            }}
          >
            <div>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>✅</div>
              <h4 style={{ color: "#111827" }}>100% Transparent</h4>
              <p style={{ color: "#6b7280" }}>Direct to verified NGOs</p>
            </div>
            <div>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>🎯</div>
              <h4 style={{ color: "#111827" }}>Targeted Help</h4>
              <p style={{ color: "#6b7280" }}>Emergency relief only</p>
            </div>
            <div>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>📍</div>
              <h4 style={{ color: "#111827" }}>Local First</h4>
              <p style={{ color: "#6b7280" }}>Odisha & nearby areas</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
