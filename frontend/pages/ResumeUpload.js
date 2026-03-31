import React from 'react';

const ResumeUpload = () => {
    return (
        <div className="upload-container">
            <h2>Upload Your Resume</h2>
            <p>Upload your PDF/DOCX to get AI-driven insights.</p>
            <input type="file" accept=".pdf,.doc,.docx" />
            <button>Analyze Resume</button>
        </div>
    );
};

export default ResumeUpload;
