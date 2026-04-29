import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, info: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error("ErrorBoundary Caught:", error, info);
        this.setState({ info });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ color: '#F87171', padding: '40px', background: '#0A0A0A', height: '100vh', width: '100vw', overflow: 'auto', fontFamily: 'monospace' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>UI Crash Detected</h1>
                    <div style={{ padding: '20px', background: '#1A1A1A', borderRadius: '12px', border: '1px solid #333' }}>
                        <p style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '10px' }}>{this.state.error?.message}</p>
                        <pre style={{ whiteSpace: 'pre-wrap', color: '#888', fontSize: '12px' }}>{this.state.error?.stack}</pre>
                        <hr style={{ borderColor: '#333', margin: '20px 0' }} />
                        <pre style={{ whiteSpace: 'pre-wrap', color: '#F97316', fontSize: '12px' }}>{this.state.info?.componentStack}</pre>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
