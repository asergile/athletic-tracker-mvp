#!/bin/bash

echo "🎯 Phase 1 Results Check"
echo "========================"

# Clean run
npx tsc --noEmit > phase1-results.log 2>&1

echo "Remaining TypeScript errors after Phase 1:"
echo "--------------------------------------------"
cat phase1-results.log

echo ""
echo "📊 Error count: $(cat phase1-results.log | grep -c 'error TS')"

echo ""
echo "🏁 Comparison to original 42 errors:"
echo "Original: 42 errors"
echo "Current:  $(cat phase1-results.log | grep -c 'error TS') errors"
echo "Fixed:    $((42 - $(cat phase1-results.log | grep -c 'error TS'))) errors"
