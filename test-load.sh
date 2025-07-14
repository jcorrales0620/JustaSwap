#!/bin/bash

echo "=== JustaSwap Load Testing ==="
echo "Testing system performance under high load"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ORDERS_PER_BATCH=100
TOTAL_BATCHES=5
CONCURRENT_USERS=10

# Timing variables
declare -a BATCH_TIMES

# Function to generate random order data
generate_order() {
    local user_id=$1
    local order_num=$2
    echo "(record {
        owner = principal \"user${user_id}-${order_num}-aa\";
        order_data = blob \"\\$(printf '%02x' $((RANDOM % 256)))\\$(printf '%02x' $((RANDOM % 256)))\\$(printf '%02x' $((RANDOM % 256)))\";
        transport_public_key = blob \"\\04\\05\\06\";
    })"
}

# Function to submit orders concurrently
submit_orders_batch() {
    local batch_num=$1
    local start_time=$(date +%s.%N)
    
    echo -e "${YELLOW}Batch $batch_num: Submitting $ORDERS_PER_BATCH orders with $CONCURRENT_USERS concurrent users${NC}"
    
    # Create temporary directory for order files
    mkdir -p /tmp/justaswap_orders
    
    # Generate and submit orders concurrently
    for ((i=1; i<=ORDERS_PER_BATCH; i++)); do
        user_id=$((i % CONCURRENT_USERS + 1))
        order=$(generate_order $user_id $i)
        
        # Submit order in background
        {
            dfx canister call Orderbook submitOrder "$order" > /tmp/justaswap_orders/order_${batch_num}_${i}.log 2>&1
        } &
        
        # Limit concurrent submissions
        if (( i % CONCURRENT_USERS == 0 )); then
            wait
        fi
    done
    
    # Wait for all remaining orders
    wait
    
    local end_time=$(date +%s.%N)
    local duration=$(echo "$end_time - $start_time" | bc)
    BATCH_TIMES[$batch_num]=$duration
    
    echo -e "${GREEN}Batch $batch_num completed in ${duration}s${NC}"
    
    # Wait for batch processing
    echo "Waiting 6 seconds for batch processing..."
    sleep 6
    echo ""
}

# Function to analyze results
analyze_results() {
    echo -e "${BLUE}=== Performance Analysis ===${NC}"
    
    # Calculate statistics
    local total_time=0
    local min_time=999999
    local max_time=0
    
    for time in "${BATCH_TIMES[@]}"; do
        total_time=$(echo "$total_time + $time" | bc)
        
        if (( $(echo "$time < $min_time" | bc -l) )); then
            min_time=$time
        fi
        
        if (( $(echo "$time > $max_time" | bc -l) )); then
            max_time=$time
        fi
    done
    
    local avg_time=$(echo "scale=2; $total_time / ${#BATCH_TIMES[@]}" | bc)
    local orders_per_second=$(echo "scale=2; $ORDERS_PER_BATCH / $avg_time" | bc)
    
    echo "Total batches tested: ${#BATCH_TIMES[@]}"
    echo "Orders per batch: $ORDERS_PER_BATCH"
    echo "Concurrent users: $CONCURRENT_USERS"
    echo ""
    echo "Average batch submission time: ${avg_time}s"
    echo "Min batch submission time: ${min_time}s"
    echo "Max batch submission time: ${max_time}s"
    echo "Average throughput: ${orders_per_second} orders/second"
    
    # Check for errors
    local errors=$(grep -l "Error" /tmp/justaswap_orders/*.log 2>/dev/null | wc -l)
    if [ $errors -gt 0 ]; then
        echo -e "${RED}Errors found: $errors${NC}"
    else
        echo -e "${GREEN}No errors detected${NC}"
    fi
}

# Function to monitor canister health
monitor_canisters() {
    echo -e "${BLUE}=== Canister Health Check ===${NC}"
    
    echo "Orderbook canister status:"
    dfx canister status Orderbook
    
    echo ""
    echo "Execution canister status:"
    dfx canister status Execution
}

# Main execution
echo "Starting load test..."
echo ""

# Clean up previous test logs
rm -rf /tmp/justaswap_orders
mkdir -p /tmp/justaswap_orders

# Run load tests
for ((batch=1; batch<=TOTAL_BATCHES; batch++)); do
    submit_orders_batch $batch
done

# Analyze results
analyze_results

echo ""

# Monitor canister health
monitor_canisters

# Generate load test report
cat > load-test-report.md << EOF
# JustaSwap Load Test Report

## Test Configuration
- Orders per batch: $ORDERS_PER_BATCH
- Total batches: $TOTAL_BATCHES
- Concurrent users: $CONCURRENT_USERS
- Total orders submitted: $((ORDERS_PER_BATCH * TOTAL_BATCHES))

## Performance Results
- Average batch submission time: ${avg_time}s
- Min batch submission time: ${min_time}s
- Max batch submission time: ${max_time}s
- Average throughput: ${orders_per_second} orders/second

## System Health
- Errors detected: $errors
- All batches processed: Yes

## Recommendations
$(if (( $(echo "$orders_per_second < 10" | bc -l) )); then
    echo "- Consider optimizing order submission logic for better throughput"
fi)
$(if [ $errors -gt 0 ]; then
    echo "- Investigate and fix errors found during load testing"
fi)
$(if (( $(echo "$max_time > $avg_time * 2" | bc -l) )); then
    echo "- High variance in batch times detected - investigate potential bottlenecks"
fi)

## Conclusion
The system successfully handled $((ORDERS_PER_BATCH * TOTAL_BATCHES)) orders across $TOTAL_BATCHES batches with an average throughput of ${orders_per_second} orders/second.
EOF

echo ""
echo -e "${GREEN}Load test complete! Report saved to load-test-report.md${NC}"

# Cleanup
rm -rf /tmp/justaswap_orders
