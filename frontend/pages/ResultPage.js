import React from 'react';

const ResultPage = () => {
    return (
        <div className="result-container">
            <h2>Analysis Results</h2>
            <div className="score-section">
                <h3>Overall Match Score: 85%</h3>
                <progress value="85" max="100"></progress>
            </div>
            <div className="insights-section">
                <h4>Top Matching Skills:</h4>
                <ul>
                    <li>Python (High)</li>
                    <li>Machine Learning (Medium)</li>
                </ul>
                <h4>Identified Gaps:</h4>
                <ul>
                    <li>Docker</li>
                    <li>AWS</li>
                </ul>
            </div>
            <button>Download Report</button>
        </div>
    );
};

export default ResultPage;
