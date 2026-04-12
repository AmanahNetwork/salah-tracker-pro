import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Moon, Activity, BarChart3, PieChart as PieIcon, Save, Calendar, Clock } from 'lucide-react';
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

  // Updated Filter Logic: Added 'week'
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

  // Updated Stats Logic: Added 'Missed'
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

  // Calculate Total Sleep for the selected view
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
      alert("❌ Save failed. Check your connection or login again.");
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: '20px', color: 'white' }}>
      
      {/* --- INPUT SECTION --- */}
      <div className="glass-card">
        <h2 style={{ marginBottom: '20px' }}>Daily Check-in</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px' }}>
          <div>
            <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Moon size={18} color="#3b82f6" /> Sleep: **{sleep}h**</p>
            {/* Range updated to 24 hours */}
            <input type="range" min="0" max="24" step="0.5" value={sleep} onChange={(e) => setSleep(parseFloat(e.target.value))} style={{width:'100%'}}/>
          </div>
          <div>
            <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><BarChart3 size={18} color="#f59e0b" /> Productivity: **{manualProductivity}%**</p>
            <input type="range" min="0" max="100" value={manualProductivity} onChange={(e) => setManualProductivity(parseInt(e.target.value))} style={{width:'100%'}}/>
          </div>
        </div>
        
        <div style={{ marginTop: '25px' }}>
          <h4 style={{ marginBottom: '15px', color: '#94a3b8' }}>Salah Log (M:0, Q:1, I:2, J:3)</h4>
          {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => (
            <div key={p} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
              <span style={{textTransform:'capitalize', fontWeight: '500'}}>{p}</span>
              <div style={{display:'flex', gap:'8px'}}>
                {/* Updated to include '0' for Missed */}
                {[0, 1, 2, 3].map(n => (
                  <button 
                    key={n} 
                    onClick={() => setSalah({...salah, [p]: n})} 
                    style={{
                      background: salah[p] === n ? (n === 0 ? '#64748b' : '#10b981') : 'rgba(255,255,255,0.05)', 
                      border:'1px solid rgba(255,255,255,0.1)', 
                      color:'white', 
                      borderRadius:'8px', 
                      padding:'6px 14px',
                      cursor: 'pointer',
                      transition: '0.2s'
                    }}>
                    {n===0?'M':n===1?'Q':n===2?'I':'J'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ minHeight: '30px', marginTop: '15px' }}>
          {showSuccess && <p style={{ color: '#10b981', textAlign: 'center', fontWeight: 'bold' }}>✨ Progress synced!</p>}
        </div>

        <button className="submit-btn" onClick={saveDailyData} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', width: '100%', padding: '12px', borderRadius: '10px', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer' }}>
          <Save size={18} /> Save Progress
        </button>
      </div>

      {/* --- VIEW TOGGLES --- */}
      <div style={{ display: 'flex', gap: '10px', margin: '20px 0', width: '100%', maxWidth: '1200px' }}>
        {['week', 'month', 'year'].map((mode) => (
          <button 
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{ 
              flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer',
              background: viewMode === mode ? '#10b981' : 'rgba(255,255,255,0.05)', 
              color: 'white', border: '1px solid rgba(255,255,255,0.1)', textTransform: 'capitalize'
            }}
          >
            {mode} View
          </button>
        ))}
      </div>

      {/* --- STATS SUMMARY --- */}
      <div className="glass-card" style={{ marginBottom: '20px', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
        <Clock size={24} color="#3b82f6" />
        <div>
          <p style={{ color: '#94a3b8', margin: 0 }}>Total Sleep Logged ({viewMode})</p>
          <h2 style={{ margin: 0 }}>{totalSleepInView.toFixed(1)} Hours</h2>
        </div>
      </div>

      {/* --- CHARTS --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', width: '100%', maxWidth: '1200px' }}>
        
        <div className="glass-card">
          <h3><PieIcon size={18} /> Salah Distribution</h3>
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

        <div className="glass-card">
          <h3><Activity size={18} /> Productivity %</h3>
          <Line 
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

        <div className="glass-card">
          <h3><Moon size={18} /> Sleep Hours</h3>
          <Bar 
            data={{
              labels: filteredHistory.map(log => log.date),
              datasets: [{
                label: 'Hours',
                data: filteredHistory.map(log => log.sleepHours),
                backgroundColor: '#3b82f6',
                borderRadius: 5
              }]
            }}
            options={{ scales: { y: { min: 0, max: 24, ticks: { color: 'white' } }, x: { ticks: { color: 'white' } } } }}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;