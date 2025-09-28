#!/bin/bash

echo "🎯 TypeScript Fix Progress Check"
echo "==============================="

# Run fresh check
npx tsc --noEmit > progress-check.log 2>&1

echo "Current errors after Phase 2 fixes:"
echo "-----------------------------------"
head -30 progress-check.log

echo ""
current_count=$(cat progress-check.log | grep -c 'error TS')
echo "📊 Current error count: $current_count"
echo "📊 Original error count: 42"
echo "📊 Fixed so far: $((42 - current_count))"

echo ""
echo "🎯 Next priorities based on remaining errors:"
if [ $current_count -gt 0 ]; then
    echo "- Add explicit types to callback parameters (TS7006 errors)"
    echo "- Fix remaining property mismatches (TS2339 errors)" 
    echo "- Resolve type assignment issues (TS2345 errors)"
else
    echo "🎉 ALL ERRORS FIXED!"
fi
