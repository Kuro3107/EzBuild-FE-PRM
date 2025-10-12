import React, { useEffect, useState } from 'react'
// Removed Ant Design imports - using native HTML/CSS instead

const LandingStats: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const stats = [
    {
      value: 125000,
      suffix: '+',
      title: 'PCs Built',
      description: 'Successfully completed builds'
    },
    {
      value: 50000,
      suffix: '+',
      title: 'Happy Users',
      description: 'Satisfied customers worldwide'
    },
    {
      value: 99.9,
      suffix: '%',
      title: 'Compatibility Rate',
      description: 'Builds without issues'
    },
    {
      value: 24,
      suffix: '/7',
      title: 'Support',
      description: 'Round-the-clock assistance'
    }
  ]

  return (
    <div style={{ 
      padding: '80px 0',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #000000 100%)',
      color: 'white'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{ color: 'white', fontSize: '36px', fontWeight: 700, marginBottom: '16px', margin: '0 0 16px 0' }}>
            Trusted by Builders Worldwide
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '18px', margin: 0 }}>
            Join thousands of successful PC builders who trust EzBuild
          </p>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '48px' 
        }}>
          {stats.map((stat, index) => (
            <div key={index} style={{ textAlign: 'center' }}>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '32px 24px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <div style={{
                  color: 'white',
                  fontSize: '48px',
                  fontWeight: 700,
                  lineHeight: 1,
                  marginBottom: '16px'
                }}>
                  {isVisible ? (stat.value < 100 ? stat.value.toFixed(1) : stat.value.toLocaleString()) : 0}{stat.suffix}
                </div>
                <h4 style={{ 
                  color: 'white', 
                  marginTop: '16px', 
                  marginBottom: '8px',
                  fontSize: '18px',
                  fontWeight: 600,
                  margin: '0 0 8px 0'
                }}>
                  {stat.title}
                </h4>
                <p style={{ 
                  color: 'rgba(255,255,255,0.8)', 
                  margin: 0, 
                  fontSize: '14px' 
                }}>
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LandingStats
