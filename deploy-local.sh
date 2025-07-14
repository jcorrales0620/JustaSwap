#!/bin/bash

echo "=== Deploying JustaSwap ==="

# Start dfx if not already running
if ! dfx ping &> /dev/null; then
    echo "Starting local dfx network..."
    dfx start --clean --background
    sleep 5
fi

# Deploy backend canisters
echo "Deploying backend canisters..."
dfx deploy Orderbook
dfx deploy Execution

# Get canister IDs
ORDERBOOK_ID=$(dfx canister id Orderbook)
EXECUTION_ID=$(dfx canister id Execution)

echo "Canister IDs:"
echo "- Orderbook: $ORDERBOOK_ID"
echo "- Execution: $EXECUTION_ID"

# Deploy frontend
echo "Deploying frontend..."
dfx deploy JustaSwap_frontend

# Get frontend URL
FRONTEND_ID=$(dfx canister id JustaSwap_frontend)
echo ""
echo "=== Deployment Complete! ==="
echo "Frontend URL: http://localhost:4943/?canisterId=$FRONTEND_ID"
echo ""
echo "To test the application:"
echo "1. Open the frontend URL in your browser"
echo "2. Click 'Login with Internet Identity' (uses testnet II)"
echo "3. Create a new identity or use an existing one"
echo "4. Submit a swap order and wait 5 seconds for batch processing"
echo ""
echo "Note: This uses the testnet Internet Identity at https://identity.ic0.app"
