import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Account.css';

interface User {
  id: number;
  username: string;
  email: string;
  grade: string;
}

interface AccountProps {
  currentUser: User | null;
  isLoggedIn: boolean;
  onUserUpdate?: (updatedUser: User) => void;
}

export default function Account({ currentUser, isLoggedIn, onUserUpdate }: AccountProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [grade, setGrade] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isLoggedIn || !currentUser) {
      navigate('/');
    } else {
      setEmail(currentUser.email || '');
      setGrade(currentUser.grade || '');
    }
  }, [isLoggedIn, currentUser, navigate]);

  if (!currentUser) return null;
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const token = localStorage.getItem('access');

    try {
      
      const response = await fetch('http://127.0.0.1:8000/me/update/', { 
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, grade }),
      });

      const responseText = await response.text();
      const data = responseText ? JSON.parse(responseText) : {};

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      if (onUserUpdate) onUserUpdate(data);

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-container animate-fade">
      <div className="account-card">
        <div className="account-header">
          <div className="profile-avatar">🎓</div>
          <h2>Account Details</h2>
          <p className="account-subtitle">Manage your student profile settings</p>
        </div>

        {message && (
          <div className={`alert-box ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSaveChanges} className="account-form">
          <div className="form-group-row">
            <div className="form-group">
              <label htmlFor="acc-username">Username</label>
              <input 
                type="text" 
                id="acc-username" 
                defaultValue={currentUser.username} 
                disabled 
              />
              <small className="input-hint">Username cannot be changed</small>
            </div>

            <div className="form-group">
              <label htmlFor="acc-grade">Grade / Education level</label>
              <select 
                id="acc-grade" 
                value={grade} 
                onChange={(e) => setGrade(e.target.value)}
              >
                <option value="6">6th Grade</option>
                <option value="7">7th Grade</option>
                <option value="8">8th Grade</option>
                <option value="9">9th Grade</option>
                <option value="10">10th Grade</option>
                <option value="11">11th Grade</option>
                <option value="12">12th Grade</option>
                <option value="college">College</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="acc-email">Email Address</label>
            <input 
              type="email" 
              id="acc-email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="account-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)} disabled={loading}>
              Back
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}