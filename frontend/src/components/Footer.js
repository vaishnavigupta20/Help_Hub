// src/components/Footer.js
import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
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
          <Link to="/privacy">Privacy Policy</Link> •{" "}
          <Link to="/terms">Terms of Service</Link>
        </p>
      </div>
    </footer>
  );
}
