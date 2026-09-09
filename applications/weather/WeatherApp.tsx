import React, { useState } from 'react';
import { Sun, CloudRain, Wind, Droplets, Compass, Search } from 'lucide-react';
import './weather.css';

export const WeatherApp: React.FC<{ windowId: string; appId: string }> = () => {
  const [city, setCity] = useState('San Francisco, CA');
  const [temp] = useState(68);

  const forecast = [
    { day: 'Mon', high: 70, low: 54, condition: 'Sunny' },
    { day: 'Tue', high: 66, low: 52, condition: 'Partly Cloudy' },
    { day: 'Wed', high: 64, low: 50, condition: 'Rain' },
    { day: 'Thu', high: 68, low: 53, condition: 'Sunny' },
    { day: 'Fri', high: 72, low: 55, condition: 'Sunny' },
    { day: 'Sat', high: 75, low: 58, condition: 'Partly Cloudy' },
    { day: 'Sun', high: 69, low: 54, condition: 'Cloudy' },
  ];

  return (
    <div className="weather-container">
      {/* Search Header */}
      <div className="weather-header">
        <div className="weather-search">
          <Search size={14} />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Search city..."
          />
        </div>
      </div>

      {/* Main Temperature Hero */}
      <div className="weather-hero">
        <Sun size={64} className="weather-sun-icon" />
        <div className="weather-temp-main">{temp}°F</div>
        <div className="weather-condition-txt">Clear Sky & Sunny</div>
        <div className="weather-city-txt">{city}</div>
      </div>

      {/* Details Grid */}
      <div className="weather-details-grid">
        <div className="weather-stat-card">
          <Wind size={16} className="text-cyan" />
          <div className="stat-content">
            <span className="stat-lbl">Wind Speed</span>
            <span className="stat-val">9 mph NW</span>
          </div>
        </div>
        <div className="weather-stat-card">
          <Droplets size={16} className="text-blue-400" />
          <div className="stat-content">
            <span className="stat-lbl">Humidity</span>
            <span className="stat-val">62%</span>
          </div>
        </div>
        <div className="weather-stat-card">
          <Compass size={16} className="text-purple-400" />
          <div className="stat-content">
            <span className="stat-lbl">Pressure</span>
            <span className="stat-val">1014 hPa</span>
          </div>
        </div>
      </div>

      {/* 7-Day Forecast Row */}
      <div className="weather-forecast-row">
        {forecast.map((f) => (
          <div key={f.day} className="forecast-card">
            <span className="f-day">{f.day}</span>
            {f.condition === 'Rain' ? <CloudRain size={20} className="text-blue-400" /> : <Sun size={20} className="text-amber-400" />}
            <span className="f-high">{f.high}°</span>
            <span className="f-low">{f.low}°</span>
          </div>
        ))}
      </div>
    </div>
  );
};
