import React, { useState } from 'react';

function Login({ onLogin }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await onLogin();
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="w-full group relative px-6 py-4 bg-gradient-to-r from-ic-blue to-ic-purple rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-ic-blue to-ic-purple rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative flex items-center justify-center space-x-3">
          {isLoading ? (
            <>
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span>Connect with Internet Identity</span>
            </>
          )}
        </div>
      </button>
      
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-400">
          By connecting, you agree to our{' '}
          <a href="#" className="text-ic-blue hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-ic-blue hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
