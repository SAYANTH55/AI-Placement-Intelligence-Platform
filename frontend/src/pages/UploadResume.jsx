import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, File, CheckCircle } from 'lucide-react';
import Card from '../components/common/Card';
import './UploadResume.css';

export default function UploadResume() {
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'application/pdf') {
      setFile(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (file) {
      // API integration will go here
      navigate('/job-input');
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Resume Analysis</h1>
        <p className="page-subtitle">Upload your latest resume to start the intelligence pipeline.</p>
      </div>

      <Card className="upload-card">
        <div 
          className={`upload-zone ${file ? 'has-file' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {file ? (
            <div className="file-success">
              <CheckCircle size={48} className="success-icon" />
              <h3>{file.name}</h3>
              <p>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <button className="btn-secondary mt-16" onClick={() => setFile(null)}>Remove File</button>
            </div>
          ) : (
            <div className="file-prompt">
              <UploadCloud size={64} className="upload-icon" />
              <h3>Drag & Drop your resume</h3>
              <p>Supports .PDF formats up to 5MB</p>
              <div className="divider"><span>OR</span></div>
              <input 
                type="file" 
                id="resume-upload" 
                accept=".pdf" 
                hidden 
                onChange={handleFileSelect}
              />
              <label htmlFor="resume-upload" className="btn-secondary" style={{display: 'inline-flex', cursor: 'pointer'}}>
                 Browse Files
              </label>
            </div>
          )}
        </div>

        <div className="upload-actions">
          <button 
            className="btn-primary" 
            disabled={!file} 
            onClick={handleSubmit}
            style={{ opacity: !file ? 0.5 : 1 }}
          >
             Continue to Job Analysis
          </button>
        </div>
      </Card>
    </div>
  );
}
