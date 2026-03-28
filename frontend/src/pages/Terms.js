// src/pages/Terms.js ✅ NEW FILE
import React from 'react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div style={{ 
      padding: '60px 20px', 
      maxWidth: '900px', 
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ 
          fontSize: '36px', 
          color: '#111827', 
          marginBottom: '10px' 
        }}>
          ⚖️ Terms of Service
        </h1>
        <p style={{ color: '#6b7280', fontSize: '18px' }}>
          Last updated: March 28, 2026
        </p>
      </div>

      <div style={{ lineHeight: '1.7', color: '#374151' }}>
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', color: '#111827', marginBottom: '16px' }}>
            1. Acceptance of Terms
          </h2>
          <p>
            By using HelpHub, you agree to these Terms. If you don't agree, please don't use our service.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', color: '#111827', marginBottom: '16px' }}>
            2. Eligible Users
          </h2>
          <ul style={{ paddingLeft: '24px', marginBottom: '24px' }}>
            <li>Must be 18+ years old</li>
            <li>Provide accurate contact information</li>
            <li>Use service only for legitimate help requests</li>
          </ul>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', color: '#111827', marginBottom: '16px' }}>
            3. Your Responsibilities
          </h2>
          <ul style={{ paddingLeft: '24px', marginBottom: '24px' }}>
            <li>Be honest about your needs</li>
            <li>Respect helpers' time and privacy</li>
            <li>Mark requests "Resolved" when complete</li>
            <li>No spam, scams, or illegal requests</li>
          </ul>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', color: '#111827', marginBottom: '16px' }}>
            4. Our Responsibilities
          </h2>
          <ul style={{ paddingLeft: '24px', marginBottom: '24px' }}>
            <li>Connect you with verified helpers</li>
            <li>Protect your data (see Privacy Policy)</li>
            <li>Remove fraudulent requests</li>
            <li>Service available "as-is" (no guarantees)</li>
          </ul>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', color: '#111827', marginBottom: '16px' }}>
            5. Prohibited Activities
          </h2>
          <ul style={{ paddingLeft: '24px', marginBottom: '24px' }}>
            <li>No commercial services/sales</li>
            <li>No hate speech or harassment</li>
            <li>No fake emergency requests</li>
            <li>No spam or bulk messaging</li>
          </ul>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', color: '#111827', marginBottom: '16px' }}>
            6. Account Termination
          </h2>
          <p>
            We may suspend accounts for violations. Repeated offenders get permanent bans.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', color: '#111827', marginBottom: '16px' }}>
            7. Liability
          </h2>
          <p>
            HelpHub is a connector only. We're not responsible for:
          </p>
          <ul style={{ paddingLeft: '24px', marginBottom: '24px' }}>
            <li>Interactions between users</li>
            <li>Quality of help provided</li>
            <li>Any damages or losses</li>
          </ul>
        </section>

        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '24px', color: '#111827', marginBottom: '16px' }}>
            8. Changes to Terms
          </h2>
          <p>
            We may update Terms. Continued use = acceptance of changes.
          </p>
        </section>

        <div style={{ 
          textAlign: 'center', 
          padding: '30px', 
          background: '#f9fafb', 
          borderRadius: '16px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <Link to="/privacy" style={{ color: '#3b82f6', textDecoration: 'none' }}>
              📜 Privacy Policy
            </Link>
            {' | '}
            <a href="mailto:support@helphub.com" style={{ color: '#3b82f6', textDecoration: 'none' }}>
              ✉️ Contact Support
            </a>
          </div>
          <p style={{ margin: 0, color: '#6b7280' }}>
            © 2026 HelpHub. Built for community.
          </p>
        </div>
      </div>
    </div>
  );
}
