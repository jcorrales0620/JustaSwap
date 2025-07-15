import React, { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import Login from './components/Login';
import SwapInterface from './components/SwapInterface';

import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory as idlFactory_ckBTC } from '../../../declarations/ckBTC';
import { canisterId as canisterId_ckBTC } from '../../../declarations/ckBTC';
import { idlFactory as idlFactory_ckETH } from '../../../declarations/ckETH';
import { canisterId as canisterId_ckETH } from '../../../declarations/ckETH';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authClient, setAuthClient] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Actors for canisters
  const [orderbookActor, setOrderbookActor] = useState(null);
  const [ckBTCActor, setCkBTCActor] = useState(null);
  const [ckETHActor, setCkETHActor] = useState(null);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      const client = await AuthClient.create();
      setAuthClient(client);

      const isAuthenticated = await client.isAuthenticated();
      setIsAuthenticated(isAuthenticated);

      if (isAuthenticated) {
        const identity = client.getIdentity();
        setPrincipal(identity.getPrincipal());

        // Create agent with identity
        const agent = new HttpAgent({ identity });

        // Create actors for canisters
        const orderbook = Actor.createActor(
          // Assuming declarations are available
          // Replace with actual import path if different
          require('../../../declarations/Orderbook').idlFactory,
          {
            agent,
            canisterId: require('../../../declarations/Orderbook').canisterId,
          }
        );
        setOrderbookActor(orderbook);

        const ckBTC = Actor.createActor(idlFactory_ckBTC, {
          agent,
          canisterId: canisterId_ckBTC,
        });
        setCkBTCActor(ckBTC);

        const ckETH = Actor.createActor(idlFactory_ckETH, {
          agent,
          canisterId: canisterId_ckETH,
        });
        setCkETHActor(ckETH);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!authClient) return;

    setIsLoading(true);
    try {
      await authClient.login({
        identityProvider:
          process.env.DFX_NETWORK === 'ic'
            ? 'https://identity.ic0.app/#authorize'
            : undefined,
        onSuccess: () => {
          setIsAuthenticated(true);
          const identity = authClient.getIdentity();
          setPrincipal(identity.getPrincipal());
          setIsLoading(false);
        },
        onError: (error) => {
          console.error('Login error:', error);
          setIsLoading(false);
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!authClient) return;

    setIsLoading(true);
    try {
      await authClient.logout();
      setIsAuthenticated(false);
      setPrincipal(null);
      setOrderbookActor(null);
      setCkBTCActor(null);
      setCkETHActor(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ic-dark via-ic-purple to-ic-dark flex items-center justify-center">
        <div className="text-center">
          <div className="loading-dots text-ic-blue text-4xl">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="text-white mt-4 animate-pulse">Initializing JustaSwap...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ic-dark via-ic-purple to-ic-dark">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-ic-blue rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-ic-purple rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow animation-delay-2000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 glass-dark">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/logo2.svg" alt="JustaSwap" className="h-10 w-10" />
              <div>
                <h1 className="text-2xl font-bold text-white">JustaSwap</h1>
                <p className="text-xs text-gray-400">MEV-Resistant DEX on IC</p>
              </div>
            </div>

            {isAuthenticated && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-xs text-gray-400">Connected as</p>
                  <p className="text-sm text-white font-mono">
                    {principal?.toString().slice(0, 8)}...{principal?.toString().slice(-4)}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-200 border border-red-500/30"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-12">
        {!isAuthenticated ? (
          <div className="max-w-md mx-auto">
            <div className="glass rounded-2xl p-8 animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">Welcome to JustaSwap</h2>
                <p className="text-gray-300">
                  The first truly fair DEX. No front-running. No MEV. Just fair trades.
                </p>
              </div>
              <Login onLogin={handleLogin} />

              {/* Features */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center space-x-3 text-gray-300">
                  <svg className="w-5 h-5 text-ic-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Sealed-batch auctions prevent front-running</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <svg className="w-5 h-5 text-ic-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>5-second batch intervals for fair execution</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <svg className="w-5 h-5 text-ic-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Powered by Internet Computer's vetKeys</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <SwapInterface
              principal={principal}
              orderbookActor={orderbookActor}
              ckBTCActor={ckBTCActor}
              ckETHActor={ckETHActor}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-auto border-t border-white/10 glass-dark">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between text-gray-400 text-sm">
            <p>© 2025 JustaSwap - Built for WCHL25 Hackathon</p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <a href="https://github.com/jcorrales0620/JustaSwap" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                GitHub
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Docs
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Whitepaper
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
