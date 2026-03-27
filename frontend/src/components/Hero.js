// src/components/Hero.js
import React from "react";

export default function Hero() {
  return (
    <section className="hero">
      <h1>HelpHub – Emergency Help & Animal Rescue</h1>
      <p>
        A social platform where people can request urgent help, rescue animals,
        find blood donors, and get food/clothes/medicine in real time.
      </p>
      <div className="hero-actions">
        <a href="/request" className="btn btn-primary">
          Request Help
        </a>
        <a href="/donate" className="btn btn-outline">
          Donate
        </a>
      </div>
    </section>
  );
}