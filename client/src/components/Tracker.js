// client/src/components/Tracker.js
import React, { useState } from 'react';

const Tracker = () => {
  const [salah, setSalah] = useState({
    fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0
  });

  const calculateScore = () => {
    const totalPoints = Object.values(salah).reduce((a, b) => a + b, 0);
    return Math.round((totalPoints / 15) * 100);
  };

  return (
    <div className="glass-card">
      <h2>Daily Salah Tracker</h2>
      <p>Points: 1 (Qaza), 2 (Individual), 3 (Jammat)</p>
      
      <div className="productivity-bar-container">
        <div className="productivity-fill" style={{ width: `${calculateScore()}%` }}></div>
      </div>
      <p>Productivity: {calculateScore()}%</p>

      {/* Example for one prayer */}
      <div className="prayer-row">
        <span>Fajr</span>
        {[1, 2, 3].map(num => (
          <button key={num} onClick={() => setSalah({...salah, fajr: num})}>
            {num === 1 ? 'Q' : num === 2 ? 'I' : 'J'}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tracker;