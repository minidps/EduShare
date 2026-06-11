import React from 'react';
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
}

export default function Account({ currentUser, isLoggedIn }: AccountProps) {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isLoggedIn || !currentUser) {
      navigate('/');
    }
  }, [isLoggedIn, currentUser, navigate]);

  if (!currentUser) return null;

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Backend integration coming soon! Profile modifications are currently disabled.');
  };

  return (
    <div className="account-container animate-fade">
      <div className="account-card">
        <div className="account-header">
          <div className="profile-avatar">🎓</div>
          <h2>Account Details</h2>
          <p className="account-subtitle">Manage your student profile settings</p>
        </div>

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
              <select id="acc-grade" defaultValue={currentUser.grade} disabled>
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
              defaultValue={currentUser.email} 
              disabled 
            />
          </div>

          <div className="account-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
              Back
            </button>
            <button type="submit" className="btn-primary">
              Save Changes (Disabled)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}