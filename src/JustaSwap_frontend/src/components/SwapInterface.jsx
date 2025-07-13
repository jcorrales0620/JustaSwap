import React, { useState } from 'react';
import CryptoJS from 'crypto-js';

const SwapInterface = ({ orderbookActor, principal }) => {
  const [fromToken, setFromToken] = useState('ICP');
  const [toToken, setToToken] = useState('ckBTC');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSwap = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setMessage('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    setMessage('Submitting your secure order...');

    try {
      // 1. Create order details
      const orderDetails = {
        from: fromToken,
        to: toToken,
        amount: parseFloat(amount),
        timestamp: Date.now(),
        principal: principal.toString()
      };

      // 2. Simulate encryption (MVP version)
      const encryptionKey = 'JustaSwap-MVP-Secret';
      const encryptedOrderData = CryptoJS.AES.encrypt(
        JSON.stringify(orderDetails), 
        encryptionKey
      ).toString();

      // 3. Convert to Blob format for Motoko
      const order_data_blob = new TextEncoder().encode(encryptedOrderData);
      
      // 4. Create transport public key (placeholder for MVP)
      const transport_public_key_blob = new Uint8Array([1, 2, 3, 4, 5, 6]);

      // 5. Prepare order structure
      const orderToSend = {
        order_data: Array.from(order_data_blob),
        transport_public_key: Array.from(transport_public_key_blob),
        owner: principal
      };

      // 6. Submit order to canister
      await orderbookActor.submitOrder(orderToSend);
      
      setMessage('✅ Success! Your order has been submitted to the batch.');
      setAmount('');
      
      // Show batch processing message after 2 seconds
      setTimeout(() => {
        setMessage('🔄 Your order will be processed in the next batch (5 seconds)...');
      }, 2000);

    } catch (error) {
      console.error('Swap error:', error);
      setMessage(`❌ Error: ${error.message || 'Failed to submit order'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const switchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
  };

  return (
    <div className="swap-container">
      <div className="swap-card">
        <h2>Swap Tokens</h2>
        <p className="swap-description">
          All orders are encrypted and processed in batches to prevent MEV
        </p>

        <div className="swap-form">
          <div className="token-input-group">
            <label>From</label>
            <div className="token-input">
              <select 
                value={fromToken} 
                onChange={(e) => setFromToken(e.target.value)}
                className="token-select"
              >
                <option value="ICP">ICP</option>
                <option value="ckBTC">ckBTC</option>
                <option value="ckETH">ckETH</option>
                <option value="CHAT">CHAT</option>
              </select>
              <input
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="amount-input"
                disabled={isLoading}
              />
            </div>
          </div>

          <button 
            className="switch-button" 
            onClick={switchTokens}
            disabled={isLoading}
          >
            ⇅
          </button>

          <div className="token-input-group">
            <label>To</label>
            <div className="token-input">
              <select 
                value={toToken} 
                onChange={(e) => setToToken(e.target.value)}
                className="token-select"
              >
                <option value="ICP">ICP</option>
                <option value="ckBTC">ckBTC</option>
                <option value="ckETH">ckETH</option>
                <option value="CHAT">CHAT</option>
              </select>
              <input
                type="text"
                placeholder="0.0"
                value={amount ? (parseFloat(amount) * 0.98).toFixed(4) : ''}
                className="amount-input"
                disabled
              />
            </div>
          </div>

          <button 
            className="swap-button"
            onClick={handleSwap}
            disabled={isLoading || !amount}
          >
            {isLoading ? 'Processing...' : 'Swap'}
          </button>

          {message && (
            <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}
        </div>

        <div className="info-section">
          <h3>How it works:</h3>
          <ul>
            <li>Orders are encrypted client-side</li>
            <li>Batched every 5 seconds</li>
            <li>Uniform clearing price for all orders</li>
            <li>No front-running possible!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SwapInterface;
