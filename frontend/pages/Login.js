import React from 'react';

const Login = () => {
    return (
        <div className="login-container">
            <h1>AI Placement Intelligence Platform</h1>
            <form>
                <input type="email" placeholder="Email" required />
                <input type="password" placeholder="Password" required />
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default Login;
