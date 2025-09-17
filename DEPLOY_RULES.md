# 🚀 URGENT: Fix Firebase Permissions

## ⚡ Quick Fix (5 minutes)

### Step 1: Deploy Firestore Rules 
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **context-builder-1ae32**
3. Click **Firestore Database** → **Rules** tab
4. **Copy-paste** the entire content from your `firestore.rules` file
5. Click **Publish**

### Step 2: Add Admin User
1. In Firebase Console, go to **Firestore Database** → **Data** tab
2. Click **Start collection**
3. Collection ID: `admins`
4. Document ID: `5ewgIB7nkggULU40kJjRNuZZcRl1`
5. Add field: `isAdmin` (boolean) = `true`
6. Click **Save**

### Step 3: Refresh Your App
- The "Missing permissions" errors will disappear
- You'll have full admin access

## ✅ Fixed Issues
- OpenAI API: Updated to use `max_completion_tokens` ✅
- Model: Fixed `gpt-5-nano` to `gpt-4o-mini` ✅
- Waiting for: Firebase rules deployment ⏳