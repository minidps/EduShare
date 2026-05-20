import React, { useState } from 'react';
import './CreatePost.css';

interface CreatePostProps {
  categories: string[];
  onCancel: () => void;
  onPublish: (newPostData: {
    title: string;
    category: string;
    tags: string[];
    description: string;
    fileName: string | null;
  }) => void;
}

export default function CreatePost({ categories, onCancel, onPublish }: CreatePostProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Mathematics');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  
  // Custom dropdown display toggle state tracking
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const tagCatalog = [
    'Help', 'ExamReview', 'Notes', 'Homework', 'SAT', 'ACT', 
    'Coding', 'JS', 'React', 'Calculus', 'Algebra', 'Mechanics', 
    'LabReport', 'EssayTips', 'Timeline', 'OrganicChem', 'Genetics'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFileName(e.target.files[0].name);
    }
  };

  const toggleTagSelection = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onPublish({
      title,
      category,
      tags: selectedTags.length > 0 ? selectedTags : ['General'],
      description,
      fileName: attachedFileName,
    });
  };

  return (
    <div className="create-post-container animate-fade">
      <div className="create-post-header">
        <h2>Create a New Discussion Post</h2>
        <p>Share questions, reference material parameters, or study workflows.</p>
      </div>

      <form onSubmit={handleSubmit} className="create-post-form">
        <div className="form-group">
          <label htmlFor="post-title">Post Title</label>
          <input 
            type="text" 
            id="post-title" 
            placeholder="Be specific! E.g., Help calculating standard deviation values" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required 
          />
        </div>

        <div className="form-row">
          <div className="form-group flex-1">
            <label htmlFor="post-category">Subject Category</label>
            <select 
              id="post-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="General">General Discussion</option>
            </select>
          </div>

          {/* Persistent Custom Non-collapsing Multi-select Dropdown Element */}
          <div className="form-group flex-1 relative-wrapper">
            <label>Select Tags</label>
            
            <button 
              type="button" 
              className="custom-dropdown-trigger" 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>
                {selectedTags.length === 0 
                  ? '-- Open choice catalog dropdown --' 
                  : `Selected (${selectedTags.length}) tags`}
              </span>
              <span className="arrow-indicator">{isDropdownOpen ? '▲' : '▼'}</span>
            </button>

            {isDropdownOpen && (
              <div className="custom-dropdown-menu-overlay">
                {tagCatalog.map(tag => {
                  const isChecked = selectedTags.includes(tag);
                  return (
                    <div 
                      key={tag} 
                      className={`custom-dropdown-option-row ${isChecked ? 'active-row-selected' : ''}`}
                      onClick={() => toggleTagSelection(tag)}
                    >
                      <span className="dropdown-square-box">
                        {isChecked ? '☑' : '☐'}
                      </span>
                      <span className="dropdown-tag-label-text">#{tag}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Selected Display Badges View Module */}
        {selectedTags.length > 0 && (
          <div className="form-group">
            <div className="selected-chips-wrapper">
              {selectedTags.map(tag => (
                <span key={tag} className="tag-chip">
                  #{tag}
                  <button type="button" className="chip-clear-x" onClick={() => removeTag(tag)}>&times;</button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="post-description">Description & Details</label>
          <textarea 
            id="post-description" 
            rows={8}
            placeholder="Provide background context here so peers can construct better responses..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          ></textarea>
        </div>

        <div className="form-group">
          <label className="file-upload-label">Attach Resource Files (Optional)</label>
          <div className="file-dropzone">
            <input 
              type="file" 
              id="file-attachments" 
              onChange={handleFileChange}
              className="hidden-file-input"
            />
            <label htmlFor="file-attachments" className="dropzone-trigger-btn">
              {attachedFileName ? `📎 ${attachedFileName}` : '📂 Choose file or drag it here'}
            </label>
          </div>
        </div>

        <div className="create-post-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Publish Post
          </button>
        </div>
      </form>
    </div>
  );
}