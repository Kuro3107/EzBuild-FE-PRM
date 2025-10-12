import React from 'react'
import { Link } from 'react-router-dom'
// Removed Ant Design imports - using native HTML/CSS instead

interface LandingHeroProps {
  currentUser?: Record<string, unknown> | null
}

const LandingHero: React.FC<LandingHeroProps> = ({ currentUser }) => {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e3a8a 0%, #000000 100%)',
      padding: '120px 0 80px',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', width: '100%' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '48px',
          alignItems: 'center'
        }}>
          <div style={{ color: 'white', paddingRight: '32px' }} className="hero-text-section">
            <h1 style={{ 
              color: 'white', 
              fontSize: '56px', 
              fontWeight: 700,
              marginBottom: '24px',
              lineHeight: 1.1,
              marginTop: 0
            }}>
              Build Your Dream PC
              <br />
              <span style={{ color: '#ffd700' }}>With EzBuild</span>
            </h1>
            
            <p style={{ 
              color: 'rgba(255,255,255,0.9)', 
              fontSize: '18px', 
              lineHeight: 1.6,
              marginBottom: '40px',
              maxWidth: '520px'
            }}>
              Create the perfect PC build with our advanced compatibility checker, 
              real-time price comparison, and expert recommendations. 
              From gaming rigs to workstations, we've got you covered.
            </p>
            
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <Link 
                to="/pcbuilder"
                style={{
                  height: '52px',
                  padding: '0 36px',
                  fontSize: '16px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  background: '#1e3a8a',
                  border: '2px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#3b82f6'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#1e3a8a'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14"/>
                  <path d="M12 5l7 7-7 7"/>
                </svg>
                Start Building
              </Link>
              
              <button 
                style={{
                  height: '52px',
                  padding: '0 36px',
                  fontSize: '16px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '2px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5,3 19,12 5,21"/>
                </svg>
                Watch Demo
              </button>
            </div>
            
            {!currentUser && (
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                  Already have an account?
                </span>
                <Link 
                  to="/login"
                  style={{ 
                    color: '#ffd700', 
                    padding: 0,
                    fontWeight: 600,
                    textDecoration: 'underline',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '24px',
              padding: '48px 40px',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              textAlign: 'center',
              maxWidth: '400px',
              width: '100%'
            }}>
              <div style={{
                width: '200px',
                height: '200px',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                borderRadius: '50%',
                margin: '0 auto 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '80px',
                color: 'white',
                boxShadow: '0 15px 30px rgba(0,0,0,0.2)'
              }}>
                🖥️
              </div>
              <h3 style={{ 
                color: 'white', 
                marginBottom: '16px',
                fontSize: '24px',
                fontWeight: 700,
                margin: '0 0 16px 0'
              }}>
                Interactive PC Builder
              </h3>
              <p style={{ 
                color: 'rgba(255,255,255,0.8)', 
                marginBottom: 0,
                fontSize: '16px',
                lineHeight: 1.5
              }}>
                Drag, drop, and customize your perfect build
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingHero
