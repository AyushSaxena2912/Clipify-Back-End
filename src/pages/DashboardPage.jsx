// pages/DashboardPage.jsx - SIMPLIFIED WORKING VERSION
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  
  // Simple state
  const [videoUrl, setVideoUrl] = useState('');
  const [clipCount, setClipCount] = useState(5);
  const [durationType, setDurationType] = useState('full');
  
  // Simple time state
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  const [clipDuration, setClipDuration] = useState(60);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedClips, setGeneratedClips] = useState([]);
  const [activeSidebar, setActiveSidebar] = useState('dashboard');

  // DIRECT WORKING FUNCTIONS
  const increaseCount = () => {
    if (clipCount < 20) {
      setClipCount(clipCount + 1);
    }
  };

  const decreaseCount = () => {
    if (clipCount > 1) {
      setClipCount(clipCount - 1);
    }
  };

  const handleStartTimeChange = (e) => {
    setStartTime(e.target.value);
  };

  const handleEndTimeChange = (e) => {
    setEndTime(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (durationType === 'range') {
      if (!startTime || !endTime) {
        alert('Please enter both start and end times');
        return;
      }
    }
    
    setIsProcessing(true);
    
    setTimeout(() => {
      const mockClips = [];
      for (let i = 0; i < clipCount; i++) {
        mockClips.push({
          id: i + 1,
          title: `Clip ${i + 1}`,
          duration: clipDuration,
          thumbnail: `https://via.placeholder.com/300x200/1e4b6e/ffffff?text=Clip+${i + 1}`,
          timestamp: `${Math.floor(Math.random() * 10)}:${Math.floor(Math.random() * 60)}`
        });
      }
      setGeneratedClips(mockClips);
      setIsProcessing(false);
    }, 3000);
  };

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      {/* Premium Animated Background */}
      <div className="dashboard-bg">
        <div className="bg-gradient"></div>
        <div className="bg-particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="particle" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`
            }}></div>
          ))}
        </div>
      </div>

      {/* Premium Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo" onClick={() => navigate('/')}>
            <span className="logo-gradient">ClipMantra</span>
          </div>
          <div className="sidebar-status">
            <span className="status-dot"></span>
            <span className="status-text">Active</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeSidebar === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveSidebar('dashboard')}
          >
            <div className="nav-icon-wrapper">
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 9L12 3L21 9V20H3V9Z" strokeWidth="2"/>
                <path d="M9 20V14H15V20" strokeWidth="2"/>
              </svg>
            </div>
            <span>Dashboard</span>
            {activeSidebar === 'dashboard' && <div className="nav-indicator"></div>}
          </button>

          <button 
            className={`nav-item ${activeSidebar === 'history' ? 'active' : ''}`}
            onClick={() => setActiveSidebar('history')}
          >
            <div className="nav-icon-wrapper">
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <path d="M12 6V12L16 14" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span>History</span>
            {activeSidebar === 'history' && <div className="nav-indicator"></div>}
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info-sidebar">
            <div className="user-avatar-sidebar">CR</div>
            <div className="user-details">
              <span className="user-name-sidebar">Creator</span>
              <span className="user-plan-sidebar">Pro Plan</span>
            </div>
          </div>
          <button className="nav-item logout" onClick={handleLogout}>
            <div className="nav-icon-wrapper">
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M15 3H19C20.1 3 21 3.9 21 5V19C21 20.1 20.1 21 19 21H15" strokeWidth="2"/>
                <path d="M10 17L15 12L10 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 12H3" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Premium Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <h1 className="header-title">
              Welcome back, <span className="gradient-text">Creator</span>
            </h1>
            <p className="header-date">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="header-right">
            <div className="header-actions">
              <button className="icon-button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" strokeWidth="2"/>
                  <path d="M9 17V18C9 18.7956 9.31607 19.5587 9.87868 20.1213C10.4413 20.6839 11.2044 21 12 21C12.7956 21 13.5587 20.6839 14.1213 20.1213C14.6839 19.5587 15 18.7956 15 18V17" strokeWidth="2"/>
                </svg>
                <span className="notification-badge">3</span>
              </button>
              <button className="icon-button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H5.78a1.65 1.65 0 0 0-1.51 1 1.65 1.65 0 0 0 .33 1.82l.07.08A10 10 0 0 0 12 17.66a10 10 0 0 0 6.18-2.58l.07-.08z" strokeWidth="2"/>
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="dashboard-content">
          {/* Welcome Banner */}
          <div className="welcome-banner">
            <div className="banner-content">
              <h2>Ready to create something amazing?</h2>
              <p>Transform your long videos into engaging clips with AI</p>
            </div>
            <div className="banner-stats">
              <div className="banner-stat">
                <span className="banner-stat-value">15</span>
                <span className="banner-stat-label">Videos</span>
              </div>
              <div className="banner-stat">
                <span className="banner-stat-value">127</span>
                <span className="banner-stat-label">Clips</span>
              </div>
            </div>
          </div>

          {/* Creator Card */}
          <section className="content-section">
            <div className="section-header">
              <h2 className="section-title">
                <span className="title-accent"></span>
                Create New Clips
              </h2>
            </div>
            
            <div className="creator-card-modern">
              <form onSubmit={handleSubmit}>
                <div className="form-layout">
                  {/* Left Column */}
                  <div className="form-main">
                    <div className="input-group-modern">
                      <label>
                        <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z" strokeWidth="2"/>
                        </svg>
                        Video URL
                      </label>
                      <div className="input-wrapper-modern">
                        <input
                          type="url"
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                          className="modern-input"
                          required
                        />
                        {videoUrl && <div className="input-check">✓</div>}
                      </div>
                    </div>

                    <div className="controls-row">
                      <div className="control-block">
                        <label>Number of Clips</label>
                        <div className="clip-counter-arrows">
                          <button 
                            type="button"
                            onClick={decreaseCount}
                            className="arrow-btn"
                          >−</button>
                          <span className="clip-count-display">{clipCount}</span>
                          <button 
                            type="button"
                            onClick={increaseCount}
                            className="arrow-btn"
                          >+</button>
                        </div>
                      </div>

                      <div className="control-block">
                        <label>Clip Duration</label>
                        <div className="dropdown-wrapper">
                          <select 
                            value={clipDuration}
                            onChange={(e) => setClipDuration(Number(e.target.value))}
                            className="dropdown-select"
                          >
                            <option value="30">30 seconds</option>
                            <option value="45">45 seconds</option>
                            <option value="60">60 seconds</option>
                            <option value="90">90 seconds</option>
                            <option value="120">2 minutes</option>
                            <option value="180">3 minutes</option>
                          </select>
                          <div className="dropdown-arrow">▼</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Range Selection */}
                  <div className="form-range">
                    <div className="range-header">
                      <label>Video Range</label>
                      <div className="range-toggle">
                        <button
                          type="button"
                          className={`toggle-option ${durationType === 'full' ? 'active' : ''}`}
                          onClick={() => setDurationType('full')}
                        >
                          Full
                        </button>
                        <button
                          type="button"
                          className={`toggle-option ${durationType === 'range' ? 'active' : ''}`}
                          onClick={() => setDurationType('range')}
                        >
                          Custom
                        </button>
                      </div>
                    </div>

                    {durationType === 'range' && (
                      <div className="time-inputs-simple">
                        <div className="time-field">
                          <label>Start Time (MM:SS)</label>
                          <input
                            type="text"
                            value={startTime}
                            onChange={handleStartTimeChange}
                            placeholder="05:30"
                            className="modern-input"
                          />
                        </div>
                        <div className="time-field">
                          <label>End Time (MM:SS)</label>
                          <input
                            type="text"
                            value={endTime}
                            onChange={handleEndTimeChange}
                            placeholder="15:45"
                            className="modern-input"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="submit-button-modern"
                  disabled={isProcessing || !videoUrl}
                >
                  {isProcessing ? (
                    <>
                      <div className="spinner-ring"></div>
                      <span>Processing Video...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Clips</span>
                      <svg className="button-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>
          </section>

          {/* Processing Section */}
          {isProcessing && (
            <section className="content-section">
              <div className="processing-modern">
                <div className="processing-header">
                  <h3>Processing Pipeline</h3>
                  <div className="processing-timer">~30 seconds remaining</div>
                </div>
                <div className="processing-steps-modern">
                  <div className="proc-step active">
                    <div className="proc-step-indicator">
                      <div className="proc-step-circle"></div>
                      <div className="proc-step-line"></div>
                    </div>
                    <div className="proc-step-content">
                      <span className="proc-step-name">Downloading</span>
                      <div className="proc-progress">
                        <div className="proc-progress-fill" style={{width: '100%'}}></div>
                      </div>
                    </div>
                    <span className="proc-step-status">Complete</span>
                  </div>
                  <div className="proc-step active">
                    <div className="proc-step-indicator">
                      <div className="proc-step-circle"></div>
                      <div className="proc-step-line"></div>
                    </div>
                    <div className="proc-step-content">
                      <span className="proc-step-name">Transcribing</span>
                      <div className="proc-progress">
                        <div className="proc-progress-fill" style={{width: '75%'}}></div>
                      </div>
                    </div>
                    <span className="proc-step-status">75%</span>
                  </div>
                  <div className="proc-step">
                    <div className="proc-step-indicator">
                      <div className="proc-step-circle"></div>
                      <div className="proc-step-line"></div>
                    </div>
                    <div className="proc-step-content">
                      <span className="proc-step-name">Analyzing</span>
                      <div className="proc-progress">
                        <div className="proc-progress-fill" style={{width: '30%'}}></div>
                      </div>
                    </div>
                    <span className="proc-step-status">30%</span>
                  </div>
                  <div className="proc-step">
                    <div className="proc-step-indicator">
                      <div className="proc-step-circle"></div>
                    </div>
                    <div className="proc-step-content">
                      <span className="proc-step-name">Rendering</span>
                      <div className="proc-progress">
                        <div className="proc-progress-fill" style={{width: '0%'}}></div>
                      </div>
                    </div>
                    <span className="proc-step-status">Pending</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Results Section */}
          {generatedClips.length > 0 && (
            <section className="content-section">
              <div className="section-header">
                <h2 className="section-title">
                  <span className="title-accent"></span>
                  Generated Clips
                </h2>
                <button className="export-button">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" strokeWidth="2"/>
                    <path d="M7 10L12 15L17 10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15V3" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Export All
                </button>
              </div>
              
              <div className="clips-showcase">
                {generatedClips.map((clip, index) => (
                  <div key={clip.id} className="clip-item" style={{animationDelay: `${index * 0.1}s`}}>
                    <div className="clip-preview">
                      <img src={clip.thumbnail} alt={clip.title} />
                      <div className="clip-hover">
                        <button className="clip-play-button">
                          <svg viewBox="0 0 24 24" fill="none" stroke="white">
                            <polygon points="5 3 19 12 5 21 5 3" fill="white"/>
                          </svg>
                        </button>
                      </div>
                      <span className="clip-badge-modern">{clip.duration}s</span>
                    </div>
                    <div className="clip-details-modern">
                      <h4>{clip.title}</h4>
                      <div className="clip-meta-modern">
                        <span>{clip.timestamp}</span>
                      </div>
                      <div className="clip-actions-modern">
                        <button className="clip-btn preview">Preview</button>
                        <button className="clip-btn download">Download</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;