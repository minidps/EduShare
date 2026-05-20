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
  description?: string;
  fileName?: string | null;
}

interface ForumProps {
  categories: string[];
  onOpenAuth: (mode: 'login' | 'signup') => void;
  setCurrentPage: (page: 'home' | 'forum' | 'create-post') => void;
  forumPosts: ForumPost[];
  setForumPosts: React.Dispatch<React.SetStateAction<ForumPost[]>>;
  onSelectPost: (post: ForumPost) => void; // Prop trigger link handler to launch thread layout view
}

export default function Forum({ categories, onOpenAuth, setCurrentPage, forumPosts, setForumPosts, onSelectPost }: ForumProps) {
  const [forumFilter, setForumFilter] = useState<string>('all');
  const [votesRecord, setVotesRecord] = useState<Record<string, 'up' | 'down' | null>>({});

  const filteredPosts = forumFilter === 'all' 
    ? forumPosts 
    : forumPosts.filter(post => post.category === forumFilter);

  const handleVote = (id: string, incomingVote: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation(); // Stop parent trigger link click interceptors
    const currentVote = votesRecord[id] || null;

    setForumPosts(prev => prev.map(post => {
      if (post.id !== id) return post;
      let voteAdjustment = 0;

      if (currentVote === incomingVote) {
        voteAdjustment = incomingVote === 'up' ? -1 : 1;
        setVotesRecord(prevRecord => ({ ...prevRecord, [id]: null }));
      } else if (currentVote === null) {
        voteAdjustment = incomingVote === 'up' ? 1 : -1;
        setVotesRecord(prevRecord => ({ ...prevRecord, [id]: incomingVote }));
      } else {
        voteAdjustment = incomingVote === 'up' ? 2 : -2;
        setVotesRecord(prevRecord => ({ ...prevRecord, [id]: incomingVote }));
      }

      return { ...post, upvotes: post.upvotes + voteAdjustment };
    }));
  };

  return (
    <div className="forum-page-layout animate-fade">
      <aside className="forum-sidebar">
        <button className="btn-primary create-post-btn" onClick={() => setCurrentPage('create-post')}>
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
            <button key={cat} className={`sidebar-link ${forumFilter === cat ? 'active' : ''}`} onClick={() => setForumFilter(cat)}>📚 {cat}</button>
          ))}
        </div>
      </aside>

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
          {filteredPosts.map((post) => {
            const userVoteStatus = votesRecord[post.id] || null;
            
            return (
              /* Added Click Navigation Interceptor to launch the thread */
              <div key={post.id} className="extended-post-card interactive-row" onClick={() => onSelectPost(post)}>
                <div className="post-vote-box">
                  <button className={`vote-btn ${userVoteStatus === 'up' ? 'active-upvote' : ''}`} onClick={(e) => handleVote(post.id, 'up', e)}>▲</button>
                  <span className={`vote-count ${userVoteStatus ? 'voted-count' : ''}`}>{post.upvotes}</span>
                  <button className={`vote-btn ${userVoteStatus === 'down' ? 'active-downvote' : ''}`} onClick={(e) => handleVote(post.id, 'down', e)}>▼</button>
                </div>

                <div className="post-main-content">
                  <span className="post-category-tag">{post.category}</span>
                  <h3 className="post-title-text">{post.title}</h3>
                  <div className="post-tags-container">
                    {post.tags.map(tag => <span key={tag} className="hash-tag">#{tag}</span>)}
                  </div>
                  <div className="post-author-footer">
                    <span className="author-avatar">{post.avatar}</span>
                    <span className="author-name">{post.author}</span>
                    <span className="bullet-divider">•</span>
                    <span className="post-time">{post.timeAgo}</span>
                  </div>
                </div>

                <div className="post-metrics-box">
                  <div className="metric"><span>💬</span> <strong>{post.replies}</strong> replies</div>
                  <div className="metric"><span>👁️</span> <strong>{post.views}</strong> views</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}