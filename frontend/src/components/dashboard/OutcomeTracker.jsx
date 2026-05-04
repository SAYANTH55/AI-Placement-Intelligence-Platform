import React, { useState } from 'react';
import './OutcomeTracker.css';

const OutcomeTracker = ({ userId }) => {
    const [formData, setFormData] = useState({
        got_placed: true,
        company: '',
        role: '',
        time_to_offer_days: '',
        package: ''
    });
    const [status, setStatus] = useState('idle'); // idle, loading, success, error

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        
        try {
            const response = await fetch('http://localhost:8000/outcomes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: parseInt(userId) || 1, // Default for demo
                    ...formData,
                    time_to_offer_days: parseInt(formData.time_to_offer_days) || 0,
                    package: parseFloat(formData.package) || 0
                })
            });

            if (response.ok) {
                setStatus('success');
                setTimeout(() => setStatus('idle'), 5000);
            } else {
                setStatus('error');
            }
        } catch (err) {
            console.error('Failed to submit outcome:', err);
            setStatus('error');
        }
    };

    return (
        <div className="outcome-tracker">
            <div className="outcome-header">
                <h3>🏆 Record Your Success</h3>
                <span className="outcome-badge">Ground Truth Validation</span>
            </div>
            
            {status === 'success' ? (
                <div className="success-msg">
                    🎉 Congratulatios! Your success helps improve our AI models for everyone.
                </div>
            ) : (
                <form className="outcome-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Did you get placed?</label>
                        <select name="got_placed" value={formData.got_placed} onChange={handleChange}>
                            <option value={true}>Yes, I'm Hired!</option>
                            <option value={false}>Not yet / Exploring</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Company Name</label>
                        <input 
                            type="text" 
                            name="company" 
                            placeholder="e.g. Google, Microsoft"
                            value={formData.company}
                            onChange={handleChange}
                            required={formData.got_placed}
                        />
                    </div>

                    <div className="form-group">
                        <label>Role</label>
                        <input 
                            type="text" 
                            name="role" 
                            placeholder="e.g. Full Stack Developer"
                            value={formData.role}
                            onChange={handleChange}
                            required={formData.got_placed}
                        />
                    </div>

                    <div className="form-group">
                        <label>Time to Offer (Days)</label>
                        <input 
                            type="number" 
                            name="time_to_offer_days" 
                            placeholder="e.g. 45"
                            value={formData.time_to_offer_days}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Annual Package (Optional)</label>
                        <input 
                            type="number" 
                            step="0.1"
                            name="package" 
                            placeholder="LPA"
                            value={formData.package}
                            onChange={handleChange}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="submit-btn" 
                        disabled={status === 'loading'}
                    >
                        {status === 'loading' ? 'Recording...' : 'Update Outcome & Close the Loop'}
                    </button>
                    
                    {status === 'error' && (
                        <p style={{ color: '#ef4444', fontSize: '0.8rem', gridColumn: 'span 2', textAlign: 'center' }}>
                            Failed to record outcome. Please try again.
                        </p>
                    )}
                </form>
            )}
        </div>
    );
};

export default OutcomeTracker;
