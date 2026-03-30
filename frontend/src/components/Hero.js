// src/components/Hero.js
import React from "react";

export default function Hero() {
  const API_BASE = process.env.REACT_APP_API_BASE;
  return (
    <section className="hero">
      <h1>HelpHub – Emergency Help & Animal Rescue</h1>
      <p>
        A social platform where people can request urgent help, rescue animals,
        find blood donors, and get food/clothes/medicine in real time.
      </p>
      <div className="hero-actions">
        <a href=`${API_BASE}/request` className="btn btn-primary">
          Request Help
        </a>
        <a href=`{API_BASE}/donate` className="btn btn-outline">
          Donate
        </a>
      </div>
    </section>
  );
}
