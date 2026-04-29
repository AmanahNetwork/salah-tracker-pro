import React, { useState, useEffect, useCallback } from 'react';
import API from '../api/axios.js'; 
import { CheckCircle, Loader2, Activity, PieChart as PieIcon, BarChart3 } from 'lucide-react';
import Picker from 'react-mobile-picker';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend 
} from 'chart.js';
import { calculateDuration } from '../utils/timeHelpers'; 
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [history, setHistory] = useState([]);
// Replace const [sleep, setSleep] = useState(7);
const [bedtime, setBedtime] = useState({ hour: '11', minute: '00', ampm: 'PM' });
const [waketime, setWaketime] = useState({ hour: '07', minute: '00', ampm: 'AM' });

const selections = {
  hour: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
  minute: ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'],
  ampm: ['AM', 'PM'],
};
  const [prod, setProd] = useState(50);
  const [salah, setSalah] = useState({ fajr: 'Missed', dhuhr: 'Missed', asr: 'Missed', maghrib: 'Missed', isha: 'Missed' });
  const [viewMode, setViewMode] = useState('month');
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const today = new Date().toISOString().split('T')[0];

  const fetchHistory = useCallback(async () => {
    try {
      const res = await API.get('/logs/all');
      setHistory(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.reload();
      }
    }
  }, []);
const [anchorDate, setAnchorDate] = useState(null);

