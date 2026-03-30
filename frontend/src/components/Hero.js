// src/components/Hero.js
import React from "react";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="hero">
      <h1>HelpHub – Emergency Help & Animal Rescue</h1>
      <p>
        A social platform where people can request urgent help, rescue animals,
        find blood donors, and get food/clothes/medicine in real time.
      </p>
      <div className="hero-actions">
        <Link to="/request-help" className="btn btn-primary">
          Request Help
        </Link>
        <Link to="/donate" className="btn btn-outline">
          Donate
        </Link>
      </div>
    </section>
  );
}
