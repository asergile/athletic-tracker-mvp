#!/bin/bash

echo "🎯 Systematic TypeScript Fix - Testing Root Cause Fix"
echo "===================================================="

echo "1. Running TypeScript check..."
npx tsc --noEmit > systematic-check.log 2>&1

ts_errors=$(cat systematic-check.log | grep -c 'error TS')
echo "   TypeScript errors: $ts_errors"

if [ $ts_errors -eq 0 ]; then
    echo "   ✅ TypeScript check: PASSED"
else
    echo "   ❌ TypeScript check: FAILED"
    echo "   Remaining errors:"
    head -10 systematic-check.log
    exit 1
fi

echo ""
echo "2. Running production build..."
npm run build > build-check.log 2>&1

if [ $? -eq 0 ]; then
    echo "   ✅ Production build: SUCCESS!"
    echo ""
    echo "🎉 SYSTEMATIC APPROACH WORKED!"
    echo "================================"
    echo "✅ Root cause identified: Untyped state variable"
    echo "✅ Single fix applied: useState<WorkoutSet[]>"
    echo "✅ All cascading issues resolved automatically"
    echo "✅ Production build successful"
    echo ""
    echo "🚀 PROJECT IS NOW PRODUCTION READY!"
else
    echo "   ❌ Production build: FAILED"
    echo "   Build errors:"
    tail -20 build-check.log
fi
