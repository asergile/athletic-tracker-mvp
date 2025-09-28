#!/bin/bash

echo "🎯 Quick Progress Check"
echo "======================"

# Run check
npx tsc --noEmit > quick-check.log 2>&1

current_count=$(cat quick-check.log | grep -c 'error TS')
echo "📊 Current error count: $current_count"
echo "📊 Previous count: 28"
echo "📊 Just fixed: $((28 - current_count))"

echo ""
echo "Next batch of errors to fix:"
head -15 quick-check.log
