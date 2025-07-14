#!/bin/bash

echo "--- DEPLOYING CANISTERS ---"
dfx deploy

# Dapatkan ID canister
ORDERBOOK_ID=$(dfx canister id Orderbook)
EXECUTION_ID=$(dfx canister id Execution)

echo "Orderbook Canister ID: $ORDERBOOK_ID"
echo "Execution Canister ID: $EXECUTION_ID"

# Update the Execution canister ID in Orderbook canister
# For now, we'll need to manually update this in the code

echo "--- SUBMITTING A TEST ORDER ---"
dfx canister call Orderbook submitOrder '
  (record {
    owner = principal "aaaaa-aa";
    order_data = blob "\01\02\03";
    transport_public_key = blob "\04\05\06";
  })
'

echo "--- WAITING FOR 5 SECONDS FOR TIMER TO FIRE ---"
sleep 6

echo "--- CHECKING EXECUTION CANISTER LOGS ---"
# Cara cek log tergantung environment, tapi intinya adalah verifikasi output Debug.print
# Di PocketIC, kita bisa memeriksa state atau output terminal.

echo "--- TEST COMPLETED ---"
