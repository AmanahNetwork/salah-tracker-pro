import React, { useState, useEffect, useCallback } from 'react';
import API from '../api/axios'; 
import { Moon, CheckCircle, Loader2, Activity, PieChart as PieIcon, BarChart3 } from 'lucide-react';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend 
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [history, setHistory] = useState([]);
  const [sleep, setSleep] = useState(7);
  const [prod, setProd] = useState(50);
  const [salah, setSalah] = useState({ fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 });
  const [viewMode, setViewMode] = useState('month');
  const [isSubmitting, setIsSubmitting] = useState(false); 

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

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const isAlreadyLogged = history.some(log => new Date(log.date).toISOString().split('T')[0] === today);

  const filteredHistory = history.filter(log => {
    const logDate = new Date(log.date);
    const offset = viewMode === 'week' ? 7 : viewMode === 'month' ? 30 : 365;
    const limit = new Date();
    limit.setDate(limit.getDate() - offset);
    return logDate >= limit;
  });

  // --- LOGIC FOR PERCENTAGE BARS ---
  const stats = (() => {
    if (filteredHistory.length === 0) return { sleep: "0", prod: "0", salah: "0" };
    
    // Salah %: Count any non-missed (1, 2, or 3) prayer
    const offered = filteredHistory.reduce((acc, log) => 
      acc + Object.values(log.salah || {}).filter(v => v > 0).length, 0);
    
    // Sleep %: (Total Hours / (Days * 24)) * 100
    const totalSleep = filteredHistory.reduce((acc, l) => acc + (l.sleepHours || 0), 0);
    const totalAvailableHours = filteredHistory.length * 24;
    
    // Productivity %: Direct average of logged values
    const avgProd = filteredHistory.reduce((acc, l) => acc + (l.productivityPercentage || 0), 0) / filteredHistory.length;

    return {
      salah: ((offered / (filteredHistory.length * 5)) * 100).toFixed(1),
      sleep: ((totalSleep / totalAvailableHours) * 100).toFixed(1),
      prod: avgProd.toFixed(1)
    };
  })();

  const handleSave = async () => {
    if (isSubmitting || isAlreadyLogged) return;
    setIsSubmitting(true);
    try {
      await API.post('/api/logs/daily', { 
        salah, 
        sleepHours: sleep, 
        productivityPercentage: prod, 
        date: today 
      });
      await fetchHistory();
    } catch (err) { console.error(err); } 
    finally { setIsSubmitting(false); }
  };

  const salahStats = () => {
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
  };

  const chartLabels = filteredHistory.map(l => new Date(l.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }));

  return (
    <div style={{ padding: '15px', maxWidth: '500px', margin: '0 auto', color: 'white', paddingBottom: '50px' }}>
      
      {/* 1. TOP PERCENTAGE BARS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: '10px' }}>
          <p style={{ fontSize: '0.6rem', color: '#94a3b8', margin: 0 }}>SALAH</p>
          <h3 style={{ color: '#10b981', margin: '5px 0' }}>{stats.salah}%</h3>
        </div>
        <div className="glass-card" style={{ textAlign: 'center', padding: '10px' }}>
          <p style={{ fontSize: '0.6rem', color: '#94a3b8', margin: 0 }}>DAY SLEPT</p>
          <h3 style={{ color: '#3b82f6', margin: '5px 0' }}>{stats.sleep}%</h3>
        </div>
        <div className="glass-card" style={{ textAlign: 'center', padding: '10px' }}>
          <p style={{ fontSize: '0.6rem', color: '#94a3b8', margin: 0 }}>PRODUCTIVE</p>
          <h3 style={{ color: '#f59e0b', margin: '5px 0' }}>{stats.prod}%</h3>
        </div>
      </div>

      {/* 2. DAILY INPUT */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
        {isAlreadyLogged ? (
          <div style={{ textAlign: 'center', color: '#10b981' }}><CheckCircle style={{ margin: '0 auto 5px' }} /><p>Daily Entry Synced</p></div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <p style={{ fontSize: '0.75rem', marginBottom: '5px' }}><Moon size={14}/> {sleep}h Sleep</p>
                <input type="range" min="0" max="24" step="0.5" value={sleep} onChange={(e) => setSleep(parseFloat(e.target.value))} style={{ width: '100%' }} />
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', marginBottom: '5px' }}><Activity size={14}/> {prod}% Prod</p>
                <input type="range" min="0" max="100" value={prod} onChange={(e) => setProd(parseInt(e.target.value))} style={{ width: '100%' }} />
              </div>
            </div>
            {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map(p => (
              <div key={p} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                <span style={{ textTransform: 'capitalize', fontSize: '0.8rem' }}>{p}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[0, 1, 2, 3].map(n => (
                    <button key={n} onClick={() => setSalah({ ...salah, [p]: n })}
                      style={{ 
                        padding: '4px 8px', fontSize: '0.65rem', borderRadius: '4px', border: 'none',
                        background: salah[p] === n ? (n === 0 ? '#ef4444' : '#10b981') : 'rgba(255,255,255,0.1)',
                        color: 'white', cursor: 'pointer'
                      }}>{n === 0 ? 'M' : n === 1 ? 'Q' : n === 2 ? 'I' : 'J'}</button>
                  ))}
                </div>
              </div>
            ))}
            <button className="submit-btn" disabled={isSubmitting} onClick={handleSave} style={{ width: '100%', marginTop: '10px', height: '40px' }}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Sync Today'}
            </button>
          </>
        )}
      </div>

      {/* 3. TIME FILTER */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '15px' }}>
        {['week', 'month', 'year'].map(m => (
          <button key={m} onClick={() => setViewMode(m)} style={{
            background: viewMode === m ? '#10b981' : 'transparent',
            border: '1px solid #10b981', color: 'white', padding: '4px 12px', borderRadius: '15px', fontSize: '0.7rem'
          }}>{m}</button>
        ))}
      </div>

      {/* 4. ANALYTICS GRAPHS */}
      <div className="glass-card" style={{ padding: '15px', marginBottom: '15px' }}>
        <h4 style={{ fontSize: '0.8rem', margin: '0 0 10px 0' }}><PieIcon size={14} /> Salah Distribution</h4>
        <Pie data={{
            labels: ['Jamat', 'Indiv', 'Qaza', 'Missed'],
            datasets: [{ data: salahStats(), backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'], borderWidth: 0 }]
          }} 
          options={{ plugins: { legend: { position: 'bottom', labels: { color: 'white', font: { size: 10 } } } } }} 
        />
      </div>

      <div className="glass-card" style={{ padding: '15px', marginBottom: '15px' }}>
        <h4 style={{ fontSize: '0.8rem', margin: '0 0 10px 0' }}><BarChart3 size={14} /> Sleep Trend (Hours)</h4>
        <Bar data={{
            labels: chartLabels,
            datasets: [{ label: 'Hrs', data: filteredHistory.map(l => l.sleepHours), backgroundColor: '#3b82f6' }]
          }} 
          options={{ scales: { y: { ticks: { color: 'white' } }, x: { ticks: { color: 'white' } } } }} 
        />
      </div>

      <div className="glass-card" style={{ padding: '15px' }}>
        <h4 style={{ fontSize: '0.8rem', margin: '0 0 10px 0' }}><Activity size={14} /> Productivity Trend (%)</h4>
        <Line data={{
            labels: chartLabels,
            datasets: [{ label: '%', data: filteredHistory.map(l => l.productivityPercentage), borderColor: '#f59e0b', tension: 0.3 }]
          }} 
          options={{ scales: { y: { ticks: { color: 'white' } }, x: { ticks: { color: 'white' } } } }} 
        />
      </div>

    </div>
  );
};

export default Dashboard;