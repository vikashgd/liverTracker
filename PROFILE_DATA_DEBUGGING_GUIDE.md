# Profile Data Not Showing - Debugging Guide

## Issue Description
User reports that pre-submitted profile information is not showing on the profile page at `http://192.168.1.2:3000/profile`, even though the data was previously submitted.

## Debugging Steps Added

### 1. Enhanced Client-Side Logging
**File:** `web/src/components/patient-profile-form.tsx`

Added comprehensive console logging to track:
- Profile loading process
- API response status and data
- Profile data being set in state
- Any errors during the loading process

**Debug Console Messages:**
- `🔍 Loading profile data...`
- `📡 Profile API response status: [status]`
- `📊 Profile API response data: [data]`
- `✅ Setting profile data: [profile]`
- `⚠️ No profile data found in response`
- `❌ Profile API error: [error]`

### 2. Development Debug Panel
Added a debug information panel that shows (only in development mode):
- Current profile data loaded
- Whether there are unsaved changes
- Loading and saving states
- Complete profile object structure

### 3. Enhanced Server-Side Logging
**File:** `web/src/app/api/profile/route.ts`

Added detailed server-side logging to track:
- Profile GET requests
- Session validation
- Database queries
- User and profile data retrieval
- Response data being sent

**Debug Console Messages:**
- `🔍 Profile GET request received`
- `👤 Session user: [email]`
- `👤 Found user: [userId]`
- `📊 User profile: [profileData]`
- `✅ Returning profile data: [response]`

## How to Debug

### Step 1: Check Browser Console
1. Open the profile page: `http://192.168.1.2:3001/profile`
2. Open browser Developer Tools (F12)
3. Go to Console tab
4. Look for the debug messages starting with emojis

### Step 2: Check Server Console
1. Look at the terminal where `npm run dev` is running
2. Check for server-side debug messages when the profile page loads
3. Look for any error messages

### Step 3: Check Debug Panel
1. On the profile page, scroll to see the gray debug panel (development only)
2. Check if profile data is loaded correctly
3. Verify the profile object structure

## Common Issues and Solutions

### Issue 1: Profile Data Not Loading
**Symptoms:** Debug shows "No profile data found in response"
**Possible Causes:**
- User doesn't have a profile record in database
- Database connection issues
- Session authentication problems

**Solution:** Check server logs for database errors

### Issue 2: Profile Data Loading But Not Displaying
**Symptoms:** Debug shows profile data loaded, but form fields are empty
**Possible Causes:**
- Date format conversion issues
- Field name mismatches between API and form
- React state update problems

**Solution:** Check the debug panel to see exact data structure

### Issue 3: Authentication Issues
**Symptoms:** "Unauthorized" or "User not found" errors
**Possible Causes:**
- Session expired
- User not properly authenticated
- Database user record missing

**Solution:** Check session data in server logs

## Database Schema Reference

The `PatientProfile` model includes these fields:
- `dateOfBirth` (DateTime)
- `gender` (String)
- `height` (Float)
- `weight` (Float)
- `onDialysis` (Boolean)
- `liverDiseaseType` (String)
- `diagnosisDate` (DateTime)
- `primaryPhysician` (String)
- `emergencyContactName` (String)
- `emergencyContactPhone` (String)
- `preferredUnits` (String)
- `timezone` (String)
- `ascites` (String)
- `encephalopathy` (String)
- And more...

## Next Steps

1. **Visit the profile page** and check browser console for debug messages
2. **Check server terminal** for API debug logs
3. **Review debug panel** to see loaded data structure
4. **Report findings** - share console logs and debug panel information

## Temporary Debug Mode

The debug logging and panel will help identify exactly where the issue is occurring:
- If no API call is made → Client-side routing issue
- If API call fails → Server/database issue  
- If API succeeds but no data → Database query issue
- If data loads but doesn't display → Form rendering issue

Once we identify the specific issue, we can implement the appropriate fix and remove the debug code.

## Status: 🔍 DEBUGGING ACTIVE

Debug logging is now active. Please visit the profile page and share the console output to help identify the root cause of the missing profile data.