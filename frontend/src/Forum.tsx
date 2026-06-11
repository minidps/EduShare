import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  userVotes: Record<string, 'up' | 'down' | null>;
  onVote: (postId: string, voteType: 'up' | 'down') => void;
}

export default function Forum({ categories, forumPosts, userVotes, onVote }: ForumProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  
  const [forumFilter, setForumFilter] = useState<string>('all');
  const [sortTab, setSortTab] = useState<'latest' | 'top' | 'trending'>('latest');
  const [votesRecord, setVotesRecord] = useState<Record<string, 'up' | 'down' | null>>(userVotes);
  
  useEffect(() => {
    setVotesRecord(userVotes);
  }, [userVotes]);

  const getDisplayedUpvotes = (postId: string, baseUpvotes: number) => {
    const vote = votesRecord[postId];
    if (vote === 'up') return baseUpvotes + 1;
    if (vote === 'down') return baseUpvotes - 1;
    return baseUpvotes;
  };

  // Локален стейт за търсене вътре във форума
  const [forumSearch, setForumSearch] = useState<string>('');

  // Четем параметрите от URL адреса при първоначално зареждане
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');

    if (categoryParam) {
      setForumFilter(categoryParam);
    }
    if (searchParam) {
      setForumSearch(searchParam);
    }
  }, [searchParams]);

  const handleVote = (id: string, type: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const currentVote = votesRecord[id];
    const nextVote = currentVote === type ? null : type;

    setVotesRecord(prev => ({
      ...prev,
      [id]: nextVote,
    }));

    onVote(id, type);
  };

  // Филтриране по табове/категории И по ключова дума от търсачката
  const filteredPosts = forumPosts.filter(post => {
      const displayedUpvotes = getDisplayedUpvotes(post.id, post.upvotes);
      // 1. Проверка на левите филтри/категории
      let matchesCategory = true;
      if (forumFilter === 'popular') matchesCategory = displayedUpvotes >= 15;
    else if (forumFilter !== 'all') matchesCategory = post.category.toLowerCase() === forumFilter.toLowerCase();

    // 2. Проверка на търсачката (за заглавие, описание или тагове)
    let matchesSearch = true;
    if (forumSearch.trim() !== '') {
      const query = forumSearch.toLowerCase();
      const inTitle = post.title.toLowerCase().includes(query);
      const inDescription = post.description?.toLowerCase().includes(query) || false;
      const inTags = post.tags.some(tag => tag.toLowerCase().includes(query));
      
      matchesSearch = inTitle || inDescription || inTags;
    }

    return matchesCategory && matchesSearch;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortTab === 'top') return getDisplayedUpvotes(b.id, b.upvotes) - getDisplayedUpvotes(a.id, a.upvotes);
    if (sortTab === 'trending') return b.views - a.views;
    return 0;
  });

  return (
    <div className="forum-page-layout">
      <aside className="forum-sidebar">
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
            <button key={cat} className={`sidebar-link ${forumFilter.toLowerCase() === cat.toLowerCase() ? 'active-sidebar-link' : ''}`} onClick={() => setForumFilter(cat)}>📚 {cat}</button>
          ))}
        </div>
      </aside>

      <div className="forum-main-content-area">
        {/* НОВАТА ИНТЕГРИРАНА ТЪРСАЧКА ВЪВ ФОРУМА */}
        <div className="forum-search-container" style={{ marginBottom: '1rem' }}>
          <input 
            type="text" 
            className="forum-search-input"
            placeholder="🔍 Search posts by title, description or #tags..." 
            value={forumSearch}
            onChange={(e) => {
              setForumSearch(e.target.value);
              // Синхронизираме URL адреса при писане, за да се запазва състоянието
              setSearchParams(prev => {
                if (e.target.value) prev.set('search', e.target.value);
                else prev.delete('search');
                return prev;
              });
            }}
            style={{
              width: '100%',
              padding: '0.75rem 1.25rem',
              fontSize: '1rem',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              outline: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          />
        </div>

        <div className="forum-sort-header-tabs">
          <button className={`sort-tab-btn ${sortTab === 'latest' ? 'active-sort-tab' : ''}`} onClick={() => setSortTab('latest')}>Newest</button>
          <button className={`sort-tab-btn ${sortTab === 'top' ? 'active-sort-tab' : ''}`} onClick={() => setSortTab('top')}>Top Voted</button>
          <button className={`sort-tab-btn ${sortTab === 'trending' ? 'active-sort-tab' : ''}`} onClick={() => setSortTab('trending')}>Trending</button>
        </div>

        <div className="forum-threads-list-stream">
          {sortedPosts.length === 0 ? (
            <div className="empty-forum-state" style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
              <h3>No results matched your search criteria</h3>
              <p>Try searching for alternative keywords or clear the search input.</p>
            </div>
          ) : (
            sortedPosts.map(post => {
              const userVoteStatus = votesRecord[post.id];
              return (
                <div key={post.id} className="forum-post-row-card interactive-row" onClick={() => navigate(`/post/${post.id}`)}>
                  <div className="post-voting-sidebar-block">
                    <button className={`vote-btn ${userVoteStatus === 'up' ? 'active-upvote' : ''}`} onClick={(e) => handleVote(post.id, 'up', e)}>▲</button>
                    <span className={`vote-count ${userVoteStatus ? 'voted-count' : ''}`}>{getDisplayedUpvotes(post.id, post.upvotes)}</span>
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