import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      <header className="landing-header">
        <h1>DirectMessage</h1>
        <p>Connect with friends and colleagues instantly</p>
      </header>

      <section className="features-section">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Real-time Messaging</h3>
            <p>Send and receive messages instantly with friends and colleagues</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Group Chats</h3>
            <p>Create group conversations with multiple participants</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure Communication</h3>
            <p>Your messages are protected and private</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📎</div>
            <h3>File Sharing</h3>
            <p>Share images, documents, and more with your contacts</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌐</div>
            <h3>Cross-Platform</h3>
            <p>Access your messages from any device, anywhere</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👤</div>
            <h3>User Profiles</h3>
            <p>Customize your profile and manage your contacts</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to get started?</h2>
        <div className="cta-buttons">
          <Link to="/login" className="btn btn-primary">Login</Link>
          <Link to="/register" className="btn btn-secondary">Sign Up</Link>
        </div>
      </section>

      <footer className="landing-footer">
        <p>&copy; 2025 DirectMessage App. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
