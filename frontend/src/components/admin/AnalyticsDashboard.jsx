import React, { useState, useEffect } from 'react';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('http://localhost:8000/analytics/outcomes');
                const data = await response.json();
                setStats(data);
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch analytics:', err);
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="loading">Loading intelligence graph data...</div>;

    return (
        <div className="analytics-dashboard">
            <div className="analytics-header">
                <h2>📈 Placement Cell Intelligence</h2>
                <p>Proprietary dataset insights and outcome validation</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <span className="stat-value">{stats?.total_records || 0}</span>
                    <span className="stat-label">Total Validations</span>
                </div>
                <div className="stat-card highlight">
                    <span className="stat-value">{stats?.placement_rate || 0}%</span>
                    <span className="stat-label">Placement Rate</span>
                </div>
                <div className="stat-card">
                    <span className="stat-value">{stats?.average_time_to_offer_days || 0}d</span>
                    <span className="stat-label">Avg. Time to Offer</span>
                </div>
                <div className="stat-card">
                    <span className="stat-value">{stats?.total_placed || 0}</span>
                    <span className="stat-label">Total Hired</span>
                </div>
            </div>

            <div className="moat-section">
                <h3>🛡️ Proprietary Intelligence Graph (The Moat)</h3>
                <div className="moat-grid">
                    <div className="moat-card">
                        <h4>Skill Gaps</h4>
                        <p>Identifying systemic deficiencies across the cohort.</p>
                        <div className="moat-progress"><div className="fill" style={{width: '65%'}}></div></div>
                    </div>
                    <div className="moat-card">
                        <h4>Learning Paths</h4>
                        <p>Analyzing which roadmaps lead to the highest ROI.</p>
                        <div className="moat-progress"><div className="fill" style={{width: '82%'}}></div></div>
                    </div>
                    <div className="moat-card">
                        <h4>Behavior Patterns</h4>
                        <p>Correlating consistency with interview success.</p>
                        <div className="moat-progress"><div className="fill" style={{width: '45%'}}></div></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
