#!/bin/bash

echo "🔄 Running fresh TypeScript check after Phase 1..."
echo "================================================="

# Clean check
npx tsc --noEmit > fresh-typescript-errors.log 2>&1

# Show current errors
echo "Current TypeScript errors:"
cat fresh-typescript-errors.log

echo ""
echo "Error count: $(cat fresh-typescript-errors.log | grep -c 'error TS')"
