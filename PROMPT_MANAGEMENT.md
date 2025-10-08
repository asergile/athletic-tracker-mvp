# Prompt Management System

**Last Updated:** 10/08/25  
**Status:** Active and Production-Ready

## Overview

The Athletic Tracker uses a dynamic prompt management system that separates AI prompts from application code. This allows for version control, A/B testing, and rapid iteration on prompt quality without code changes or redeployments.

## Architecture

### Components

1. **Prompt Storage:** `/prompts/[category]/[version].md`
2. **Prompt Manager:** `/src/lib/prompt-manager.ts`
3. **API Integration:** `/src/app/api/upload/route.ts`

### How It Works

```
Voice Recording → Transcription → Load Prompt → Claude Analysis → Save to DB
                                      ↑
                                Prompt Manager
                                      ↑
                          /prompts/workout-processing/current.md
```

## File Structure

```
athletic-tracker-mvp/
├── prompts/
│   └── workout-processing/
│       ├── current.md          # Active prompt used in production
│       ├── v1.md              # Version archive (future use)
│       └── experimental.md    # Testing variations (future use)
└── src/
    ├── lib/
    │   └── prompt-manager.ts  # Prompt loading and parsing
    └── app/
        └── api/
            └── upload/
                └── route.ts   # Uses PromptManager to load prompts
```

## Prompt File Format

Prompts are stored as markdown files with metadata and the actual prompt text:

```markdown
# Current Workout Processing Prompt

**Version:** 1.0  
**Created:** 09/09/25  
**Purpose:** Convert voice workout transcripts to structured athlete summaries

## Prompt Text

```
[ACTUAL PROMPT CONTENT GOES HERE]
[This is what Claude receives]
```

## Performance Notes
- Cost per workout: ~$0.0015 with Claude Haiku
- Average processing time: 10-15 seconds

## Change Log
- v1.0: Initial version
```

**Key Points:**
- Only text between the ` ``` ` markers is used as the actual prompt
- Everything else is documentation/metadata
- The markdown format makes prompts readable and version-controllable

## Usage

### Loading a Prompt (in code)

```typescript
import { PromptManager } from '@/lib/prompt-manager'

// Load the current version
const prompt = await PromptManager.loadPrompt('workout-processing')

// Load a specific version
const v2Prompt = await PromptManager.loadPrompt('workout-processing', 'v2')

// List all available versions
const versions = await PromptManager.listVersions('workout-processing')
```

### Modifying the Active Prompt

**To change what Claude sees:**

1. Edit `/prompts/workout-processing/current.md`
2. Only modify text between the ` ``` ` code block markers
3. Save the file
4. Changes take effect immediately (no restart needed in production)
5. Dev mode may require restart: `npm run dev`

**Example Change:**

```diff
## Prompt Text

```
You are a swimming workout processor...

-# Swimming Workout Summary
+# Workout Log

## WORKOUT STRUCTURE
...
```
```

### Testing Prompt Changes

1. **Edit the prompt file** directly
2. **Record a test voice note** through the app
3. **Check the analysis output** in `/voice-analysis/[workoutId]`
4. **Iterate** until satisfied with results

## Current Implementation

### Active Prompt Category

**Category:** `workout-processing`  
**Current Version:** `current.md`  
**Model:** Claude 3 Haiku  
**Temperature:** 0.3  
**Max Tokens:** 1500

### What It Does

Converts raw voice transcripts like:

> "We did a 400 free warmup, then the main set was 8 times 50 fly on the minute, I averaged about 45 seconds each, felt pretty good. Then 200 easy cool down."

Into structured markdown:

```markdown
# Swimming Workout Summary

## WORKOUT STRUCTURE

### WARM-UP (400 yards)
- 400 freestyle

### MAIN SET (400 yards)
- 8 × 50 fly @ 1:00
  - Average time: ~45 seconds

### COOL DOWN (200 yards)
- 200 easy (choice)

## WORKOUT METRICS
- **Total Distance:** 1,000 yards
- **Session Rating:** 2/3 (felt pretty good)
- **Primary Focus:** Sprint work
```

