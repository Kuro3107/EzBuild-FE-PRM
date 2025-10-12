import React from 'react'
// Removed Ant Design imports - using native HTML/CSS instead

const LandingFeatures: React.FC = () => {
  const features = [
    {
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#52c41a" strokeWidth="2">
          <path d="M9 12l2 2 4-4"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
      ),
      title: 'Compatibility Check',
      description: 'Advanced compatibility checking ensures all components work together perfectly.',
      color: '#52c41a'
    },
    {
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M16 8l-4 4-4-4"/>
        </svg>
      ),
      title: 'Price Comparison',
      description: 'Compare prices from multiple retailers to get the best deals on your build.',
      color: '#1e3a8a'
    },
    {
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#faad14" strokeWidth="2">
          <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
        </svg>
      ),
      title: 'Performance Analysis',
      description: 'Get detailed performance metrics and benchmarks for your selected components.',
      color: '#faad14'
    },
    {
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#722ed1" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      title: 'Community Reviews',
      description: 'Read real reviews from our community of PC builders and enthusiasts.',
      color: '#722ed1'
    },
    {
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f5222d" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
      title: 'Build Validation',
      description: 'Our AI validates your build for optimal performance and compatibility.',
      color: '#f5222d'
    },
    {
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#13c2c2" strokeWidth="2">
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
          <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
        </svg>
      ),
      title: 'Quick Start Templates',
      description: 'Choose from pre-built templates for gaming, work, or creative builds.',
      color: '#13c2c2'
    }
  ]

  return (
    <div style={{ padding: '80px 0', background: 'linear-gradient(135deg, #1e3a8a 0%, #000000 100%)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 700, marginBottom: '16px', color: 'white', margin: 0 }}>
            Why Choose EzBuild?
          </h2>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.8)', maxWidth: '600px', margin: '16px auto 0' }}>
            We provide everything you need to build the perfect PC, from planning to purchasing.
          </p>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '32px' 
        }}>
          {features.map((feature, index) => (
            <div
              key={index}
              style={{
                height: '100%',
                borderRadius: '16px',
                border: '1px solid #333333',
                background: '#111111',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'all 0.3s ease',
                padding: '32px 24px',
                textAlign: 'center',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              <div style={{ marginBottom: '24px' }}>
                {feature.icon}
              </div>
              <h4 style={{ marginBottom: '16px', fontSize: '20px', color: 'white', margin: '0 0 16px 0' }}>
                {feature.title}
              </h4>
              <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.6 }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LandingFeatures
