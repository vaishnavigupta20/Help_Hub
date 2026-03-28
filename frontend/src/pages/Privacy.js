// src/pages/Privacy.js ✅ NEW FILE
import React from 'react';
import { Link } from 'react-router-dom';

export default function Privacy() {
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
          📜 Privacy Policy
        </h1>
        <p style={{ color: '#6b7280', fontSize: '18px' }}>
          Last updated: March 28, 2026
        </p>
      </div>

      <div style={{ lineHeight: '1.7', color: '#374151' }}>
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', color: '#111827', marginBottom: '16px' }}>
            1. Information We Collect
          </h2>
          <ul style={{ paddingLeft: '24px', marginBottom: '24px' }}>
            <li><strong>Personal Information:</strong> Name, email, phone (when you request help or offer help)</li>
            <li><strong>Location Data:</strong> City/Location for help requests (optional)</li>
            <li><strong>Usage Data:</strong> Pages visited, time spent (anonymous)</li>
          </ul>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', color: '#111827', marginBottom: '16px' }}>
            2. How We Use Your Information
          </h2>
          <ul style={{ paddingLeft: '24px', marginBottom: '24px' }}>
            <li>Match helpers with people who need assistance</li>
            <li>Send notifications about request status</li>
            <li>Improve our matching algorithm</li>
            <li>Never sell your data to 3rd parties</li>
          </ul>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', color: '#111827', marginBottom: '16px' }}>
            3. Data Security
          </h2>
          <p>
            We use JWT tokens and HTTPS encryption. Your data is stored securely and 
            only accessible by authorized users helping with requests.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', color: '#111827', marginBottom: '16px' }}>
            4. Your Rights
          </h2>
          <ul style={{ paddingLeft: '24px', marginBottom: '24px' }}>
            <li><strong>Delete Account:</strong> Contact us to remove all data</li>
            <li><strong>Download Data:</strong> Email support@helphub.com</li>
            <li><strong>Opt-out:</strong> Unsubscribe from notifications anytime</li>
          </ul>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', color: '#111827', marginBottom: '16px' }}>
            5. Cookies
          </h2>
          <p>
            We use essential cookies for authentication only. No tracking cookies.
          </p>
        </section>

        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '24px', color: '#111827', marginBottom: '16px' }}>
            6. Contact Us
          </h2>
          <p>
            Questions? Email <a href="mailto:support@helphub.com" style={{ color: '#3b82f6' }}>
              support@helphub.com
            </a>
          </p>
        </section>

        <div style={{ 
          textAlign: 'center', 
          padding: '30px', 
          background: '#f9fafb', 
          borderRadius: '16px',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ margin: 0, color: '#6b7280' }}>
            © 2026 HelpHub. Helping communities, one request at a time.
          </p>
        </div>
      </div>
    </div>
  );
}
