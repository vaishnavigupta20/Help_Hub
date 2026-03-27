// src/pages/Home.js
import React from "react";
import Hero from "../components/Hero";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FeatureCard from "../components/FeatureCard";

export default function Home() {
  const features = [
    {
      title: "Needy Person Help Connect",
      description:
        "Request food, clothes, medicine, or general help using location and photo‑based real‑time assistance.",
      link: "/request",
    },
    {
      title: "Lost / Found Pet Alerts",
      description:
        "Upload pet photos and get nearby alerts for lost or found pets via your community and NGOs.",
      link: "/animal-rescue",
    },
    {
      title: "Blood / Medicine Urgency",
      description:
        "Find nearby blood donors and urgent medicine help with real‑time status updates and direct contact.",
      link: "/blood-network",
    },
    {
      title: "Animal Rescue & Help Reporter",
      description:
        "Report injured, hungry, or lost animals and get notified when NGOs and volunteers arrive to help.",
      link: "/animal-rescue",
    },
  ];

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <div className="container">
          <h2>How HelpHub Works</h2>
          <div className="features">
            {features.map((feat, i) => (
              <FeatureCard key={i} {...feat} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}