## Version Control Strategy

### File Naming Convention

- `current.md` - Active production prompt
- `v1.md`, `v2.md` - Archived versions
- `experimental.md` - Testing new approaches
- `YYYY-MM-DD-description.md` - Dated experiments

### Recommended Workflow

1. **Test changes in `experimental.md`** first
2. **Switch code to load experimental version** for testing
3. **When satisfied, copy to `current.md`**
4. **Archive old version** as `v1.md`, `v2.md`, etc.
5. **Commit all versions** to Git for history

### A/B Testing Setup

To test multiple prompt versions:

```typescript
// In upload/route.ts
const version = Math.random() > 0.5 ? 'current' : 'experimental'
const prompt = await PromptManager.loadPrompt('workout-processing', version)

// Log which version was used for analysis later
console.log(`Using prompt version: ${version}`)
```

## Integration Details

### Where Prompts Are Used

**File:** `/src/app/api/upload/route.ts`  
**Function:** `processWorkoutTranscript()`

```typescript
async function processWorkoutTranscript(transcript: string) {
  // Load prompt dynamically
  let basePrompt: string;
  try {
    basePrompt = await PromptManager.loadPrompt('workout-processing');
  } catch (error) {
    console.error('Failed to load workout processing prompt:', error);
    throw new Error('Prompt loading failed');
  }

  // Add transcript context
  const WORKOUT_ANALYSIS_PROMPT = `${basePrompt}

TRANSCRIPT:
${transcript}`;

  // Send to Claude...
}
```

### Error Handling

- If prompt file is missing → throws error, upload fails gracefully
- If prompt file is malformed → extracts raw markdown as fallback
- Console logs all prompt loading failures for debugging

## Future Extensions

### Potential Categories

```
prompts/
├── workout-processing/      # Current: workout voice notes
├── workout-suggestions/     # Future: training recommendations
├── progress-analysis/       # Future: trend insights
├── technique-feedback/      # Future: form analysis
└── goal-setting/           # Future: personalized goals
```

### Context Injection

Future improvement - pass user context to prompts:

```typescript
const contextualPrompt = `${basePrompt}

CONTEXT:
- Athlete Level: ${athleteLevel}
- Primary Event: ${primaryEvent}
- Season Phase: ${seasonPhase}

TRANSCRIPT:
${transcript}`;
```

## Troubleshooting

### Prompt changes not taking effect

**Cause:** File caching in development mode  
**Fix:** Restart dev server: `npm run dev`

### Wrong prompt file being edited

**Cause:** Multiple projects with similar structure  
**Fix:** Always verify file path:
```bash
/Users/alain/Projects/athletic-tracker-mvp/prompts/workout-processing/current.md
```

### Prompt extraction failing

**Cause:** Malformed markdown code blocks  
**Fix:** Ensure prompt text is between proper ` ``` ` markers

## Key Benefits

✅ **No Code Changes** - Iterate on prompts without touching TypeScript  
✅ **Version Control** - Git tracks all prompt changes  
✅ **Fast Iteration** - Test prompt variations in minutes  
✅ **A/B Testing Ready** - Compare prompt performance easily  
✅ **Deployment Independent** - Update prompts without redeploying  
✅ **Rollback Friendly** - Keep old versions for quick reversion  

## Migration Notes

**Integrated:** 10/08/25  
**Migrated From:** `voice-workout-logger` standalone project  
**Changed:** Original used CommonJS, updated to ES modules for Next.js  
**Previous:** Prompts were hard-coded in API route (65+ lines)  
**Current:** Prompts loaded dynamically from markdown files  

---

**For questions about prompt quality or modifications, edit the markdown files directly. For questions about the system itself, check this documentation or the source code.**
