import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  forumPosts: ForumPost[];
  setForumPosts: React.Dispatch<React.SetStateAction<ForumPost[]>>;
}

export default function Forum({ categories, forumPosts, setForumPosts }: ForumProps) {
  const navigate = useNavigate();
  const [forumFilter, setForumFilter] = useState<string>('all');
  const [sortTab, setSortTab] = useState<'latest' | 'top' | 'trending'>('latest');
  const [votesRecord, setVotesRecord] = useState<Record<string, 'up' | 'down' | null>>({});

  const handleVote = (id: string, type: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const currentVote = votesRecord[id];

    setForumPosts(prevPosts => prevPosts.map(post => {
      if (post.id !== id) return post;
      let diff = 0;
      if (type === 'up') {
        if (currentVote === 'up') diff = -1;
        else if (currentVote === 'down') diff = 2;
        else diff = 1;
      } else {
        if (currentVote === 'down') diff = 1;
        else if (currentVote === 'up') diff = -2;
        else diff = -1;
      }
      return { ...post, upvotes: post.upvotes + diff };
    }));

    setVotesRecord(prev => ({
      ...prev,
      [id]: currentVote === type ? null : type
    }));
  };

  const filteredPosts = forumPosts.filter(post => {
    if (forumFilter === 'all') return true;
    if (forumFilter === 'popular') return post.upvotes >= 15;
    if (forumFilter === 'unanswered') return post.replies === 0;
    return post.category === forumFilter;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortTab === 'top') return b.upvotes - a.upvotes;
    if (sortTab === 'trending') return b.views - a.views;
    return 0;
  });

  return (
    <div className="forum-page-layout">
      <aside className="forum-sidebar">
        {/* Води до /create-post */}
        <button className="btn-primary create-post-btn" onClick={() => navigate('/create-post')}>
          + Create New Post
        </button>
        <div className="sidebar-menu-wrapper">
          <h3>Feed Filters</h3>
          <button className={`sidebar-link ${forumFilter === 'all' ? 'active-sidebar-link' : ''}`} onClick={() => setForumFilter('all')}>🌐 All Discussions</button>
          <button className={`sidebar-link ${forumFilter === 'popular' ? 'active-sidebar-link' : ''}`} onClick={() => setForumFilter('popular')}>🔥 Popular Threads</button>
          <button className={`sidebar-link ${forumFilter === 'unanswered' ? 'active-sidebar-link' : ''}`} onClick={() => setForumFilter('unanswered')}>❔ Unanswered</button>
        </div>
        <div className="sidebar-menu-wrapper">
          <h3>Categories</h3>
          {categories.map(cat => (
            <button key={cat} className={`sidebar-link ${forumFilter === cat ? 'active-sidebar-link' : ''}`} onClick={() => setForumFilter(cat)}>📚 {cat}</button>
          ))}
        </div>
      </aside>

      <div className="forum-main-content-area">
        <div className="forum-sort-header-tabs">
          <button className={`sort-tab-btn ${sortTab === 'latest' ? 'active-sort-tab' : ''}`} onClick={() => setSortTab('latest')}>Newest</button>
          <button className={`sort-tab-btn ${sortTab === 'top' ? 'active-sort-tab' : ''}`} onClick={() => setSortTab('top')}>Top Voted</button>
          <button className={`sort-tab-btn ${sortTab === 'trending' ? 'active-sort-tab' : ''}`} onClick={() => setSortTab('trending')}>Trending</button>
        </div>

        <div className="forum-threads-list-stream">
          {sortedPosts.length === 0 ? (
            <div className="empty-forum-state">
              <h3>No threads found</h3>
            </div>
          ) : (
            sortedPosts.map(post => {
              const userVoteStatus = votesRecord[post.id];
              return (
                /* Променя URL адреса на /post/идентификатор */
                <div key={post.id} className="forum-post-row-card interactive-row" onClick={() => navigate(`/post/${post.id}`)}>
                  <div className="post-voting-sidebar-block">
                    <button className={`vote-btn ${userVoteStatus === 'up' ? 'active-upvote' : ''}`} onClick={(e) => handleVote(post.id, 'up', e)}>▲</button>
                    <span className={`vote-count ${userVoteStatus ? 'voted-count' : ''}`}>{post.upvotes}</span>
                    <button className={`vote-btn ${userVoteStatus === 'down' ? 'active-downvote' : ''}`} onClick={(e) => handleVote(post.id, 'down', e)}>▼</button>
                  </div>

                  <div className="post-main-content">
                    <span className="post-category-tag">{post.category}</span>
                    <h3 className="post-title-text">{post.title}</h3>
                    <div className="post-tags-container">{post.tags.map(tag => <span key={tag} className="hash-tag">#{tag}</span>)}</div>
                    <div className="post-author-footer">
                      <span className="author-avatar">{post.avatar}</span>
                      <span className="author-name">{post.author}</span>
                      <span className="bullet-divider">•</span>
                      <span className="post-time">{post.timeAgo}</span>
                    </div>
                  </div>

                  <div className="post-metrics-box">
                    <div className="metric"><span>💬</span> <strong>{post.replies}</strong> replies</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}