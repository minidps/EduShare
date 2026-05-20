import React, { useState } from 'react';
import './Forum.css';

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
}

interface ForumProps {
  categories: string[];
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export default function Forum({ categories, onOpenAuth }: ForumProps) {
  const [forumFilter, setForumFilter] = useState<string>('all');

  // Extended Forum Posts Data specific to the Forum component
  const forumPosts: ForumPost[] = [
    { id: '1', title: 'Stuck on JavaScript closure problem... need help!', author: 'CodeNewbie', avatar: '👨‍💻', replies: 14, views: 142, upvotes: 22, tags: ['Coding', 'JS'], category: 'Computer Science', timeAgo: '2 hours ago' },
    { id: '2', title: 'How long are you guys studying for the SAT every day?', author: 'SatGrinder', avatar: '📚', replies: 42, views: 520, upvotes: 61, tags: ['General', 'SAT'], category: 'General', timeAgo: '5 hours ago' },
    { id: '3', title: 'Can someone check my molecular geometry chart for Chemistry?', author: 'BioChemVibe', avatar: '🧪', replies: 3, views: 45, upvotes: 8, tags: ['Chemistry', 'Help'], category: 'Biology', timeAgo: '1 day ago' },
    { id: '4', title: 'Tips for writing a high-scoring DBQ essay in AP History?', author: 'HistoryBuff', avatar: '✍️', replies: 19, views: 211, upvotes: 34, tags: ['APHist', 'Essay'], category: 'History', timeAgo: '2 days ago' },
  ];

  const filteredPosts = forumFilter === 'all' 
    ? forumPosts 
    : forumPosts.filter(post => post.category === forumFilter);

  return (
    <div className="forum-page-layout animate-fade">
      
      {/* Left Sidebar Sub-Navigation */}
      <aside className="forum-sidebar">
        <button className="btn-primary create-post-btn" onClick={() => onOpenAuth('login')}>
          + Create New Post
        </button>
        
        <div className="sidebar-menu-wrapper">
          <h3>Feeds</h3>
          <button className={`sidebar-link ${forumFilter === 'all' ? 'active' : ''}`} onClick={() => setForumFilter('all')}>🌐 All Discussions</button>
          <button className="sidebar-link">🔥 Popular This Week</button>
          <button className="sidebar-link">❓ Unanswered Questions</button>
        </div>

        <div className="sidebar-menu-wrapper">
          <h3>Subjects</h3>
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`sidebar-link ${forumFilter === cat ? 'active' : ''}`} 
              onClick={() => setForumFilter(cat)}
            >
              📚 {cat}
            </button>
          ))}
        </div>
      </aside>

      {/* Right Forum Feed Container */}
      <div className="forum-feed-container">
        <div className="forum-feed-header">
          <h2>{forumFilter === 'all' ? 'All Discussions' : `${forumFilter} Feed`}</h2>
          <div className="forum-sorting-tabs">
            <span className="active-tab">Latest</span>
            <span>Top Rated</span>
            <span>Trending</span>
          </div>
        </div>

        <div className="extended-forum-list">
          {filteredPosts.map((post) => (
            <div key={post.id} className="extended-post-card">
              {/* Voting Element */}
              <div className="post-vote-box">
                <button className="vote-btn">▲</button>
                <span className="vote-count">{post.upvotes}</span>
                <button className="vote-btn">▼</button>
              </div>

              {/* Content Details Element */}
              <div className="post-main-content">
                <span className="post-category-tag">{post.category}</span>
                <h3 className="post-title-text">{post.title}</h3>
                
                <div className="post-tags-container">
                  {post.tags.map(tag => (
                    <span key={tag} className="hash-tag">#{tag}</span>
                  ))}
                </div>

                <div className="post-author-footer">
                  <span className="author-avatar">{post.avatar}</span>
                  <span className="author-name">{post.author}</span>
                  <span className="bullet-divider">•</span>
                  <span className="post-time">{post.timeAgo}</span>
                </div>
              </div>

              {/* Stats Elements */}
              <div className="post-metrics-box">
                <div className="metric">
                  <span className="metric-icon">💬</span>
                  <strong>{post.replies}</strong> replies
                </div>
                <div className="metric">
                  <span className="metric-icon">👁️</span>
                  <strong>{post.views}</strong> views
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}