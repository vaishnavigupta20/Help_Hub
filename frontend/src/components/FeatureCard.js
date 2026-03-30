// src/components/FeatureCard.js
import React from "react";
import { Link } from "react-router-dom";

export default function FeatureCard({ title, description, icon, link }) {
  return (
    <div className="feature-card">
      <h3>{title}</h3>
      <p>{description}</p>
      {link && (
        <Link to={link} className="btn btn-outline">
          Learn More
        </Link>
      )}
    </div>
  );
}

// Example usage object
FeatureCard.defaultProps = {
  title: "Feature",
  description: "Some description here.",
  icon: null,
  link: "",
};