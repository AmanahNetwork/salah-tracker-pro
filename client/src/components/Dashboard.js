import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Moon, Activity, BarChart3, PieChart as PieIcon, Save, Calendar } from 'lucide-react';
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
  
  // NEW: Success state for visual feedback
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

  const filteredHistory = history.filter(log => {
    const logDate = new Date(log.date);
    const now = new Date();
    if (viewMode === 'month') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return logDate >= thirtyDaysAgo;
    }
    return logDate.getFullYear() === now.getFullYear();
  });

  const getSalahStats = () => {
    let counts = { Jamat: 0, Individual: 0, Qaza: 0 };
    filteredHistory.forEach(log => {
      if (log.salah) {
        Object.values(log.salah).forEach(val => {
          if (val === 3) counts.Jamat++;
          else if (val === 2) counts.Individual++;
          else if (val === 1) counts.Qaza++;
        });
      }
    });
    return [counts.Jamat, counts.Individual, counts.Qaza];
  };

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
      
      // TRIGGER SUCCESS FEEDBACK
      setShowSuccess(true);
      fetchHistory();
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
      
    } catch (err) {
      alert("❌ Save failed. Token might be expired.");
    }
  };

  return (
    <div className="dashboard-container">
      
      {/* --- INPUT SECTION --- */}
      <div className="glass-card">
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
          <h4 style={{ marginBottom: '15px', color: '#94a3b8' }}>Salah Log (Q:1, I:2, J:3)</h4>
          {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => (
            <div key={p} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
              <span style={{textTransform:'capitalize', fontWeight: '500'}}>{p}</span>
              <div style={{display:'flex', gap:'8px'}}>
                {[1, 2, 3].map(n => (
                  <button 
                    key={n} 
                    onClick={() => setSalah({...salah, [p]: n})} 
                    style={{
                      background: salah[p] === n ? '#10b981' : 'rgba(255,255,255,0.05)', 
                      border:'1px solid rgba(255,255,255,0.1)', 
                      color:'white', 
                      borderRadius:'8px', 
                      padding:'6px 14px',
                      cursor: 'pointer'
                    }}>
                    {n===1?'Q':n===2?'I':'J'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* SUCCESS MESSAGE UI */}
        <div style={{ minHeight: '30px', marginTop: '15px' }}>
          {showSuccess && (
            <p style={{ color: '#10b981', textAlign: 'center', marginBottom: '10px', fontWeight: 'bold' }}>
              ✨ Progress synced to your account!
            </p>
          )}
        </div>

        <button className="submit-btn" onClick={saveDailyData} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
          <Save size={18} /> Save Progress
        </button>
      </div>

      {/* --- CHART CONTROLS --- */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', width: '100%', maxWidth: '1200px' }}>
        <button 
          onClick={() => setViewMode('month')}
          style={{ 
            flex: 1,
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
            background: viewMode === 'month' ? '#10b981' : 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            color: 'white', padding: '12px', borderRadius: '10px', cursor: 'pointer', transition: '0.3s' 
          }}
        >
          <Calendar size={16} /> Monthly View
        </button>
        <button 
          onClick={() => setViewMode('year')}
          style={{ 
            flex: 1,
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
            background: viewMode === 'year' ? '#10b981' : 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            color: 'white', padding: '12px', borderRadius: '10px', cursor: 'pointer', transition: '0.3s' 
          }}
        >
          <Activity size={16} /> Yearly View
        </button>
      </div>

      {/* --- VISUALIZATION SECTION --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', width: '100%', maxWidth: '1200px' }}>
        
        <div className="glass-card">
          <h3><PieIcon size={18} /> Salah Distribution</h3>
          <Pie 
            data={{
              labels: ['Jamat', 'Individual', 'Qaza'],
              datasets: [{
                data: getSalahStats(),
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
                borderColor: 'transparent'
              }]
            }}
            options={{ plugins: { legend: { position: 'bottom', labels: { color: 'white', padding: 20 } } } }}
          />
        </div>

        <div className="glass-card">
          <h3><Activity size={18} /> {viewMode === 'month' ? 'Monthly' : 'Yearly'} Productivity</h3>
          <Line 
            data={{
              labels: filteredHistory.map(log => log.date),
              datasets: [{
                label: 'Productivity %',
                data: filteredHistory.map(log => log.productivityPercentage),
                borderColor: '#f59e0b',
                tension: 0.4,
                pointRadius: 4,
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: true
              }]
            }}
            options={{ 
              scales: { 
                y: { min: 0, max: 100, ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.05)' } }, 
                x: { ticks: { color: 'white' }, grid: { display: false } } 
              },
              plugins: { legend: { display: false } }
            }}
          />
        </div>

        <div className="glass-card">
          <h3><Moon size={18} /> {viewMode === 'month' ? 'Monthly' : 'Yearly'} Sleep</h3>
          <Bar 
            data={{
              labels: filteredHistory.map(log => log.date),
              datasets: [{
                label: 'Hours',
                data: filteredHistory.map(log => log.sleepHours),
                backgroundColor: '#3b82f6',
                borderRadius: 6
              }]
            }}
            options={{ 
              scales: { 
                y: { min: 0, max: 12, ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.05)' } }, 
                x: { ticks: { color: 'white' }, grid: { display: false } } 
              },
              plugins: { legend: { display: false } }
            }}
          />
        </div>

      </div>
    </div>
  );
};

export default Dashboard;