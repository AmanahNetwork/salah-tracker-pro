import React, { useState, useEffect } from 'react';
import API from '../api/axios'; 
import { Moon, Activity, BarChart3, PieChart as PieIcon, Save, Clock, CheckCircle } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState('month');
  const [showSuccess, setShowSuccess] = useState(false);
  const username = localStorage.getItem('username') || 'User';

  const modes = ['week', 'month', 'year'];

  const fetchHistory = async () => {
    try {
      const res = await API.get('/api/logs/all');
      setHistory(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.reload();
      }
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

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

  const getChartLabels = () => {
    return filteredHistory.map(log => {
      const d = new Date(log.date);
      return viewMode === 'year' 
        ? d.toLocaleDateString('en-US', { month: 'short' }) 
        : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    });
  };

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

  const getSliderPointStyle = (mode) => ({
    width: '20px', height: '20px', borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.4)', cursor: 'pointer',
    background: viewMode === mode ? '#10b981' : 'transparent',
    transition: '0.3s ease', boxShadow: viewMode === mode ? '0 0 12px #10b981' : 'none',
  });

  return (
    <div className="dashboard-container">
      {/* TOP HEADER - FIXED POSITIONING */}
      <div className="top-header-slot">
        <img src="/logo.png" alt="Logo" className="header-logo" />
        <div className="user-controls">
          <p style={{ margin: 0 }}>Welcome, <span style={{ color: '#10b981', fontWeight: 'bold' }}>{username}</span></p>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      {showSuccess && (
        <div className="success-toast">
          <CheckCircle size={20} /> <span>Progress Saved!</span>
        </div>
      )}

      {/* INPUT CARD */}
      <div className="glass-card">
        <h2>Daily Check-in</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <div>
            <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Moon size={18} color="#3b82f6" /> Sleep: **{sleep}h**</p>
            <input type="range" min="0" max="24" step="0.5" value={sleep} onChange={(e) => setSleep(parseFloat(e.target.value))} style={{width:'100%'}}/>
          </div>
          <div>
            <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={18} color="#f59e0b" /> Productivity: **{manualProductivity}%**</p>
            <input type="range" min="0" max="100" value={manualProductivity} onChange={(e) => setManualProductivity(parseInt(e.target.value))} style={{width:'100%'}}/>
          </div>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <h4 style={{ marginBottom: '15px', color: '#94a3b8' }}>Salah Log</h4>
          {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => (
            <div key={p} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
              <span style={{textTransform:'capitalize'}}>{p}</span>
              <div style={{display:'flex', gap:'6px'}}>
                {[0, 1, 2, 3].map(n => (
                  <button 
                    key={n} 
                    onClick={() => setSalah({...salah, [p]: n})} 
                    className="salah-btn"
                    style={{ background: salah[p] === n ? (n === 0 ? '#64748b' : '#10b981') : 'rgba(255,255,255,0.05)' }}>
                    {n===0?'M':n===1?'Q':n===2?'I':'J'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button className="submit-btn" onClick={() => setShowSuccess(true)} style={{ marginTop: '15px' }}><Save size={18} /> Save Progress</button>
      </div>

      {/* VIEW SELECTOR & SUMMARY */}
      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', marginBottom: '10px' }}>Select View</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontWeight: 'bold', marginBottom: '10px' }}>
            {modes.map(m => <span key={m} style={{ color: viewMode === m ? '#10b981' : 'rgba(255,255,255,0.4)' }}>{m}</span>)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={getSliderPointStyle('week')} onClick={() => setViewMode('week')}></div>
            <div style={{ width: '40px', height: '2px', background: 'rgba(255,255,255,0.1)' }}></div>
            <div style={getSliderPointStyle('month')} onClick={() => setViewMode('month')}></div>
            <div style={{ width: '40px', height: '2px', background: 'rgba(255,255,255,0.1)' }}></div>
            <div style={getSliderPointStyle('year')} onClick={() => setViewMode('year')}></div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
          <Clock size={24} color="#3b82f6" />
          <div style={{ textAlign: 'left' }}>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.8rem' }}>Total Sleep ({viewMode})</p>
            <h2 style={{ margin: 0 }}>{totalSleepInView.toFixed(1)}h</h2>
          </div>
        </div>
      </div>

      {/* CHARTS GRID - THIS FIXES THE OVERFLOW */}
      <div className="charts-grid">
        <div className="glass-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}><PieIcon size={16} /> Salah</h3>
          <Pie 
            data={{
              labels: ['J', 'I', 'Q', 'M'],
              datasets: [{ data: getSalahStats(), backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#64748b'], borderColor: 'transparent' }]
            }}
            options={{ maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { color: 'white', font: { size: 10 } } } } }}
          />
        </div>

        <div className="glass-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}><BarChart3 size={16} color="#3b82f6" /> Sleep</h3>
          <Bar 
            data={{
              labels: getChartLabels(),
              datasets: [{ label: 'Hrs', data: filteredHistory.map(l => l.sleepHours), backgroundColor: '#3b82f6' }]
            }}
            options={{ responsive: true, scales: { y: { ticks: { color: 'white', font: { size: 9 } } }, x: { ticks: { color: 'white', font: { size: 9 } } } } }}
          />
        </div>

        <div className="glass-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}><Activity size={16} color="#f59e0b" /> Productivity</h3>
          <Line 
            data={{
              labels: getChartLabels(),
              datasets: [{ label: '%', data: filteredHistory.map(l => l.productivityPercentage), borderColor: '#f59e0b', fill: true, backgroundColor: 'rgba(245, 158, 11, 0.1)' }]
            }}
            options={{ responsive: true, scales: { y: { ticks: { color: 'white', font: { size: 9 } } }, x: { ticks: { color: 'white', font: { size: 9 } } } } }}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;