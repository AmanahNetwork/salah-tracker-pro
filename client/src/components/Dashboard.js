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

  const saveDailyData = async () => {
    try {
      await API.post('/api/logs/daily', {
        salah,
        sleepHours: sleep,
        productivityPercentage: manualProductivity,
        date: new Date().toISOString().split('T')[0]
      });
      setShowSuccess(true);
      fetchHistory();
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      alert("❌ Save failed. Check your connection.");
    }
  };

  const getSliderPointStyle = (mode) => ({
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.4)',
    cursor: 'pointer',
    background: viewMode === mode ? '#10b981' : 'transparent',
    transition: '0.3s ease',
    boxShadow: viewMode === mode ? '0 0 12px #10b981' : 'none',
  });

  return (
    <div className="dashboard-container">
      
      {/* SUCCESS NOTIFICATION */}
      {showSuccess && (
        <div className="success-toast" style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#10b981', padding: '12px 24px', borderRadius: '12px',
          display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
        }}>
          <CheckCircle size={20} />
          <span style={{ fontWeight: 'bold' }}>Progress Saved!</span>
        </div>
      )}

      {/* INPUT CARD */}
      <div className="glass-card">
        <h2 style={{ marginBottom: '20px' }}>Daily Check-in</h2>
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
        
        <div style={{ marginTop: '25px' }}>
          <h4 style={{ marginBottom: '15px', color: '#94a3b8' }}>Salah Log</h4>
          {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => (
            <div key={p} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
              <span style={{textTransform:'capitalize', fontWeight: '500'}}>{p}</span>
              <div style={{display:'flex', gap:'6px'}}>
                {[0, 1, 2, 3].map(n => (
                  <button 
                    key={n} 
                    onClick={() => setSalah({...salah, [p]: n})} 
                    className="salah-btn"
                    style={{
                      background: salah[p] === n ? (n === 0 ? '#64748b' : '#10b981') : 'rgba(255,255,255,0.05)', 
                      border:'1px solid rgba(255,255,255,0.1)', color:'white', borderRadius:'8px', padding:'8px 12px', cursor: 'pointer',
                      transition: '0.2s ease'
                    }}>
                    {n===0?'M':n===1?'Q':n===2?'I':'J'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <button className="submit-btn" onClick={saveDailyData} style={{ marginTop: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Save size={18} /> Save Progress
        </button>
      </div>

      {/* VIEW SELECTOR */}
      <div className="glass-card" style={{ textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#94a3b8' }}>Select View</h4>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '25px', textTransform: 'capitalize', fontWeight: 'bold', marginBottom: '15px' }}>
          {modes.map(mode => (
            <span key={mode} style={{ color: viewMode === mode ? '#10b981' : 'rgba(255,255,255,0.5)', transition: 'color 0.3s' }}>{mode}</span>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={getSliderPointStyle('week')} onClick={() => setViewMode('week')}></div>
          <div style={{ width: '50px', height: '2px', background: 'rgba(255,255,255,0.1)' }}></div>
          <div style={getSliderPointStyle('month')} onClick={() => setViewMode('month')}></div>
          <div style={{ width: '50px', height: '2px', background: 'rgba(255,255,255,0.1)' }}></div>
          <div style={getSliderPointStyle('year')} onClick={() => setViewMode('year')}></div>
        </div>
      </div>

      {/* STATS SUMMARY */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
        <Clock size={24} color="#3b82f6" />
        <div style={{ textAlign: 'left' }}>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>Total Sleep Logged ({viewMode})</p>
          <h2 style={{ margin: 0 }}>{totalSleepInView.toFixed(1)} Hours</h2>
        </div>
      </div>

      {/* CHARTS GRID SECTION */}
      <div className="charts-grid">
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <PieIcon size={18} /> Salah Distribution
          </h3>
          <Pie 
            data={{
              labels: ['Jamat', 'Individual', 'Qaza', 'Missed'],
              datasets: [{
                data: getSalahStats(),
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#64748b'],
                borderColor: 'transparent'
              }]
            }}
            options={{ 
              responsive: true, 
              maintainAspectRatio: true,
              plugins: { legend: { position: 'bottom', labels: { color: 'white', font: { size: 10 } } } } 
            }}
          />
        </div>

        <div className="glass-card">
          <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="#3b82f6" /> Sleep Trends
          </h3>
          <Bar 
            key={`sleep-${viewMode}`}
            data={{
              labels: getChartLabels(),
              datasets: [{
                label: 'Hours',
                data: filteredHistory.map(log => log.sleepHours),
                backgroundColor: '#3b82f6',
                borderRadius: 4
              }]
            }}
            options={{ 
              responsive: true,
              scales: { 
                y: { min: 0, max: 24, ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 10 } } },
                x: { ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 10 } } }
              }
            }}
          />
        </div>

        <div className="glass-card">
          <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="#f59e0b" /> Productivity %
          </h3>
          <Line
            key={`prod-${viewMode}`}
            data={{
              labels: getChartLabels(),
              datasets: [{
                label: 'Productivity',
                data: filteredHistory.map(log => log.productivityPercentage),
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                tension: 0.4,
                fill: true,
              }]
            }}
            options={{ 
              responsive: true,
              scales: { 
                y: { min: 0, max: 100, ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 10 } } },
                x: { ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 10 } } }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;