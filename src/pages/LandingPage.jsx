// pages/LandingPage.jsx
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const textRef = useRef(null);
  const containerRef = useRef(null);
  const indicatorRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (textRef.current && containerRef.current) {
        const scrollY = window.scrollY;
        const maxScroll = window.innerHeight;
        const scale = Math.max(1, 1 + (scrollY / maxScroll) * 3);
        const opacity = Math.max(0, 1 - scrollY / (maxScroll * 0.8));
        
        textRef.current.style.transform = `scale(${scale})`;
        textRef.current.style.opacity = opacity;
        
        // Parallax effect
        if (containerRef.current) {
          containerRef.current.style.transform = `translateY(${scrollY * 0.5}px)`;
        }

        if (indicatorRef.current) {
          indicatorRef.current.style.opacity = Math.max(0, 1 - scrollY / 200);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScroll = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  return (
    <div className="landing-container">
      <div className="gradient-bg">
        <div className="gradient-layer"></div>
        <div className="gradient-layer"></div>
      </div>
      
      <div className="hero-section" ref={containerRef}>
        <div className="hero-content">
          <h1 className="seone-title" ref={textRef}>
            <span className="gradient-text">ClipMantra</span>
          </h1>
          <p className="hero-tagline">
            Transform Long Videos into Viral Clips
          </p>
          
          <div className="scroll-indicator" onClick={handleScroll} ref={indicatorRef}>
            <span className="scroll-line"></span>
            <span className="scroll-text">Explore</span>
          </div>
        </div>
      </div>

      <div className="platform-section">
        <div className="platform-card">
          <div className="platform-header">
            <h2 className="platform-title">Video Intelligence Platform</h2>
            <p className="platform-subtitle">
              Automatically identify and extract the most engaging moments from your long-form content
            </p>
          </div>

          <div className="platform-grid">
            <div className="platform-feature">
             
              <h3>AI Transcription</h3>
              <p>Whisper-powered accurate transcription with speaker identification</p>
            </div>
            <div className="platform-feature">
              
              <h3>Moment Detection</h3>
              <p>Gemini AI identifies hooks, stories, and emotional peaks</p>
            </div>
            <div className="platform-feature">
             
              <h3>Automated Editing</h3>
              <p>FFmpeg creates perfectly timed clips ready for social media</p>
            </div>
          </div>

          
          <div className="platform-action" onClick={() => navigate('/auth')}>
            <button className="action-button">
              <span>Access Platform</span>
              <svg className="action-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <footer className="landing-footer">
        <div className="footer-content">
         
          
          <p className="footer-copyright">© 2026 ClipMantra. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;