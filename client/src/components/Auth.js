import React, { useState } from 'react';
import API from '../api/axios.js'; // Integrated your central API instance
import { Lock, User, LogIn, UserPlus } from 'lucide-react';

const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const endpoint = isLogin ? 'login' : 'register';
    
    try {
      // Switched from axios.post to API.post to use the Vercel BaseURL
      const res = await API.post(`/api/auth/${endpoint}`, formData);
      
      if (isLogin) {
        // Store session data
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('username', res.data.user.username);
        onLogin(); 
      } else {
        alert("Registration successful! You can now log in.");
        setIsLogin(true); 
        setFormData({ ...formData, password: '' });
      }
    } catch (err) {
      // Detailed error catching for a better mobile experience
      const message = err.response?.data?.message || 
                      err.response?.data?.error || 
                      err.response?.data?.msg || 
                      "Connection failed. Ensure your backend is running.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card auth-card">
        <div className="auth-header">
          {/* Dynamic Icon color based on state */}
          {isLogin ? <LogIn size={32} color="#10b981" /> : <UserPlus size={32} color="#3b82f6" />}
          <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
          <p>{isLogin ? "Monitor your spiritual growth" : "Start your journey today"}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <User size={18} className="input-icon" />
            <input 
              type="text" 
              placeholder="Username or Email" 
              required 
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>

          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input 
              type="password" 
              placeholder="Password" 
              required 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          {error && (
            <p className="error-msg" style={{ 
              color: '#ef4444', 
              fontSize: '0.85rem', 
              marginTop: '10px', 
              textAlign: 'center',
              background: 'rgba(239, 68, 68, 0.1)',
              padding: '8px',
              borderRadius: '6px'
            }}>
              {error}
            </p>
          )}

          <button 
            type="submit" 
            className="submit-btn auth-btn" 
            disabled={loading}
            style={{ 
              marginTop: '20px', 
              opacity: loading ? 0.7 : 1,
              width: '100%',
              padding: '12px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? "Processing..." : (isLogin ? "Login" : "Register")}
          </button>
        </form>

        <p className="toggle-auth" style={{ textAlign: 'center', marginTop: '15px', fontSize: '0.9rem' }}>
          {isLogin ? "New here?" : "Already have an account?"} 
          <span 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={{ color: '#10b981', cursor: 'pointer', marginLeft: '5px', fontWeight: 'bold' }}
          >
            {isLogin ? " Create an account" : " Login now"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Auth;