useEffect(() => {
  const getAnchor = async () => {
    try {
      const res = await API.get('/logs/anchor-date');
      setAnchorDate(res.data.anchorDate);
    } catch (err) { console.error("Anchor fetch failed"); }
  };
  getAnchor();
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

  const allStats = (() => {
    if (filteredHistory.length === 0) return { sleep: "0", prod: "0", efficiency: "0", counts: [0,0,0,0], volume: 0, goal: 0 };

    // --- SALAH WEIGHTED LOGIC ---
    const counts = { Jamat: 0, Individual: 0, Qaza: 0, Missed: 0 };
    let earnedPoints = 0;
    let recordedPrayers = 0;

    filteredHistory.forEach(log => {
      Object.values(log.salah || {}).forEach(val => {
        recordedPrayers++;
        if (val === 3) { counts.Jamat++; earnedPoints += 3; }
        else if (val === 2) { counts.Individual++; earnedPoints += 2; }
        else if (val === 1) { counts.Qaza++; earnedPoints += 1; }
        else counts.Missed++;
      });
    });

    const now = new Date();
    const rangeStart = new Date();
    if (viewMode === 'week') rangeStart.setDate(now.getDate() - now.getDay() + 1);
    else if (viewMode === 'month') rangeStart.setDate(1);
    else rangeStart.setMonth(0, 1);

    const effectiveStart = anchorDate && new Date(anchorDate) > rangeStart ? new Date(anchorDate) : rangeStart;
    const daysInView = Math.ceil(Math.abs(new Date(today) - effectiveStart) / (1000 * 60 * 60 * 24)) + 1;
    
    const totalExpected = daysInView * 5;
    const gap = totalExpected - recordedPrayers;
    if (gap > 0) counts.Missed += gap;

    const maxPossiblePoints = daysInView * 15;

    // --- SLEEP & PROD LOGIC ---
    const totalSleep = filteredHistory.reduce((acc, l) => acc + (l.sleepHours || 0), 0);
    const avgProd = filteredHistory.reduce((acc, l) => acc + (l.productivityPercentage || 0), 0) / filteredHistory.length;
    const totalAvailableHours = filteredHistory.length * 24;

    return {
      efficiency: maxPossiblePoints > 0 ? ((earnedPoints / maxPossiblePoints) * 100).toFixed(1) : "0",
      sleep: ((totalSleep / totalAvailableHours) * 100).toFixed(1),
      prod: avgProd.toFixed(1),
      counts: [counts.Jamat, counts.Individual, counts.Qaza, counts.Missed],
      volume: recordedPrayers,
      goal: daysInView * 5
    };
  })();

  const handleSave = async () => {
    if (isSubmitting || isAlreadyLogged) return;
    setIsSubmitting(true);
    const totalSleep = calculateDuration(bedtime, waketime);
    try {
      await API.post('/logs/daily', { 
        salah, 
        sleepHours: Number(totalSleep), 
        productivityPercentage: prod, 
        date: today 
      });
      await fetchHistory();
    } catch (err) { console.error(err); } 
    finally { setIsSubmitting(false); }
  };
  const chartLabels = filteredHistory.map(l => new Date(l.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }));

  // Shared chart options for responsiveness
  const commonOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: 'white', font: { size: 10 } } }
    },
    scales: {
      x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { display: false } },
      y: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  };

  return (
    <div style={{ padding: '10px', maxWidth: '1200px', margin: '0 auto', color: 'white', paddingBottom: '50px', fontFamily: 'sans-serif' }}>
      
      {/* 1. TOP STATS - Responsive Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'SALAH', val: allStats.efficiency, color: '#10b981' },
          { label: 'SLEEP', val: allStats.sleep, color: '#3b82f6' },
          { label: 'PROD', val: allStats.prod, color: '#f59e0b' }
        ].map(item => (
          <div key={item.label} className="glass-card" style={{ textAlign: 'center', padding: '15px' }}>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0, fontWeight: 'bold' }}>{item.label}</p>
            <h3 style={{ color: item.color, margin: '5px 0', fontSize: '1.4rem' }}>{item.val}%</h3>
          </div>
        ))}
      </div>

      {/* 2. MAIN CONTENT LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        
        {/* Daily Inputs Card */}
        <div className="glass-card" style={{ padding: '20px' }}>
          {isAlreadyLogged ? (
            <div style={{ textAlign: 'center', color: '#10b981', padding: '20px' }}>
              <CheckCircle style={{ margin: '0 auto 10px' }} size={32} />
              <p style={{ fontWeight: 'bold' }}>Daily Entry Synced</p>
            </div>
          ) : (
            <>
              <div className="sleep-container-card">
  <div className="sleep-header">
    <span className="sleep-label">Sleep Duration</span>
    <span className="sleep-value">{calculateDuration(bedtime, waketime)}h</span>
  </div>

  <div className="pickers-grid">
    {/* Bedtime Section */}
    <div className="picker-column-wrapper">
      <div className="picker-title">Bedtime</div>
      <Picker value={bedtime} onChange={setBedtime} wheelMode="natural">
        {Object.keys(selections).map(name => (
          <Picker.Column key={name} name={name}>
            {selections[name].map(option => (
              <Picker.Item key={option} value={option}>
                {option}
              </Picker.Item>
            ))}
          </Picker.Column>
        ))}
      </Picker>
    </div>

    {/* Wake Up Section */}
    <div className="picker-column-wrapper">
      <div className="picker-title">Wake Up</div>
      <Picker value={waketime} onChange={setWaketime} wheelMode="natural">
        {Object.keys(selections).map(name => (
          <Picker.Column key={name} name={name}>
            {selections[name].map(option => (
              <Picker.Item key={option} value={option}>
                {option}
              </Picker.Item>
            ))}
          </Picker.Column>
        ))}
      </Picker>
    </div>
  </div>
</div>
                <div>
                  <p style={{ fontSize: '0.8rem', marginBottom: '8px' }}><Activity size={14}/> {prod}% Productivity</p>
                  <input type="range" min="0" max="100" value={prod} onChange={(e) => setProd(parseInt(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
                </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map(p => (
                  <div key={p} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ textTransform: 'capitalize', fontSize: '0.9rem' }}>{p}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[0, 1, 2, 3].map(n => (
                        <button key={n} onClick={() => setSalah({ ...salah, [p]: n })}
                          style={{ 
                            width: '32px', height: '32px', fontSize: '0.7rem', borderRadius: '6px', border: 'none',
                            background: salah[p] === n ? (n === 0 ? '#ef4444' : '#10b981') : 'rgba(255,255,255,0.1)',
                            color: 'white', cursor: 'pointer', transition: '0.2s'
                          }}>{n === 0 ? 'M' : n === 1 ? 'Q' : n === 2 ? 'I' : 'J'}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button className="submit-btn" disabled={isSubmitting} onClick={handleSave} style={{ width: '100%', marginTop: '20px', height: '45px', fontWeight: 'bold', borderRadius: '8px' }}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Sync Today'}
              </button>
            </>
          )}
        </div>

        {/* 3. TIME FILTER NAVIGATION */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
          {['week', 'month', 'year'].map(m => (
            <button key={m} onClick={() => setViewMode(m)} style={{
              background: viewMode === m ? '#10b981' : 'rgba(255,255,255,0.05)',
              border: '1px solid #10b981', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer'
            }}>{m.toUpperCase()}</button>
          ))}
        </div>

        {/* 4. ANALYTICS GRID - Multi-chart Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          
          {/* Salah Pie Chart */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieIcon size={16} /> Salah Distribution
            </h4>
            <div style={{ height: '250px', position: 'relative' }}>
               <Pie 
                 data={{
                   labels: ['Jamat', 'Indiv', 'Qaza', 'Missed'],
                   datasets: [{ data: allStats.counts, backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'], borderWidth: 0 }]
                 }} 
                 options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { position: 'bottom', labels: { color: 'white' } } } }} 
               />
            </div>
          </div>

          {/* Sleep Bar Chart */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={16} /> Sleep Trend (Hrs)
            </h4>
            <div style={{ height: '250px' }}>
               <Bar 
                 data={{
                   labels: chartLabels,
                   datasets: [{ label: 'Hrs', data: filteredHistory.map(l => l.sleepHours), backgroundColor: '#3b82f6', borderRadius: 4 }]
                 }} 
                 options={commonOptions} 
               />
            </div>
          </div>

          {/* Productivity Line Chart */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} /> Productivity Trend (%)
            </h4>
            <div style={{ height: '250px' }}>
               <Line 
                 data={{
                   labels: chartLabels,
                   datasets: [{ label: '%', data: filteredHistory.map(l => l.productivityPercentage), borderColor: '#f59e0b', tension: 0.3, fill: true, backgroundColor: 'rgba(245, 158, 11, 0.1)' }]
                 }} 
                 options={commonOptions} 
               />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;