#!/bin/bash

# TYPESCRIPT ERROR DETECTION SCRIPT
# Run comprehensive TypeScript analysis

echo "🔍 COMPREHENSIVE TYPESCRIPT AUDIT"
echo "=================================="

# 1. Check for interface conflicts
echo "1. Checking for interface naming conflicts..."
grep -r "interface " src/ | grep -E "(Event|Workout|Goal)" | head -10

# 2. Check for missing properties
echo -e "\n2. Checking for property mapping issues..."
grep -r "workout_type\|workoutType" src/ | head -5
grep -r "event_date\|eventDate" src/ | head -5

# 3. Check for null vs undefined issues
echo -e "\n3. Checking for null/undefined mismatches..."
grep -r ": null" src/ | head -5
grep -r "| null" src/ | head -5

# 4. Find createWorkout calls
echo -e "\n4. Finding createWorkout usage..."
grep -rn "createWorkout" src/ 

# 5. Find workoutData construction
echo -e "\n5. Finding workoutData object construction..."
grep -rn -A 10 "workoutData.*=" src/

echo -e "\n✅ Audit complete. Check output above for issues."
