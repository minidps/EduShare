import React, { useState } from 'react';
import './PostDetail.css';

interface Reply {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timeAgo: string;
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
  post: ForumPost;
  onBack: () => void;
  onAddReplyCount: (id: string) => void;
}

export default function PostDetail({ post, onBack, onAddReplyCount }: PostDetailProps) {
  const [commentText, setCommentText] = useState('');
  const [replies, setReplies] = useState<Reply[]>([
    { id: '1', author: 'StudyGuru99', avatar: '🦉', text: 'Thanks for bringing this up! I recommend checking the textbook chapter 4 recap section, it helps outline this model clearly.', timeAgo: '1 hour ago' },
    { id: '2', author: 'AlexTutor', avatar: '📝', text: 'Does anyone want to jump into a live Discord study huddle to solve these specific prompt problems together tonight?', timeAgo: '30 mins ago' }
  ]);

  const handleReplySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newReply: Reply = {
      id: String(replies.length + 1),
      author: 'AnonymousStudent',
      avatar: '🎓',
      text: commentText,
      timeAgo: 'Just now'
    };
    setReplies([...replies, newReply]);
    setCommentText('');
    onAddReplyCount(post.id);
  };

  return (
    <div className="post-detail-layout animate-fade">
      <button className="back-feed-btn" onClick={onBack}>&larr; Back to Forum Feed</button>

      <div className="thread-main-container">
        <article className="thread-header-card">
          <div className="thread-meta-top">
            <span className="post-category-tag">{post.category}</span>
            <div className="post-tags-container">
              {post.tags.map(tag => <span key={tag} className="hash-tag">#{tag}</span>)}
            </div>
          </div>

          <h2 className="thread-title-heading">{post.title}</h2>

          <div className="thread-author-profile">
            <span className="profile-avatar">{post.avatar}</span>
            <div className="profile-details-column">
              <strong>{post.author}</strong>
              <span className="profile-subtext">Posted {post.timeAgo}</span>
            </div>
          </div>

          {/* ПОДРЕДЕН ИНЛАЙН ТЕКСТ И СНИМКИ СЕ РЕНДЕРИРАТ ТУК */}
          <div className="thread-body-content rich-text-rendered">
            {post.description ? (
              <div dangerouslySetInnerHTML={{ __html: post.description }} />
            ) : (
              <p>No description provided.</p>
            )}
          </div>

          <div className="thread-action-counters" style={{ marginTop: '1.5rem' }}>
            <span className="counter-item">▲ {post.upvotes} Upvotes</span>
            <span className="counter-item">👁️ {post.views} Views</span>
            <span className="counter-item">💬 {post.replies + replies.length - 2} Replies</span>
          </div>
        </article>

        <section className="replies-section-wrapper">
          <h3>Discussion Thread ({post.replies + replies.length - 2})</h3>
          
          <div className="replies-stream-box">
            {replies.map(reply => (
              <div key={reply.id} className="reply-node-card">
                <div className="reply-avatar-col">{reply.avatar}</div>
                <div className="reply-content-col">
                  <div className="reply-meta-line">
                    <strong>{reply.author}</strong>
                    <span className="reply-time">{reply.timeAgo}</span>
                  </div>
                  <p className="reply-text-paragraph">{reply.text}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleReplySubmit} className="add-reply-form-node">
            <label htmlFor="quick-comment">Join the conversation</label>
            <textarea 
              id="quick-comment"
              rows={3} 
              placeholder="Write a helpful answer or question response here..." 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              required
            ></textarea>
            <button type="submit" className="btn-primary submit-reply-btn">
              Post Reply
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}