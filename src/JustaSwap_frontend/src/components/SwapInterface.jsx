import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';

const SwapInterface = ({ orderbookActor, principal, ckBTCActor, ckETHActor }) => {
  const [fromToken, setFromToken] = useState('ICP');
  const [toToken, setToToken] = useState('ckBTC');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // New state for balance
  const [balance, setBalance] = useState(0);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);

  // Fetch balance when fromToken or principal changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (!principal) return;

      setIsBalanceLoading(true);
      let actorToCall;

      switch (fromToken) {
        case 'ckBTC':
          actorToCall = ckBTCActor;
          break;
        case 'ckETH':
          actorToCall = ckETHActor;
          break;
        default:
          setBalance(0);
          setIsBalanceLoading(false);
          return;
      }

      try {
        const result = await actorToCall.balanceOf(principal);
        setBalance(Number(result) / 10 ** 8);
      } catch (error) {
        console.error('Failed to fetch balance:', error);
        setBalance(0);
      } finally {
        setIsBalanceLoading(false);
      }
    };

    fetchBalance();
  }, [fromToken, principal, ckBTCActor, ckETHActor]);

  // ... rest of handleSwap and other logic

  return (
    <div className="swap-container">
      <div className="swap-card">
        {/* ... */}
        <div className="swap-form">
          <div className="token-input-group">
            {/* ... */}
            <div className="balance-display">
              Balance: {isBalanceLoading ? 'Loading...' : balance.toFixed(4)}
              <button className="max-button" onClick={() => setAmount(balance.toString())}>
                MAX
              </button>
            </div>
          </div>
          {/* ... */}
        </div>
      </div>
    </div>
  );
};

export default SwapInterface;
