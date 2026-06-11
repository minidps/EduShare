import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Forum from './Forum.tsx';
import CreatePost from './CreatePost.tsx';
import PostDetail from './PostDetail.tsx';
import Account from './Аccount.tsx';
import './App.css';

import {
  registerUser,
  loginUser,
  getCurrentUser,
  submitVote,
  getPosts,
  createPost
} from './api/auth';

interface User {
  id: number;
  username: string;
  email: string;
  grade: string;
}

interface ForumPost {
  id: string;
  title: string;
  author: string;
  avatar: string;
  replies: number;
  views: number;
  upvotes: number;
  tags: string[];
  category: string;
  timeAgo: string;
  description?: string;
  fileName?: string | null;
}

type AuthMode = 'none' | 'login' | 'signup' | 'logout-confirm';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [authMode, setAuthMode] = useState<AuthMode>('none');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [userVotes, setUserVotes] = useState<Record<string, 'up' | 'down' | null>>({});

  // Mock dashboard data to prevent runtime crashes
  const trendingMaterials = [
    { id: '1', type: 'Notes', subject: 'Mathematics', title: 'Calculus BC Cheat Sheet', downloads: 142 }
  ];
  const forumPreview = [
    { id: '1', title: 'How to study for AP Chemistry?', tags: ['Help', 'ExamReview'], replies: 5 }
  ];

  useEffect(() => {
    const path = location.pathname;
    if (path === '/') {
      document.title = "Home";
    } else if (path === '/forum') {
      document.title = "Forum";
    } else if (path === '/create-post') {
      document.title = "Create Post";
    } else if (path.startsWith('/post/')) {
      document.title = "View Post";
    } else if (path === '/account') {
      document.title = "My Account";
    } else {
      document.title = "EduShare";
    }
  }, [location.pathname]);

  const loadPosts = async () => {
    try {
      const response = await getPosts();
      setForumPosts(response.data ?? []);
    } catch (err) {
      console.error('Failed to load posts:', err);
      setForumPosts([]);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) fetchCurrentUser();
  }, []);

  const normalizeVotes = (votes: Array<{ post_id: string; value: 'up' | 'down' }>) => {
    return votes.reduce((acc, vote) => {
      acc[vote.post_id] = vote.value;
      return acc;
    }, {} as Record<string, 'up' | 'down' | null>);
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await getCurrentUser();
      setCurrentUser(response.data);
      setUserVotes(normalizeVotes(response.data.votes || []));
      setIsLoggedIn(true);
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setIsLoggedIn(false);
      setCurrentUser(null);
      setUserVotes({});
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    const formData = new FormData(e.currentTarget);

    try {
      const response = await registerUser({
        username: formData.get('username') as string,
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        grade: formData.get('grade') as string,
      });

      const { access, refresh, votes, ...userData } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      setCurrentUser(userData);
      setUserVotes(normalizeVotes(votes || []));
      setIsLoggedIn(true);
      setAuthMode('none');
    } catch (error: any) {
      setAuthError(error.response?.data?.error || 'Registration failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    const formData = new FormData(e.currentTarget);

    try {
      const response = await loginUser({
        username: formData.get('email') as string,
        password: formData.get('password') as string,
      });

      const { access, refresh, votes, ...userData } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      setCurrentUser(userData);
      setUserVotes(normalizeVotes(votes || []));
      setIsLoggedIn(true);
      setAuthMode('none');
    } catch (error: any) {
      setAuthError(error.response?.data?.error || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    setIsLoggedIn(false);
    setCurrentUser(null);
    setUserVotes({});
    setAuthMode('none');

    navigate('/');
  };

  const handleHomeSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/forum?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/forum');
    }
  };

  const handleForumVote = async (postId: string, voteType: 'up' | 'down') => {
    if (!isLoggedIn) {
      setAuthMode('login');
      return false;
    }

    const currentVote = userVotes[postId];
    const nextVote = currentVote === voteType ? null : voteType;
    const voteValue = nextVote === null ? 'none' : nextVote;

    try {
      await submitVote({ post_id: postId, value: voteValue });
      setUserVotes(prev => ({
        ...prev,
        [postId]: nextVote,
      }));
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handlePublishPost = async (newPostData: any) => {
    try {
      await createPost(newPostData);
      await loadPosts();
      navigate('/forum');
    } catch (err) {
      console.error('Failed to create post:', err);
    }
  };

  const handleUpdateReplyCount = (postId: string) => {
    setForumPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId ? { ...post, replies: post.replies + 1 } : post
      )
    );
  };

  const navigateToMaterialThread = (subject: string) => {
    navigate(`/forum?category=${encodeURIComponent(subject)}`);
  };

  const categories = ['Mathematics', 'Biology', 'History', 'Computer Science', 'Physics', 'Literature'];

  return (
    <>
      <div className={`app-container ${authMode !== 'none' ? 'content-blur' : ''}`}>
        <header className="navbar">
          <div className="logo" onClick={() => navigate('/')}>EduShare</div>

          <nav className="nav-links">
            <button className={`nav-link-btn ${location.pathname === '/' ? 'active-nav' : ''}`} onClick={() => navigate('/')}>Home</button>
            <button className={`nav-link-btn ${location.pathname.startsWith('/forum') || location.pathname.startsWith('/post') || location.pathname === '/create-post' ? 'active-nav' : ''}`} onClick={() => navigate('/forum')}>Forum</button>
            {isLoggedIn && currentUser ? (
              <div className="user-menu">
                <span 
                  className="user-display" 
                  style={{ cursor: 'pointer' }} 
                  onClick={() => navigate('/account')}
                  title="View Account Details"
                >
                  👤 {currentUser.username} • Grade {currentUser.grade}
                </span>
                <button className="btn-secondary" onClick={() => setAuthMode('logout-confirm')}>Log Out</button>
              </div>
            ) : (
              <>
                <button className="btn-login" onClick={() => setAuthMode('login')}>Log In</button>
                <button className="btn-signup" onClick={() => setAuthMode('signup')}>Sign Up</button>
              </>
            )}
          </nav>
        </header>

        <Routes>
          <Route path="/" element={
            <main className="main-content animate-fade">
              <section className="hero-section">
                <h1>Learn together. Score higher. Share resources.</h1>
                <p>Access peer-reviewed student notes, study guides, and homework help entirely for free.</p>
                
                <form onSubmit={handleHomeSearchSubmit} className="search-form">
                  <input 
                    type="text" 
                    placeholder="Search by keyword, subject, or tags..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                  />
                  <button type="submit" className="search-btn">Search</button>
                </form>

                <div className="hero-ctas">
                  <button className="cta-browse" onClick={() => navigate('/forum')}>👋 Browse Material</button>
                  <button className="cta-upload" onClick={() => setAuthMode('signup')}>📤 Upload Your Notes</button>
                </div>
              </section>

              <section id="browse" className="categories-section">
                <h2>Browse by Subject</h2>
                <div className="categories-grid">
                  {categories.map((category) => (
                    <div key={category} className="category-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/forum?category=${encodeURIComponent(category)}`)}>
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
                      <div key={item.id} className="resource-card interactive-row" style={{ cursor: 'pointer' }} onClick={() => navigateToMaterialThread(item.subject)}>
                        <div>
                          <span className="badge">{item.type}</span>
                          <span className="subject-tag">{item.subject}</span>
                          <h4>{item.title}</h4>
                        </div>
                        <div className="stats-col"><div>📥 <strong>{item.downloads}</strong> downloads</div></div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="forum-section">
                  <h2>💬 Active Discussions</h2>
                  <div className="discussions-list">
                    {forumPreview.map((post) => (
                      <div key={post.id} className="discussion-card interactive" onClick={() => navigate('/forum')}>
                        <h4>{post.title}</h4>
                        <div className="discussion-meta">
                          <div className="tags-wrapper">{post.tags.map(tag => <span key={tag} className="hash-tag">#{tag}</span>)}</div>
                          <div className="replies-count">💬 {post.replies} replies</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="view-all-forum-btn" onClick={() => navigate('/forum')}>Go to Full Forum &rarr;</button>
                </section>
              </div>
            </main>
          } />

          <Route path="/forum" element={
            <Forum
              categories={categories}
              forumPosts={forumPosts}
              userVotes={userVotes}
              onVote={handleForumVote}
            />
          } />

          <Route path="/create-post" element={
            <CreatePost
              categories={categories}
              onPublish={handlePublishPost}
              onCancel={() => navigate('/forum')}
            />
          } />

          <Route path="/post/:id" element={
            <PostDetail
              forumPosts={forumPosts}
              userVotes={userVotes}
              onVote={handleForumVote}
              onAddReplyCount={handleUpdateReplyCount}
              currentUser={currentUser?.username}
            />
          } />

          <Route path="/account" element={
            <main className="main-content">
              <Account currentUser={currentUser} isLoggedIn={isLoggedIn} />
            </main>
          } />
        </Routes>
      </div>

      {authMode !== 'none' && (
        <div className="modal-overlay" onClick={() => setAuthMode('none')}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close-btn" onClick={() => setAuthMode('none')}>&times;</button>
            
            {authMode === 'logout-confirm' ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <h2>Are you sure?</h2>
                <p style={{ color: '#64748b', marginBottom: '2rem' }}>You will need to sign back in to contribute or upload files.</p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button className="btn-secondary" style={{ padding: '0.75rem 2rem' }} onClick={() => setAuthMode('none')}>Cancel</button>
                  <button className="btn-primary" style={{ padding: '0.75rem 2rem' }} onClick={handleLogout}>Yes, Log Out</button>
                </div>
              </div>
            ) : (
              <>
                <h2>{authMode === 'login' ? 'Welcome Back' : 'Create an Account'}</h2>
                {authError && <div className="auth-error">{authError}</div>}
                <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="modal-form">
                  {authMode === 'signup' && (
                    <>
                      <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input type="text" id="username" name="username" placeholder="e.g. StudyMaster42" required />
                      </div>
                      <div className="form-group">
                        <label htmlFor="grade">Grade</label>
                        <select id="grade" name="grade" required>
                          <option value="">Select your grade</option>
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
                    </>
                  )}
                  <div className="form-group">
                    <label htmlFor="email">{authMode === 'login' ? 'Email or Username' : 'Email Address'}</label>
                    <input type="text" id="email" name="email" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" name="password" required />
                  </div>
                  <button type="submit" className="btn-primary modal-submit-btn" disabled={authLoading}>
                    {authLoading ? 'Loading...' : (authMode === 'login' ? 'Sign In' : 'Get Started')}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}