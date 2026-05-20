import React, { useState } from 'react';
import Forum from './forum.tsx';
import './App.css';

interface MaterialItem {
  id: string;
  title: string;
  subject: string;
  type: 'Notes' | 'Quiz' | 'Guide';
  downloads: number;
}

type AuthMode = 'none' | 'login' | 'signup';
type PageMode = 'home' | 'forum';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageMode>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [authMode, setAuthMode] = useState<AuthMode>('none');

  const categories: string[] = ['Mathematics', 'Biology', 'History', 'Computer Science', 'Physics', 'Literature'];
  
  const trendingMaterials: MaterialItem[] = [
    { id: '1', title: 'AP Calculus BC Ultimate Review Packet', subject: 'Mathematics', type: 'Guide', downloads: 342 },
    { id: '2', title: 'Organic Chemistry Functional Groups Cheat Sheet', subject: 'Biology', type: 'Notes', downloads: 215 },
    { id: '3', title: 'WWII Timeline & Major Battles Summary', subject: 'History', type: 'Notes', downloads: 189 },
  ];

  const forumPreview = [
    { id: '1', title: 'Stuck on JavaScript closure problem... need help!', tags: ['Coding', 'JS'], replies: 14 },
    { id: '2', title: 'How long are you guys studying for the SAT every day?', tags: ['General', 'SAT'], replies: 42 }
  ];

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
  };

  const handleAuthSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthMode('none'); 
  };

  const toggleAuthFromModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
  };

  return (
    <>
      <div className={`app-container ${authMode !== 'none' ? 'content-blur' : ''}`}>
        
        {/* Navigation Bar */}
        <header className="navbar">
          <div className="logo" onClick={() => setCurrentPage('home')}>
            EduShare
          </div>
          <nav className="nav-links">
            <button className={`nav-link-btn ${currentPage === 'home' ? 'active-nav' : ''}`} onClick={() => setCurrentPage('home')}>Home</button>
            <button className={`nav-link-btn ${currentPage === 'forum' ? 'active-nav' : ''}`} onClick={() => setCurrentPage('forum')}>Forum</button>
            <button className="btn-secondary" onClick={() => setAuthMode('login')}>Log In</button>
            <button className="btn-primary" onClick={() => setAuthMode('signup')}>Sign Up</button>
          </nav>
        </header>

        {/* HOME PAGE VIEW */}
        {currentPage === 'home' && (
          <main className="main-content animate-fade">
            <section className="hero-section">
              <h1>Learn together. Score higher. Share resources.</h1>
              <p>Access peer-reviewed student notes, study guides, and homework help entirely for free.</p>

              <form onSubmit={handleSearch} className="search-form">
                <input 
                  type="text" 
                  placeholder="Search by subject, textbook, or keywords..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="search-btn">Search</button>
              </form>

              <div className="hero-ctas">
                <button className="cta-browse">👋 Browse Material</button>
                <button className="cta-upload" onClick={() => setAuthMode('signup')}>📤 Upload Your Notes</button>
              </div>
            </section>

            <section id="browse" className="categories-section">
              <h2>Browse by Subject</h2>
              <div className="categories-grid">
                {categories.map((category) => (
                  <div key={category} className="category-card">
                    <div className="category-icon">📚</div>
                    <div className="category-name">{category}</div>
                  </div>
                ))}
              </div>
            </section>

            <div className="dashboard-grid">
              <section className="trending-section">
                <h2>🔥 Trending Resources</h2>
                <div className="resources-list">
                  {trendingMaterials.map((item) => (
                    <div key={item.id} className="resource-card">
                      <div>
                        <span className="badge">{item.type}</span>
                        <span className="subject-tag">{item.subject}</span>
                        <h4>{item.title}</h4>
                      </div>
                      <div className="stats-col">
                        <div>📥 <strong>{item.downloads}</strong> downloads</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="forum-section">
                <h2>💬 Active Discussions</h2>
                <div className="discussions-list">
                  {forumPreview.map((post) => (
                    <div key={post.id} className="discussion-card interactive" onClick={() => setCurrentPage('forum')}>
                      <h4>{post.title}</h4>
                      <div className="discussion-meta">
                        <div className="tags-wrapper">
                          {post.tags.map(tag => <span key={tag} className="hash-tag">#{tag}</span>)}
                        </div>
                        <div className="replies-count">💬 {post.replies} replies</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="view-all-forum-btn" onClick={() => setCurrentPage('forum')}>
                  Go to Full Forum &rarr;
                </button>
              </section>
            </div>
          </main>
        )}

        {/* FORUM PAGE VIEW */}
        {currentPage === 'forum' && (
          <main className="main-content">
            <Forum categories={categories} onOpenAuth={toggleAuthFromModal} />
          </main>
        )}

        {/* Statistics Banner */}
        <main className="main-content" style={{paddingTop: 0, paddingBottom: 0}}>
          <section className="stats-ticker">
            <div className="stat-item">
              <div className="stat-number primary-color">25k+</div>
              <div className="stat-label">Study Guides</div>
            </div>
            <div className="divider"></div>
            <div className="stat-item">
              <div className="stat-number success-color">10k+</div>
              <div className="stat-label">Active Students</div>
            </div>
            <div className="divider"></div>
            <div className="stat-item">
              <div className="stat-number warning-color">98%</div>
              <div className="stat-label">Helpfulness Rating</div>
            </div>
          </section>
        </main>

        <footer className="footer">
          &copy; {new Date().getFullYear()} EduShare. Made by students, for students.
        </footer>
      </div>

      {/* Auth Overlay Popups */}
      {authMode !== 'none' && (
        <div className="modal-overlay" onClick={() => setAuthMode('none')}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close-btn" onClick={() => setAuthMode('none')}>&times;</button>
            <h2>{authMode === 'login' ? 'Welcome Back' : 'Create an Account'}</h2>
            <p className="modal-subtitle">Join the EduShare student community</p>

            <form onSubmit={handleAuthSubmit} className="modal-form">
              {authMode === 'signup' && (
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input type="text" id="username" placeholder="e.g. StudyMaster42" required />
                </div>
              )}
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input type="email" id="email" placeholder="you@school.com" required />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input type="password" id="password" placeholder="••••••••" required />
              </div>
              <button type="submit" className="btn-primary modal-submit-btn">
                {authMode === 'login' ? 'Sign In' : 'Get Started'}
              </button>
            </form>

            <div className="modal-toggle-text">
              {authMode === 'login' ? (
                <>New to EduShare? <span onClick={() => setAuthMode('signup')}>Create an account</span></>
              ) : (
                <>Already have an account? <span onClick={() => setAuthMode('login')}>Log in</span></>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}