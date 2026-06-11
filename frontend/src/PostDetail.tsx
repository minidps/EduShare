import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PostDetail.css';

interface Reply {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timeAgo: string;
  isPinned?: boolean;
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

interface PostDetailProps {
  forumPosts: ForumPost[];
  userVotes: Record<string, 'up' | 'down' | null>;
  onVote: (postId: string, voteType: 'up' | 'down') => Promise<boolean>;
  onAddReplyCount: (id: string) => void;
  currentUser?: string | null;
}

export default function PostDetail({ forumPosts, userVotes, onVote, onAddReplyCount, currentUser }: PostDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  
  const post = forumPosts.find(p => p.id === id);
  const currentVote = id ? userVotes[id] : null;

  // Автоматично те задаваме като автор на поста, за да работи пинването без лог ин
  const activeUser = currentUser || (post ? post.author : 'dimi');

  const [replies, setReplies] = useState<Reply[]>([
    { id: '1', author: 'AlgeBrah', avatar: '🧙‍♂️', text: 'Closures are amazing once you get the hang of them.', timeAgo: '1 hour ago', isPinned: false },
    { id: '2', author: 'CodeNewbie', avatar: '👨‍💻', text: 'Ah, that makes so much sense! Thanks!', timeAgo: '45 mins ago', isPinned: false }
  ]);

  if (!post) {
    return (
      <div className="post-detail-layout" style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>Post not found</h2>
        <button className="btn-primary" onClick={() => navigate('/forum')}>Back to Forum</button>
      </div>
    );
  }

  // Изчисляване на гласовете в реално време
  const getDisplayedUpvotes = () => {
    let base = post.upvotes;
    if (currentVote === 'up') return base + 1;
    if (currentVote === 'down') return base - 1;
    return base;
  };

  const handleVote = async (type: 'up' | 'down') => {
    await onVote(post.id, type);
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newReply: Reply = {
      id: String(Date.now()),
      author: activeUser,
      avatar: '🎓',
      text: commentText.trim(),
      timeAgo: 'Just now',
      isPinned: false
    };

    setReplies([...replies, newReply]);
    setCommentText('');
    onAddReplyCount(post.id);
  };

  const handleReportPost = () => {
    const reason = prompt('Please enter the reason for reporting this post:');
    if (reason?.trim()) alert('Thank you! This post has been reported.');
  };

  const handleReportReply = (replyId: string, author: string) => {
    const reason = prompt(`Why are you reporting ${author}'s comment?`);
    if (reason?.trim()) alert('Comment has been reported.');
  };

  const handleTogglePin = (replyId: string) => {
    setReplies(prevReplies =>
      prevReplies.map(reply => {
        if (reply.id === replyId) {
          return { ...reply, isPinned: !reply.isPinned };
        }
        return { ...reply, isPinned: false }; // Позволява само един пинат коментар
      })
    );
  };

  // Тъй като activeUser винаги е равен на post.author, това винаги ще е true
  const isPostOwner = post.author === activeUser;

  // Сортиране: Пинатият отива най-отгоре
  const sortedReplies = [...replies].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  return (
    <div className="post-detail-layout animate-fade">
      <button className="back-feed-btn" onClick={() => navigate(-1)}>&larr; Back to Feed</button>

      <div className="thread-main-container">
        <article className="thread-header-card">
          <div className="thread-meta-top">
            <span className="post-category-tag">{post.category}</span>
            <span className="reply-time">{post.timeAgo}</span>
          </div>

          <h2 className="thread-title">{post.title}</h2>

          <div className="post-author-footer" style={{ marginBottom: '1.5rem' }}>
            <span className="author-avatar">{post.avatar}</span>
            <span className="author-name">{post.author}</span>
            {isPostOwner && <span className="owner-badge">Author</span>}
          </div>

          <div 
            className="thread-body-description ql-editor"
            dangerouslySetInnerHTML={{ __html: post.description || "No description provided." }} 
          />

          <div className="post-tags-container" style={{ marginBottom: '1.5rem' }}>
            {post.tags.map(tag => <span key={tag} className="hash-tag">#{tag}</span>)}
          </div>

          <div className="thread-action-bar">
            <div className="thread-voting-actions">
              <button className={`btn-secondary ${currentVote === 'up' ? 'active-upvote' : ''}`} type="button" onClick={() => handleVote('up')}>
                ▲ Upvote
              </button>
              
              <button className={`btn-secondary ${currentVote === 'down' ? 'active-downvote' : ''}`} type="button" onClick={() => handleVote('down')}>
                ▼ Downvote
              </button>

              {/* КОРИГИРАНО: Числото се намира отдясно на бутоните */}
              <span className="detail-vote-count-display">
                {getDisplayedUpvotes()}
              </span>
            </div>
            
            <button className="btn-report-action" type="button" onClick={handleReportPost}>
              🚩 Report Post
            </button>
          </div>
        </article>

        <section className="replies-section-wrapper">
          <h3>Discussion Thread ({replies.length})</h3>
          <div className="replies-stream-box">
            {sortedReplies.map(reply => (
              <div key={reply.id} className={`reply-node-card ${reply.isPinned ? 'pinned-reply-border' : ''}`}>
                <div className="reply-avatar-col">{reply.avatar}</div>
                <div className="reply-content-col">
                  <div className="reply-meta-line">
                    <div className="reply-user-info">
                      <strong>{reply.author}</strong>
                      {reply.isPinned && <span className="pinned-label-badge">📌 Pinned</span>}
                    </div>
                    <span className="reply-time">{reply.timeAgo}</span>
                  </div>
                  <p className="reply-text-paragraph">{reply.text}</p>
                  
                  <div className="reply-actions-footer">
                    {isPostOwner && (
                      <button 
                        type="button" 
                        className={`reply-action-btn pin-toggle-btn ${reply.isPinned ? 'unpin-style' : ''}`}
                        onClick={() => handleTogglePin(reply.id)}
                      >
                        {reply.isPinned ? '📍 Unpin' : '📌 Pin Comment'}
                      </button>
                    )}
                    
                    <button 
                      type="button" 
                      className="reply-action-btn report-toggle-btn"
                      onClick={() => handleReportReply(reply.id, reply.author)}
                    >
                      🚩 Report
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleReplySubmit} className="add-reply-form-node">
            <textarea rows={3} placeholder="Write a response..." value={commentText} onChange={(e) => setCommentText(e.target.value)} required />
            <button type="submit" className="submit-reply-btn">Post Reply</button>
          </form>
        </section>
      </div>
    </div>
  );
}