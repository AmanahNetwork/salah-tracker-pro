import React, { useState } from 'react';
import axios from 'axios';
import { Lock, User, LogIn, UserPlus } from 'lucide-react';

const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  // Keep the key as 'username' because that is what your Backend/Mongoose requires
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const endpoint = isLogin ? 'login' : 'register';
    
    try {
      // We send the formData object which contains { username, password }
      const res = await axios.post(`/api/auth/${endpoint}`, formData);
      
      if (isLogin) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('username', res.data.user.username);
        onLogin(); 
      } else {
        alert("Registration successful! You can now log in.");
        setIsLogin(true); // Switch to login view
        // Optional: Clear the password but keep the username for easy login
        setFormData({ ...formData, password: '' });
      }
    } catch (err) {
      // Capture the specific 'Path username is required' error or any other backend msg
      const message = err.response?.data?.message || 
                      err.response?.data?.error || 
                      err.response?.data?.msg || 
                      "Connection failed. Please check your internet.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card auth-card">
        <div className="auth-header">
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
              // This updates the 'username' key regardless of what the user types
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

          {error && <p className="error-msg" style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '10px', textAlign: 'center' }}>{error}</p>}

          <button 
            type="submit" 
            className="submit-btn auth-btn" 
            disabled={loading}
            style={{ marginTop: '20px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Processing..." : (isLogin ? "Login" : "Register")}
          </button>
        </form>

        <p className="toggle-auth">
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