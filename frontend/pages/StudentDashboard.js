import React from 'react';

const StudentDashboard = () => {
    return (
        <div className="dashboard">
            <h2>Welcome, Student</h2>
            <div className="stats-grid">
                <div className="stat-card">Resume Score: 85/100</div>
                <div className="stat-card">Placement Probability: High</div>
                <div className="stat-card">Skill Gaps Identified: 3</div>
            </div>
        </div>
    );
};

export default StudentDashboard;
