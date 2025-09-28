# Archive Directory

This directory contains files that were removed from the active codebase but preserved for reference.

## test-files/
Development test files that were blocking TypeScript compilation:

- **AuditTest.js** - Component for testing audit logging system functionality
- **ProfileTest.js** - Component for testing profile and workout database operations

**Why archived:** These files were importing from old JavaScript modules (`../lib/supabase.js`) that were converted to TypeScript (`supabase.ts`). They were causing build failures and are not needed for production deployment.

**Date archived:** September 27, 2025  
**Reason:** TypeScript build error resolution - clearing production deployment blockers

If these test components are needed in the future, they would need:
1. Import paths updated to TypeScript modules (`supabase.ts`)
2. TypeScript conversion (.js → .tsx)
3. Proper TypeScript interfaces for all database operations
