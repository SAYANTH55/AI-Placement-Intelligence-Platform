import React from 'react';

const JDInput = () => {
    return (
        <div className="jd-input-container">
            <h2>Enter Job Description</h2>
            <p>Paste the JD below to compare against your profile.</p>
            <textarea placeholder="Paste Job Description here..." rows="10" cols="50"></textarea>
            <button>Match Resume</button>
        </div>
    );
};

export default JDInput;
