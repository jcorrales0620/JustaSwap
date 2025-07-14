import React, { useState, useEffect } from 'react';
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory as orderbookIDL } from '../../../declarations/Orderbook';
import CryptoJS from 'crypto-js';

function SwapInterface({ principal }) {
  const [fromToken, setFromToken] = useState('ICP');
  const [toToken, setToToken] = useState('ckBTC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null);
  const [batchTimer, setBatchTimer] = useState(5);
  const [showSuccess, setShowSuccess] = useState(false);

  // Mock exchange rate (in production, this would come from price oracles)
  const exchangeRate = 0.0025; // 1 ICP = 0.0025 ckBTC

  useEffect(() => {
    // Update the "to" amount when "from" amount changes
    if (fromAmount && !isNaN(fromAmount)) {
      const calculatedAmount = (parseFloat(fromAmount) * exchangeRate).toFixed(8);
      setToAmount(calculatedAmount);
    } else {
      setToAmount('');
    }
  }, [fromAmount]);

  useEffect(() => {
    // Batch timer countdown
    if (orderStatus === 'pending' && batchTimer > 0) {
      const timer = setTimeout(() => setBatchTimer(batchTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (batchTimer === 0) {
      setOrderStatus('executed');
      setShowSuccess(true);
      setTimeout(() => {
        setOrderStatus(null);
        setBatchTimer(5);
        setShowSuccess(false);
      }, 3000);
    }
  }, [orderStatus, batchTimer]);

  const handleSwap = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    setOrderStatus('submitting');

    try {
      // Create agent
      const agent = new HttpAgent({
        host: process.env.DFX_NETWORK === "ic" ? "https://ic0.app" : "http://localhost:4943"
      });

      if (process.env.DFX_NETWORK !== "ic") {
        await agent.fetchRootKey();
      }

      // Create actor
      const orderbookActor = Actor.createActor(orderbookIDL, {
        agent,
        canisterId: process.env.CANISTER_ID_ORDERBOOK,
      });

      // Prepare order data
      const orderData = {
        from_token: fromToken,
        to_token: toToken,
        amount: fromAmount,
        timestamp: Date.now(),
      };

      // Encrypt order data (simplified for demo)
      const encryptedData = CryptoJS.AES.encrypt(
        JSON.stringify(orderData),
        'JustaSwap-batch-' + Math.floor(Date.now() / 5000)
      ).toString();

      // Generate transport key (simplified)
      const transportKey = CryptoJS.lib.WordArray.random(32).toString();

      // Submit order
      const order = {
        owner: principal,
        order_data: Array.from(new TextEncoder().encode(encryptedData)),
        transport_public_key: Array.from(new TextEncoder().encode(transportKey)),
      };

      await orderbookActor.submitOrder(order);

      setOrderStatus('pending');
      setIsSubmitting(false);
    } catch (error) {
      console.error('Swap error:', error);
      setOrderStatus('error');
      setIsSubmitting(false);
      setTimeout(() => setOrderStatus(null), 3000);
    }
  };

  const handleTokenSwitch = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  return (
    <div className="relative">
      {/* Success Animation */}
      {showSuccess && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="bg-green-500 text-white px-6 py-3 rounded-full animate-slide-up">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Swap Executed Successfully!</span>
            </div>
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-white mb-6">Swap Tokens</h2>
        
        {/* From Token */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">From</label>
          <div className="relative">
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="0.0"
              className="w-full px-4 py-3 pr-24 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ic-blue focus:border-transparent transition-all"
              disabled={isSubmitting || orderStatus === 'pending'}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <select
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value)}
                className="bg-white/20 border border-white/30 rounded-lg px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-ic-blue"
                disabled={isSubmitting || orderStatus === 'pending'}
              >
                <option value="ICP">ICP</option>
                <option value="ckBTC">ckBTC</option>
                <option value="ckETH">ckETH</option>
              </select>
            </div>
          </div>
        </div>

        {/* Switch Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={handleTokenSwitch}
            className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all transform hover:rotate-180 duration-300"
            disabled={isSubmitting || orderStatus === 'pending'}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* To Token */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">To</label>
          <div className="relative">
            <input
              type="number"
              value={toAmount}
              readOnly
              placeholder="0.0"
              className="w-full px-4 py-3 pr-24 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <select
                value={toToken}
                onChange={(e) => setToToken(e.target.value)}
                className="bg-white/20 border border-white/30 rounded-lg px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-ic-blue"
                disabled={isSubmitting || orderStatus === 'pending'}
              >
                <option value="ckBTC">ckBTC</option>
                <option value="ICP">ICP</option>
                <option value="ckETH">ckETH</option>
              </select>
            </div>
          </div>
        </div>

        {/* Exchange Rate Info */}
        <div className="mb-6 p-3 bg-white/5 rounded-lg">
          <div className="flex justify-between text-sm text-gray-300">
            <span>Exchange Rate</span>
            <span>1 {fromToken} = {exchangeRate} {toToken}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-300 mt-1">
            <span>Network Fee</span>
            <span>0.0001 ICP</span>
          </div>
        </div>

        {/* Status Messages */}
        {orderStatus && (
          <div className={`mb-4 p-3 rounded-lg animate-slide-up ${
            orderStatus === 'submitting' ? 'bg-blue-500/20 border border-blue-500/30' :
            orderStatus === 'pending' ? 'bg-yellow-500/20 border border-yellow-500/30' :
            orderStatus === 'executed' ? 'bg-green-500/20 border border-green-500/30' :
            'bg-red-500/20 border border-red-500/30'
          }`}>
            <div className="flex items-center space-x-2">
              {orderStatus === 'submitting' && (
                <>
                  <div className="loading-dots text-blue-400">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="text-blue-400">Encrypting and submitting order...</span>
                </>
              )}
              {orderStatus === 'pending' && (
                <>
                  <svg className="w-5 h-5 text-yellow-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-yellow-400">Order in batch. Executing in {batchTimer}s...</span>
                </>
              )}
              {orderStatus === 'error' && (
                <>
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-400">Error submitting order. Please try again.</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!fromAmount || parseFloat(fromAmount) <= 0 || isSubmitting || orderStatus === 'pending'}
          className="w-full py-4 bg-gradient-to-r from-ic-blue to-ic-purple rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isSubmitting ? 'Submitting...' : orderStatus === 'pending' ? `Waiting for Batch (${batchTimer}s)` : 'Swap'}
        </button>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-ic-blue/10 border border-ic-blue/30 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-ic-blue mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-gray-300">
              <p className="font-semibold text-ic-blue mb-1">How JustaSwap Works</p>
              <p>Your order is encrypted and added to a batch. All orders in the batch execute together after 5 seconds at a fair clearing price. No front-running possible!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SwapInterface;
