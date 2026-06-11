import React, { useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import './CreatePost.css';

interface CreatePostProps {
  categories: string[];
  onPublish: (newPostData: {
    title: string;
    category: string;
    tags: string[];
    description: string;
    fileName: string | null;
  }) => void;
  onCancel: () => void;
}

export default function CreatePost({ categories, onPublish, onCancel }: CreatePostProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Mathematics');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const tagCatalog = ['Help', 'ExamReview', 'Notes', 'Homework', 'SAT', 'Coding', 'JS', 'React'];

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['clean']
    ],
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPublish({ title, category, tags: selectedTags, description, fileName: null });
  };

  return (
    <div className="create-post-container">
      <div className="create-post-header">
        <h2>Create a Discussion Thread</h2>
      </div>

      <form onSubmit={handleSubmit} className="create-post-form">
        <div className="form-group">
          <label htmlFor="post-title">Discussion Title</label>
          <input type="text" id="post-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="form-row">
          <div className="form-group flex-1">
            <label htmlFor="post-category">Subject Core Category</label>
            <select id="post-category" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="form-group flex-1" style={{ position: 'relative' }}>
            <label>Topic Sub-Tags</label>
            <div className="custom-multiselect-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              {selectedTags.length === 0 ? 'Select tags...' : `${selectedTags.length} tags selected`}
            </div>

            {isDropdownOpen && (
              <div className="multiselect-dropdown-box">
                {tagCatalog.map(tag => (
                  <div key={tag} className="dropdown-tag-row" onClick={() => toggleTag(tag)}>
                    <input type="checkbox" checked={selectedTags.includes(tag)} readOnly />
                    <span>#{tag}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Description & Details</label>
          <div className="quill-editor-wrapper">
            <ReactQuill theme="snow" value={description} onChange={setDescription} modules={quillModules} />
          </div>
        </div>

        <div className="create-post-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn-primary">Publish Post</button>
        </div>
      </form>
    </div>
  );
}