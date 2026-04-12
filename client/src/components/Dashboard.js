import React, { useState, useEffect, useCallback } from 'react';
import API from '../api/axios'; 
import { Moon, Activity, BarChart3, PieChart as PieIcon, Save, CheckCircle } from 'lucide-react';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, ArcElement, Title, Tooltip, Legend 
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [history, setHistory] = useState([]);
  const [sleep, setSleep] = useState(7);
  const [manualProductivity, setManualProductivity] = useState(50);
  const [salah, setSalah] = useState({ fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 });
  const [viewMode, setViewMode] = useState('month');
  const [showSuccess, setShowSuccess] = useState(false);
  
  const username = localStorage.getItem('username') || 'User';
  const today = new Date().toISOString().split('T')[0];

  const fetchHistory = useCallback(async () => {
    try {
      const res = await API.get('/api/logs/all');
      setHistory(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.reload();
      }
    }
  }, []);

  useEffect(() => { 
    fetchHistory(); 
  }, [fetchHistory]);

  const isAlreadyLogged = history.some(log => new Date(log.date).toISOString().split('T')[0] === today);

  // Filters history based on active viewMode
  const filteredHistory = history.filter(log => {
    const logDate = new Date(log.date);
    const offset = viewMode === 'week' ? 7 : viewMode === 'month' ? 30 : 365;
    const limit = new Date();
    limit.setDate(limit.getDate() - offset);
    return logDate >= limit;
  });

  // Calculate percentages for the top summary cards
  const stats = (() => {
    if (filteredHistory.length === 0) return { sleep: "0", prod: "0", salah: "0" };
    
    const totalSalahPossible = filteredHistory.length * 5;
    const offeredCount = filteredHistory.reduce((acc, log) => 
      acc + Object.values(log.salah || {}).filter(v => v > 0).length, 0);
    
    const avgSleep = filteredHistory.reduce((acc, l) => acc + (l.sleepHours || 0), 0) / filteredHistory.length;
    const avgProd = filteredHistory.reduce((acc, l) => acc + (l.productivityPercentage || 0), 0) / filteredHistory.length;

    return {
      salah: ((offeredCount / totalSalahPossible) * 100).toFixed(1),
      sleep: ((avgSleep / 24) * 100).toFixed(1),
      prod: avgProd.toFixed(1)
    };
  })();

  const saveDailyData = async () => {
    try {
      await API.post('/api/logs/daily', { salah, sleepHours: sleep, productivityPercentage: manualProductivity, date: today });
      setShowSuccess(true);
      fetchHistory();
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Save error", err);
    }
  };

  const chartLabels = filteredHistory.map(log => {
    const d = new Date(log.date);
    return viewMode === 'year' ? d.toLocaleDateString('en-US', { month: 'short' }) : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  });

  const salahStats = (() => {
    let counts = { Jamat: 0, Individual: 0, Qaza: 0, Missed: 0 };
    filteredHistory.forEach(log => {
      Object.values(log.salah || {}).forEach(val => {
        if (val === 3) counts.Jamat++;
        else if (val === 2) counts.Individual++;
        else if (val === 1) counts.Qaza++;
        else counts.Missed++;
      });
    });
    return [counts.Jamat, counts.Individual, counts.Qaza, counts.Missed];
  })();

  return (
    <div className="dashboard-container">
      <div className="top-header-slot">
        <img src="/logo.png" alt="Logo" className="header-logo" />
        <div className="user-controls">
          <p>Welcome, <span style={{ color: '#10b981', fontWeight: 'bold' }}>{username}</span></p>
          <button onClick={() => { localStorage.removeItem('token'); window.location.reload(); }} className="logout-btn">Logout</button>
        </div>
      </div>

      {showSuccess && <div className="success-toast"><CheckCircle size={20} /> <span>Progress Saved!</span></div>}

      <div className="glass-card">
        <h2>Daily Check-in</h2>
        {isAlreadyLogged ? (
          <div style={{ textAlign: 'center', color: '#10b981' }}><CheckCircle size={24} /><p>Today's Entry Completed</p></div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <p style={{ fontSize: '0.85rem' }}><Moon size={14} color="#3b82f6" /> Sleep: **{sleep}h**</p>
                <input type="range" min="0" max="24" step="0.5" value={sleep} onChange={(e) => setSleep(parseFloat(e.target.value))} style={{width:'100%'}}/>
              </div>
              <div>
                <p style={{ fontSize: '0.85rem' }}><Activity size={14} color="#f59e0b" /> Prod: **{manualProductivity}%**</p>
                <input type="range" min="0" max="100" value={manualProductivity} onChange={(e) => setManualProductivity(parseInt(e.target.value))} style={{width:'100%'}}/>
              </div>
            </div>
            <div style={{ marginTop: '15px' }}>
              {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map(p => (
                <div key={p} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ textTransform: 'capitalize', fontSize: '0.9rem' }}>{p}</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[0, 1, 2, 3].map(n => (
                      <button key={n} onClick={() => setSalah({...salah, [p]: n})} className="salah-btn"
                        style={{ background: salah[p] === n ? (n === 0 ? '#64748b' : '#10b981') : 'rgba(255,255,255,0.05)' }}>
                        {n===0?'M':n===1?'Q':n===2?'I':'J'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button className="submit-btn" style={{ marginTop: '10px' }} onClick={saveDailyData}><Save size={18} /> Save Progress</button>
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '15px' }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: '10px' }}>
          <p style={{ fontSize: '0.6rem', color: '#94a3b8' }}>SALAH</p>
          <h3 style={{ color: '#10b981', margin: 0 }}>{stats.salah}%</h3>
        </div>
        <div className="glass-card" style={{ textAlign: 'center', padding: '10px' }}>
          <p style={{ fontSize: '0.6rem', color: '#94a3b8' }}>SLEEP</p>
          <h3 style={{ color: '#3b82f6', margin: 0 }}>{stats.sleep}%</h3>
        </div>
        <div className="glass-card" style={{ textAlign: 'center', padding: '10px' }}>
          <p style={{ fontSize: '0.6rem', color: '#94a3b8' }}>PROD</p>
          <h3 style={{ color: '#f59e0b', margin: 0 }}>{stats.prod}%</h3>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', margin: '15px 0' }}>
        {['week', 'month', 'year'].map(m => (
          <button key={m} onClick={() => setViewMode(m)} style={{ 
            background: viewMode === m ? '#10b981' : 'transparent',
            border: '1px solid #10b981', color: 'white', padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem'
          }}>{m}</button>
        ))}
      </div>

      <div className="charts-grid">
        <div className="glass-card">
          <h3 style={{ fontSize: '0.85rem' }}><PieIcon size={14} /> Salah Distribution</h3>
          <Pie data={{
            labels: ['Jamat', 'Indiv', 'Qaza', 'Missed'],
            datasets: [{ data: salahStats, backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'], borderColor: 'transparent' }]
          }} options={{ plugins: { legend: { position: 'bottom', labels: { color: 'white', font: { size: 9 } } } } }} />
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: '0.85rem' }}><BarChart3 size={14} /> Sleep Trend</h3>
          <Bar data={{
            labels: chartLabels,
            datasets: [{ label: 'Hrs', data: filteredHistory.map(l => l.sleepHours), backgroundColor: '#3b82f6' }]
          }} options={{ scales: { y: { ticks: { color: 'white', font: { size: 8 } } }, x: { ticks: { color: 'white', font: { size: 8 } } } } }} />
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: '0.85rem' }}><Activity size={14} /> Productivity</h3>
          <Line data={{
            labels: chartLabels,
            datasets: [{ label: '%', data: filteredHistory.map(l => l.productivityPercentage), borderColor: '#f59e0b', tension: 0.4 }]
          }} options={{ scales: { y: { ticks: { color: 'white', font: { size: 8 } } }, x: { ticks: { color: 'white', font: { size: 8 } } } } }} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;