import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css';

const AuthPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Here you would typically validate and authenticate with your backend
    // For demo purposes, we'll just navigate to dashboard
    console.log('Authentication attempt:', activeTab === 'login' ? 'Login' : 'Signup', formData);
    
    // Navigate to dashboard
    navigate('/dashboard');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Brand Section */}
        <div className="brand-section">
          <div className="brand-content">
            <h1 className="brand-logo">Clip<span>Mantra</span></h1>
            <h2 className="brand-title">
              {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="brand-subtitle">
              {activeTab === 'login' 
                ? 'Sign in to access your dashboard and manage your account.'
                : 'Get started with your free account in just a few seconds.'}
            </p>
            
            <div className="feature-list">
              <div className="feature-item">
                <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Secure authentication</span>
              </div>
              <div className="feature-item">
                <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>24/7 account access</span>
              </div>
              <div className="feature-item">
                <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Personalized experience</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="form-section">
          {/* Tabs */}
          <div className="form-tabs">
            <button 
              className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Sign In
            </button>
            <button 
              className={`tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
              onClick={() => setActiveTab('signup')}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {activeTab === 'signup' && (
              <div className="name-row">
                <div className="form-group">
                  <label htmlFor="firstName">First name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                required
              />
            </div>

            {activeTab === 'signup' && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            {activeTab === 'login' && (
              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="rememberMe"
                  />
                  <span>Remember me</span>
                </label>
                <a href="#" className="forgot-link">Forgot password?</a>
              </div>
            )}

            {activeTab === 'signup' && (
              <div className="terms-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    required
                  />
                  <span>I agree to the <a href="#" className="terms-link">Terms</a> and <a href="#" className="terms-link">Privacy Policy</a></span>
                </label>
              </div>
            )}

            <button type="submit" className="submit-btn">
              {activeTab === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            <div className="form-footer">
              {activeTab === 'login' ? (
                <p>
                  Don't have an account?{' '}
                  <button 
                    type="button"
                    className="switch-btn"
                    onClick={() => setActiveTab('signup')}
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button 
                    type="button"
                    className="switch-btn"
                    onClick={() => setActiveTab('login')}
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </form>

          {/* Social Login */}
          <div className="social-section">
            <div className="divider">
              <span>Or continue with</span>
            </div>
            <div className="social-buttons">
              <button type="button" className="social-btn" onClick={() => navigate('/dashboard')}>
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                </svg>
                Google
              </button>
              <button type="button" className="social-btn" onClick={() => navigate('/dashboard')}>
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="currentColor" d="M13.397,20.997v-8.196h2.765l0.411-3.209h-3.176V7.548c0-0.926,0.258-1.56,1.587-1.56h1.684V3.127c-0.82-0.088-1.643-0.13-2.466-0.13c-2.444,0-4.122,1.492-4.122,4.231v2.355H7.332v3.209h2.753v8.202H13.397z"/>
                </svg>
                Facebook
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;