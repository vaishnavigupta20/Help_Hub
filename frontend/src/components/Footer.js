// src/components/Footer.js
import React from "react";

export default function Footer() {
  const API_BASE = process.env.REACT_APP_API_BASE;
  return (
    <footer className="footer">
      <div className="container">
        <p>
          <strong>HelpHub</strong> – Social emergency help platform for people,
          animals, food, clothes, medicine, and blood.
        </p>
        <p>
          📞 Emergency number: 108 / 112 | 🐾 Animal rescue: +91‑XXX‑XXXXXXX
        </p>
        <p>
          Made with ❤️ for communities in need.
        </p>
        <p>
          <a href=`${API_BASE}/privacy`>Privacy Policy</a> •{" "}
          <a href=`${API_BASE}/terms`>Terms of Service</a>
        </p>
      </div>
    </footer>
  );
}
