#!/bin/bash

echo "=== Deploying JustaSwap with Security Features ==="

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

# Initialize Execution canister with Orderbook principal
echo "Initializing Execution canister with authorized Orderbook..."
dfx canister call Execution initialize "(principal \"$ORDERBOOK_ID\")"

# Initialize Orderbook canister with Execution principal
echo "Initializing Orderbook canister with Execution ID..."
dfx canister call Orderbook initialize "(principal \"$EXECUTION_ID\")"

# Verify initialization
echo ""
echo "Verifying initialization..."
echo "Execution authorized Orderbook:"
dfx canister call Execution getAuthorizedOrderbook
echo "Orderbook Execution canister:"
dfx canister call Orderbook getExecutionCanisterId

# Deploy frontend
echo ""
echo "Deploying frontend..."
dfx deploy JustaSwap_frontend

# Get frontend URL
FRONTEND_ID=$(dfx canister id JustaSwap_frontend)
echo ""
echo "=== Deployment Complete! ==="
echo "Frontend URL: http://localhost:4943/?canisterId=$FRONTEND_ID"
echo ""
echo "Security features implemented:"
echo "✓ Authorization check in Execution canister"
echo "✓ Only Orderbook can call processOrderBatch"
echo "✓ Dynamic canister ID configuration"
echo "✓ One-time initialization pattern"
echo "✓ Mutual authentication between canisters"
