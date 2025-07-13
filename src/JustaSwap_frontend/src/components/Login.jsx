import React from 'react';

const Login = ({ onLogin }) => {
  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Welcome to JustaSwap</h1>
        <p>A MEV-Resistant DEX on Internet Computer</p>
        <button 
          className="login-button"
          onClick={onLogin}
        >
          Login with Internet Identity
        </button>
      </div>
    </div>
  );
};

export default Login;
