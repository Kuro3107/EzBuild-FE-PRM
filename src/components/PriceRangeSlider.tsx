import React from 'react'
// Removed Ant Design imports - using native HTML/CSS instead

interface PriceRangeSliderProps {
  value: [number, number]
  onChange: (value: [number, number]) => void
  min?: number
  max?: number
  step?: number
  currency?: string
  className?: string
}

const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
  value,
  onChange,
  min = 50,
  max = 2000,
  step = 10,
  currency = '$',
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`} style={{ color: 'white' }}>
      <div className="flex justify-between text-sm font-medium" style={{ color: 'white' }}>
        <span>{currency}{value[0]}</span>
        <span>{currency}{value[1]}</span>
      </div>
      <div style={{ position: 'relative', height: '20px' }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(e) => onChange([Number(e.target.value), value[1]])}
          style={{
            position: 'absolute',
            width: '100%',
            height: '4px',
            background: 'transparent',
            outline: 'none',
            appearance: 'none',
            zIndex: 2
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          onChange={(e) => onChange([value[0], Number(e.target.value)])}
          style={{
            position: 'absolute',
            width: '100%',
            height: '4px',
            background: 'transparent',
            outline: 'none',
            appearance: 'none',
            zIndex: 2
          }}
        />
        <div style={{
          position: 'absolute',
          top: '8px',
          left: '0',
          right: '0',
          height: '4px',
          background: '#e5e7eb',
          borderRadius: '2px'
        }} />
        <div style={{
          position: 'absolute',
          top: '8px',
          left: `${((value[0] - min) / (max - min)) * 100}%`,
          right: `${100 - ((value[1] - min) / (max - min)) * 100}%`,
          height: '4px',
          background: '#1e3a8a',
          borderRadius: '2px'
        }} />
      </div>
      <div className="flex justify-between text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
        <span>{currency}{min}</span>
        <span>{currency}{max}</span>
      </div>
    </div>
  )
}

export default PriceRangeSlider
