import React from 'react';
import myLogo from './assets/riri.svg';
import bird from './assets/birdd.svg';

function Head({ 
  prompt, 
  setPrompt, 
  onGenerate, 
  loading, 
  useMock, 
  setUseMock, 
  backendUrl, 
  setBackendUrl, 
  connectionStatus 
}) {
  return (
    <div className="hero-container">
      {/* Branding and Taglines */}
      <div className="branding">
        <img src={myLogo} className="logo-img" alt="riri logo" />
        <h1 className="main-title">Riri AI</h1>
        <p className="tagline-1">Turning everything real, relaxing, rendering</p>
        <p className="tagline-2">Rit for your inner world</p>
      </div>

      {/* Floating Animated Mascot */}
      <div className="mascot-container">
        <img src={bird} className="mascot-img" alt="bird mascot" />
      </div>

      {/* Settings / Connection Config */}
      <div className="settings-panel card">
        <h3>Connection Settings</h3>
        <div className="toggle-container">
          <button 
            type="button" 
            className={`toggle-btn ${useMock ? 'active' : ''}`} 
            onClick={() => setUseMock(true)}
          >
            Local Mock Synth (Offline)
          </button>
          <button 
            type="button" 
            className={`toggle-btn ${!useMock ? 'active' : ''}`} 
            onClick={() => setUseMock(false)}
          >
            Real AI Server
          </button>
        </div>

        {!useMock && (
          <div className="api-input-group">
            <input
              type="text"
              className="backend-url-input"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="Enter ngrok URL (e.g., https://f4b3...ngrok-free.app)"
            />
            <span className={`status-indicator ${connectionStatus}`}>
              {connectionStatus === 'online' && '● Connected'}
              {connectionStatus === 'offline' && '● Disconnected'}
              {connectionStatus === 'testing' && '● Testing Connection...'}
            </span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="input-panel card">
        <label htmlFor="prompt-input" className="subtext">
          Describe the mood, instruments, or vibe you want to generate:
        </label>
        <textarea
          id="prompt-input"
          className="inputext"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. A soft acoustic playing in the background with a hint of lo-fi beats..."
          disabled={loading}
        />
        <button 
          onClick={onGenerate} 
          className={`generate-button ${loading ? 'loading' : ''}`}
          disabled={loading || (!useMock && !backendUrl)}
        >
          {loading ? (
            <span className="spinner-wrapper">
              <span className="spinner"></span>
              Generating...
            </span>
          ) : (
            'Generate Soundscape'
          )}
        </button>
      </div>
    </div>
  );
}

export default Head;