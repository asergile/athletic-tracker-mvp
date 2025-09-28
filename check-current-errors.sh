#!/bin/bash

echo "🔍 Current TypeScript Error Check - Post Phase 1"
echo "==============================================="

# Run TypeScript check
npx tsc --noEmit > current-errors.log 2>&1

echo "Current errors:"
head -25 current-errors.log

echo ""
echo "Error count: $(cat current-errors.log | grep -c 'error TS')"

echo ""
echo "📋 Common remaining error patterns:"
grep -o "error TS[0-9]*" current-errors.log | sort | uniq -c | head -10
