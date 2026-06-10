import React, { useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css'; // Импортираме стиловете на редактора
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
  const [description, setDescription] = useState(''); // Тук ще се пази HTML кода с текста и снимките
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const tagCatalog = [
    'Help', 'ExamReview', 'Notes', 'Homework', 'SAT', 'ACT', 
    'Coding', 'JS', 'React', 'Calculus', 'Algebra', 'Mechanics', 
    'LabReport', 'EssayTips', 'Timeline', 'OrganicChem', 'Genetics'
  ];

  // Настройки на лентата с инструменти (Toolbar) на редактора
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['image', 'link'], // Бутон за добавяне на снимка директно в текста!
      ['clean']
    ],
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
      description, // Предаваме форматирания текст със снимките вътре
      fileName: null, // Вече нямаме нужда от отделен прикачен файл, всичко е в текста
    });
  };

  return (
    <div className="create-post-container animate-fade">
      <div className="create-post-header">
        <h2>Create a New Discussion Post</h2>
        <p>Share questions, code snippets, or imbed images directly inline with your text.</p>
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
            <select id="post-category" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
              <option value="General">General Discussion</option>
            </select>
          </div>

          <div className="form-group flex-1 relative-wrapper">
            <label>Select Tags</label>
            <button type="button" className="custom-dropdown-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <span>{selectedTags.length === 0 ? '-- Open choice catalog dropdown --' : `Selected (${selectedTags.length}) tags`}</span>
              <span className="arrow-indicator">{isDropdownOpen ? '▲' : '▼'}</span>
            </button>

            {isDropdownOpen && (
              <div className="custom-dropdown-menu-overlay">
                {tagCatalog.map(tag => {
                  const isChecked = selectedTags.includes(tag);
                  return (
                    <div key={tag} className={`custom-dropdown-option-row ${isChecked ? 'active-row-selected' : ''}`} onClick={() => toggleTagSelection(tag)}>
                      <span className="dropdown-square-box">{isChecked ? '☑' : '☐'}</span>
                      <span className="dropdown-tag-label-text">#{tag}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

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

        {/* НОВИЯТ ИНЛАЙН РЕДАКТОР ЗА ТЕКСТ И СНИМКИ */}
        <div className="form-group">
          <label>Description & Details </label>
          <div className="quill-editor-wrapper">
            <ReactQuill 
              theme="snow"
              value={description}
              onChange={setDescription}
              modules={quillModules}
              placeholder="Write your explanation here... Click the image button to insert graphics exactly where you need them."
            />
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