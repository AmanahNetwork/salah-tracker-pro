import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Moon, Activity, BarChart3, PieChart as PieIcon, Save, Clock, ChevronRight } from 'lucide-react';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, ArcElement, Title, Tooltip, Legend
);

const Dashboard = () => {
  const [history, setHistory] = useState([]);
  const [sleep, setSleep] = useState(7);
  const [manualProductivity, setManualProductivity] = useState(50);
  const [salah, setSalah] = useState({ fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 });
  const [viewMode, setViewMode] = useState('month'); // Changed default to 'month' as in your image
  const [showSuccess, setShowSuccess] = useState(false);

  // View modes for the slider
  const modes = ['week', 'month', 'year'];

  const fetchHistory = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('/api/logs/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setHistory(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.removeItem('token');
        window.location.reload();
      }
      console.error("Fetch error", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = history.filter(log => {
    const logDate = new Date(log.date);
    const now = new Date();
    if (viewMode === 'week') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return logDate >= sevenDaysAgo;
    }
    if (viewMode === 'month') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return logDate >= thirtyDaysAgo;
    }
    return logDate.getFullYear() === now.getFullYear();
  });

  const getSalahStats = () => {
    let counts = { Jamat: 0, Individual: 0, Qaza: 0, Missed: 0 };
    filteredHistory.forEach(log => {
      if (log.salah) {
        Object.values(log.salah).forEach(val => {
          if (val === 3) counts.Jamat++;
          else if (val === 2) counts.Individual++;
          else if (val === 1) counts.Qaza++;
          else if (val === 0) counts.Missed++;
        });
      }
    });
    return [counts.Jamat, counts.Individual, counts.Qaza, counts.Missed];
  };

  const totalSleepInView = filteredHistory.reduce((acc, log) => acc + (log.sleepHours || 0), 0);

  const saveDailyData = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.post('/api/logs/daily', {
        salah,
        sleepHours: sleep,
        productivityPercentage: manualProductivity,
        date: new Date().toISOString().split('T')[0]
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setShowSuccess(true);
      fetchHistory();
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      alert("❌ Save failed. Token might be expired.");
    }
  };

  // Inline styling for the "3-point slider"
  const getSliderPointStyle = (mode) => ({
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.4)',
    cursor: 'pointer',
    background: viewMode === mode ? '#10b981' : 'transparent', // Highlight selected mode
    transition: '0.3s ease',
    boxShadow: viewMode === mode ? '0 0 10px #10b981' : 'none',
  });

  return (
    <div className="dashboard-container" style={{ padding: '20px', color: 'white', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* --- INPUT SECTION (Remains on top) --- */}
      <div className="glass-card" style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '20px' }}>Daily Check-in</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px' }}>
          <div>
            <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Moon size={18} color="#3b82f6" /> Sleep: **{sleep}h**</p>
            <input type="range" min="0" max="12" step="0.5" value={sleep} onChange={(e) => setSleep(parseFloat(e.target.value))} style={{width:'100%'}}/>
          </div>
          <div>
            <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><BarChart3 size={18} color="#f59e0b" /> Productivity: **{manualProductivity}%**</p>
            <input type="range" min="0" max="100" value={manualProductivity} onChange={(e) => setManualProductivity(parseInt(e.target.value))} style={{width:'100%'}}/>
          </div>
        </div>
        
        <div style={{ marginTop: '25px' }}>
          <h4 style={{ marginBottom: '15px', color: '#94a3b8' }}>Salah Log</h4>
          {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => (
            <div key={p} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
              <span style={{textTransform:'capitalize', fontWeight: '500'}}>{p}</span>
              <div style={{display:'flex', gap:'8px'}}>
                {[0, 1, 2, 3].map(n => (
                  <button 
                    key={n} 
                    onClick={() => setSalah({...salah, [p]: n})} 
                    style={{
                      background: salah[p] === n ? (n === 0 ? '#64748b' : '#10b981') : 'rgba(255,255,255,0.05)', 
                      border:'1px solid rgba(255,255,255,0.1)', color:'white', borderRadius:'8px', padding:'6px 14px', cursor: 'pointer'
                    }}>
                    {n===0?'M':n===1?'Q':n===2?'I':'J'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <button className="submit-btn" onClick={saveDailyData} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '15px' }}>
          <Save size={18} /> Save Progress
        </button>
      </div>

      {/* --- NEW 3-POINT SLIDER UI --- */}
      <div className="glass-card" style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#94a3b8' }}>Select View</h4>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', textTransform: 'capitalize', fontWeight: 'bold' }}>
          {modes.map(mode => (
            <span key={mode} style={{ color: viewMode === mode ? '#10b981' : 'rgba(255,255,255,0.6)' }}>{mode}</span>
          ))}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0px', marginTop: '10px' }}>
          {/* Week Point */}
          <div style={getSliderPointStyle('week')} onClick={() => setViewMode('week')} title="Weekly View"></div>
          {/* Connectors */}
          <div style={{ width: '60px', height: '2px', background: 'rgba(255,255,255,0.1)' }}></div>
          {/* Month Point */}
          <div style={getSliderPointStyle('month')} onClick={() => setViewMode('month')} title="Monthly View"></div>
          {/* Connectors */}
          <div style={{ width: '60px', height: '2px', background: 'rgba(255,255,255,0.1)' }}></div>
          {/* Year Point */}
          <div style={getSliderPointStyle('year')} onClick={() => setViewMode('year')} title="Yearly View"></div>
        </div>
      </div>

      {/* --- STATS SUMMARY (Sleep Card) --- */}
      <div className="glass-card" style={{ marginBottom: '20px', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
        <Clock size={24} color="#3b82f6" />
        <div>
          <p style={{ color: '#94a3b8', margin: 0 }}>Total Sleep Logged ({viewMode})</p>
          <h2 style={{ margin: 0 }}>{totalSleepInView.toFixed(1)} Hours</h2>
        </div>
      </div>

      {/* --- NEW VERTICAL STACK LAYOUT --- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* 1. PIE CHART */}
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <h3><PieIcon size={18} /> Salah Distribution ({viewMode})</h3>
          <Pie 
            data={{
              labels: ['Jamat', 'Individual', 'Qaza', 'Missed'],
              datasets: [{
                data: getSalahStats(),
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#64748b'], // Grey for Missed
                borderColor: 'transparent'
              }]
            }}
            options={{ plugins: { legend: { position: 'bottom', labels: { color: 'white' } } } }}
          />
        </div>

        {/* 2. SLEEP HOURS (Bar) */}
        <div className="glass-card">
          <h3><Moon size={18} /> Sleep Hours</h3>
          <Bar 
          key={`sleep-${viewMode}`}
            data={{
              labels: filteredHistory.map(log => log.date),
              datasets: [{
                label: 'Hours',
                data: filteredHistory.map(log => log.sleepHours),
                backgroundColor: '#3b82f6',
                borderRadius: 5
              }]
            }}
            options={{ scales: { y: { min: 0, max: 12, ticks: { color: 'white' } }, x: { ticks: { color: 'white' } } } }}
          />
        </div>

        {/* 3. PRODUCTIVITY % (Line) */}
        <div className="glass-card">
          <h3><Activity size={18} /> Productivity %</h3>
          <Line
            key={`prod-${viewMode}`} 
            data={{
              labels: filteredHistory.map(log => log.date),
              datasets: [{
                label: 'Productivity',
                data: filteredHistory.map(log => log.productivityPercentage),
                borderColor: '#f59e0b',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
              }]
            }}
            options={{ scales: { y: { min: 0, max: 100, ticks: { color: 'white' } }, x: { ticks: { color: 'white' } } } }}
          />
        </div>

      </div>
    </div>
  );
};

export default Dashboard;