import React, { useState, useEffect } from 'react';
import Forum from './Forum.tsx'; // Updated from Forum.tsx to lowercase forum.tsx
import CreatePost from './CreatePost.tsx';
import PostDetail from './PostDetail.tsx';
import './App.css';
import { registerUser, loginUser, getCurrentUser } from './api/auth';

interface User {
  id: number;
  username: string;
  email: string;
}

interface MaterialItem {
  id: string;
  title: string;
  subject: string;
  type: 'Notes' | 'Quiz' | 'Guide';
  downloads: number;
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

type AuthMode = 'none' | 'login' | 'signup';
type PageMode = 'home' | 'forum' | 'create-post' | 'view-thread';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageMode>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [authMode, setAuthMode] = useState<AuthMode>('none');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeThreadPost, setActiveThreadPost] = useState<ForumPost | null>(null);
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Check if user is already logged in on app load
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchCurrentUser();
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await getCurrentUser();
      setCurrentUser(response.data);
      setIsLoggedIn(true);
    } catch (error) {
      // Token is invalid or expired
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setIsLoggedIn(false);
      setCurrentUser(null);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const response = await registerUser({ username, email, password });
      const { access, refresh, ...userData } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setCurrentUser(userData);
      setIsLoggedIn(true);
      setAuthMode('none');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      setAuthError(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    const formData = new FormData(e.currentTarget);
    const username = formData.get('email') as string; // Using email as username input
    const password = formData.get('password') as string;

    try {
      const response = await loginUser({ username, password });
      const { access, refresh, ...userData } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setCurrentUser(userData);
      setIsLoggedIn(true);
      setAuthMode('none');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      setAuthError(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentPage('home');
  };

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

  const [forumPosts, setForumPosts] = useState<ForumPost[]>([
    { id: '1', title: 'Stuck on JavaScript closure problem... need help!', author: 'CodeNewbie', avatar: '👨‍💻', replies: 14, views: 142, upvotes: 22, tags: ['Coding', 'JS'], category: 'Computer Science', timeAgo: '2 hours ago', description: 'Can someone explain why closures remember their outer variable scope references even after the outer functions finish executing? A simple code example would be awesome!' },
    { id: '2', title: 'How long are you guys studying for the SAT every day?', author: 'SatGrinder', avatar: '📚', replies: 42, views: 520, upvotes: 61, tags: ['General', 'SAT'], category: 'General', timeAgo: '5 hours ago', description: 'Trying to hit a 1500+ score on the upcoming test date. How many hours are you allocating daily between Math drills and reading test packets?' },
    { id: '3', title: 'Can someone check my molecular geometry chart for Chemistry?', author: 'BioChemVibe', avatar: '🧪', replies: 3, views: 45, upvotes: 8, tags: ['Chemistry', 'Help'], category: 'Biology', timeAgo: '1 day ago', description: 'Unsure about the bent geometry angle definitions for water versus sulfur dioxide. Help is appreciated!', fileName: 'chem_chart_draft.pdf' },
  ]);

  const handleLaunchThreadView = (post: ForumPost) => {
    setActiveThreadPost(post);
    setCurrentPage('view-thread');
  };

  const handleIncrementReplyMetrics = (postId: string) => {
    setForumPosts(prev => prev.map(p => p.id === postId ? { ...p, replies: p.replies + 1 } : p));
  };

  const handlePublishPost = (newPostData: {
    title: string;
    category: string;
    tags: string[];
    description: string;
    fileName: string | null;
  }) => {
    const newPost: ForumPost = {
      id: String(forumPosts.length + 1),
      title: newPostData.title,
      author: currentUser?.username || 'AnonymousStudent',
      avatar: '🎓',
      replies: 0,
      views: 1,
      upvotes: 1,
      tags: newPostData.tags,
      category: newPostData.category,
      timeAgo: 'Just now',
      description: newPostData.description,
      fileName: newPostData.fileName
    };

    setForumPosts([newPost, ...forumPosts]);
    setCurrentPage('forum');
  };

  return (
    <>
      <div className={`app-container ${authMode !== 'none' ? 'content-blur' : ''}`}>
        {/* Navigation Bar */}
        <header className="navbar">
          <div className="logo" onClick={() => setCurrentPage('home')}>EduShare</div>
          <nav className="nav-links">
            <button className={`nav-link-btn ${currentPage === 'home' ? 'active-nav' : ''}`} onClick={() => setCurrentPage('home')}>Home</button>
            <button className={`nav-link-btn ${currentPage === 'forum' || currentPage === 'view-thread' ? 'active-nav' : ''}`} onClick={() => setCurrentPage('forum')}>Forum</button>
            {isLoggedIn && currentUser ? (
              <div className="user-menu">
                <span className="user-display">👤 {currentUser.username}</span>
                <button className="btn-secondary" onClick={handleLogout}>Log Out</button>
              </div>
            ) : (
              <>
                <button className="btn-secondary" onClick={() => setAuthMode('login')}>Log In</button>
                <button className="btn-primary" onClick={() => setAuthMode('signup')}>Sign Up</button>
              </>
            )}
          </nav>
        </header>

        {/* HOME VIEW */}
        {currentPage === 'home' && (
          <main className="main-content animate-fade">
            <section className="hero-section">
              <h1>Learn together. Score higher. Share resources.</h1>
              <p>Access peer-reviewed student notes, study guides, and homework help entirely for free.</p>
              <form onSubmit={(e) => e.preventDefault()} className="search-form">
                <input type="text" placeholder="Search by subject, textbook, or keywords..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
                      <div className="stats-col"><div>📥 <strong>{item.downloads}</strong> downloads</div></div>
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
                <button className="view-all-forum-btn" onClick={() => setCurrentPage('forum')}>Go to Full Forum &rarr;</button>
              </section>
            </div>
          </main>
        )}

        {/* FORUM VIEW */}
        {currentPage === 'forum' && (
          <main className="main-content">
            <Forum 
              categories={categories} 
              onOpenAuth={(mode) => setAuthMode(mode)} 
              setCurrentPage={setCurrentPage}
              forumPosts={forumPosts}
              setForumPosts={setForumPosts}
              onSelectPost={handleLaunchThreadView}
            />
          </main>
        )}

        {/* CREATE POST VIEW */}
        {currentPage === 'create-post' && (
          <main className="main-content">
            <CreatePost 
              categories={categories} 
              onCancel={() => setCurrentPage('forum')}
              onPublish={handlePublishPost}
            />
          </main>
        )}

        {/* THREAD VIEW */}
        {currentPage === 'view-thread' && activeThreadPost && (
          <main className="main-content">
            <PostDetail 
              post={activeThreadPost}
              onBack={() => { setCurrentPage('forum'); setActiveThreadPost(null); }}
              onAddReplyCount={handleIncrementReplyMetrics}
            />
          </main>
        )}

        {/* Statistics Banner */}
        <main className="main-content" style={{paddingTop: 0, paddingBottom: 0}}>
          <section className="stats-ticker">
            <div className="stat-item"><div className="stat-number primary-color">25k+</div><div className="stat-label">Study Guides</div></div>
            <div className="divider"></div>
            <div className="stat-item"><div className="stat-number success-color">10k+</div><div className="stat-label">Active Students</div></div>
            <div className="divider"></div>
            <div className="stat-item"><div className="stat-number warning-color">98%</div><div className="stat-label">Helpfulness Rating</div></div>
          </section>
        </main>

        <footer className="footer">&copy; {new Date().getFullYear()} EduShare. Made by students, for students.</footer>
      </div>

      {/* Auth Overlay Modal */}
      {authMode !== 'none' && (
        <div className="modal-overlay" onClick={() => setAuthMode('none')}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close-btn" onClick={() => setAuthMode('none')}>&times;</button>
            <h2>{authMode === 'login' ? 'Welcome Back' : 'Create an Account'}</h2>
            {authError && <div className="auth-error">{authError}</div>}
            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="modal-form">
              {authMode === 'signup' && (
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input type="text" id="username" name="username" placeholder="e.g. StudyMaster42" required />
                </div>
              )}
              <div className="form-group">
                <label htmlFor="email">{authMode === 'login' ? 'Email or Username' : 'Email Address'}</label>
                <input type="text" id="email" name="email" placeholder={authMode === 'login' ? 'you@school.com or username' : 'you@school.com'} required />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input type="password" id="password" name="password" placeholder="••••••••" required />
              </div>
              <button type="submit" className="btn-primary modal-submit-btn" disabled={authLoading}>
                {authLoading ? 'Loading...' : (authMode === 'login' ? 'Sign In' : 'Get Started')}
              </button>
            </form>
            <div className="modal-toggle-text">
              {authMode === 'login' ? (
                <>Don't have an account? <span onClick={() => setAuthMode('signup')}>Sign up here</span></>
              ) : (
                <>Already have an account? <span onClick={() => setAuthMode('login')}>Log in here</span></>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}