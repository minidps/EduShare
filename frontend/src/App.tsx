import React, { useState } from 'react';
import Forum from './forum.tsx'; // Updated from Forum.tsx to lowercase forum.tsx
import CreatePost from './CreatePost.tsx';
import PostDetail from './PostDetail.tsx';
import './App.css';

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
  const [activeThreadPost, setActiveThreadPost] = useState<ForumPost | null>(null);

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

  const handleForumNavigation = () => {
    setCurrentPage('forum');
  };

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
      author: isLoggedIn ? 'AnonymousStudent' : 'GuestUser',
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
            <button className={`nav-link-btn ${currentPage === 'forum' || currentPage === 'view-thread' ? 'active-nav' : ''}`} onClick={handleForumNavigation}>Forum</button>
            {isLoggedIn ? (
              <button className="btn-secondary" onClick={() => setIsLoggedIn(false)}>Log Out</button>
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
                    <div key={post.id} className="discussion-card interactive" onClick={handleForumNavigation}>
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
                <button className="view-all-forum-btn" onClick={handleForumNavigation}>Go to Full Forum &rarr;</button>
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
            <form onSubmit={(e) => { e.preventDefault(); setIsLoggedIn(true); setAuthMode('none'); }} className="modal-form">
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
              <button type="submit" className="btn-primary modal-submit-btn">{authMode === 'login' ? 'Sign In' : 'Get Started'}</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}