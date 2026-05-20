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
    if (!commentText.trim()) return;

    const newReply: Reply = {
      id: String(replies.length + 1),
      author: 'GuestUser',
      avatar: '🎓',
      text: commentText,
      timeAgo: 'Just now'
    };

    setReplies([...replies, newReply]);
    setCommentText('');
    onAddReplyCount(post.id); // Increment total reply indicator numbers inside general layout state
  };

  return (
    <div className="post-detail-layout animate-fade">
      <button className="back-feed-btn" onClick={onBack}>
        &larr; Back to Forum Feed
      </button>

      <div className="thread-main-container">
        {/* Core Original Post Envelope Card */}
        <article className="thread-header-card">
          <div className="thread-meta-top">
            <span className="post-category-tag">{post.category}</span>
            <span className="post-time">{post.timeAgo}</span>
          </div>

          <h1 className="thread-title">{post.title}</h1>

          <div className="thread-author-bar">
            <span className="author-avatar">{post.avatar}</span>
            <div>
              <strong>{post.author}</strong>
              <div className="sub-text">Student Contributor</div>
            </div>
          </div>

          <div className="thread-body-description">
            <p>{post.description || "Looking for input regarding this subject query. Check out the parameters and let me know your thoughts or answers below!"}</p>
          </div>

          {post.fileName && (
            <div className="thread-attachment-box">
              <span className="attachment-icon">📎 Attached Resource:</span>
              <a href="#download" className="attachment-link-file" onClick={(e) => e.preventDefault()}>
                {post.fileName} (Click to View)
              </a>
            </div>
          )}

          <div className="thread-stats-footer">
            <span>▲ {post.upvotes} Upvotes</span>
            <span>👁️ {post.views + 12} Views</span>
            <span>💬 {post.replies + replies.length - 2} Replies</span>
          </div>
        </article>

        {/* Dynamic Interactive Replies Listing Section */}
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

          {/* Form Action Input Node */}
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