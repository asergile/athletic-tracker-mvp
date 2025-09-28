#!/bin/bash

echo "🔍 COMPREHENSIVE TypeScript Error Analysis"
echo "=========================================="
echo ""

# Method 1: TypeScript compiler check (most comprehensive)
echo "📋 Method 1: Full TypeScript Compilation Check"
echo "----------------------------------------------"
npx tsc --noEmit --pretty false 2>&1 | tee typescript-errors.log

echo ""
echo "📋 Method 2: Next.js Build Check"
echo "--------------------------------"
npm run build 2>&1 | tee build-errors.log

echo ""
echo "📋 Method 3: TypeScript Language Server Check"
echo "--------------------------------------------"
npx tsc --listFiles --noEmit > /dev/null 2>&1
echo "Files being checked: $(npx tsc --listFiles --noEmit 2>/dev/null | wc -l) TypeScript files"

echo ""
echo "📊 Error Summary:"
echo "=================="
echo "TypeScript errors logged to: typescript-errors.log"
echo "Build errors logged to: build-errors.log"
echo ""
echo "🎯 Next Steps:"
echo "1. Review typescript-errors.log for ALL TypeScript issues"
echo "2. Review build-errors.log for build-specific issues"
echo "3. Fix errors systematically by file/category"
echo "4. Re-run this script to verify fixes"
