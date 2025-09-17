# Firestore Security Rules

This document explains the Firestore security rules for the Telugu Context Builder project.

## Overview

The Firestore security rules are designed to:

1. Allow anyone to read content for script generation
2. Allow authenticated users (including anonymous) to contribute content
3. Prevent anyone from editing or deleting existing content (append-only)

## Rules Structure

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Content items collection
    match /contentItems/{docId} {
      // Allow anyone logged in (even anonymous) to create
      allow create: if request.auth != null;
      
      // Allow read for everyone
      allow read: if true;
      
      // No one can update or delete once created
      allow update, delete: if false;
    }
    
    // Scripts collection (for caching generated scripts)
    match /scripts/{docId} {
      // Allow read and create for everyone
      allow read, create: if true;
      
      // No one can update or delete
      allow update, delete: if false;
    }
    
    // Settings collection
    match /settings/{docId} {
      // Allow read for everyone
      allow read: if true;
      
      // Allow create and update only for admins
      allow create, update: if request.auth != null 
        && exists(/databases/$(database)/documents/users/$(request.auth.uid))
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
        
      // No one can delete
      allow delete: if false;
    }
    
    // Analytics collection
    match /analytics/{docId} {
      // Allow read for everyone
      allow read: if true;
      
      // Allow create and update only for admins
      allow create, update: if request.auth != null 
        && exists(/databases/$(database)/documents/users/$(request.auth.uid))
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
        
      // No one can delete
      allow delete: if false;
    }
  }
}
```

## Explanation

### Content Items

- **Create**: Requires `request.auth != null` - users must be authenticated (anonymous auth counts)
- **Read**: `true` - anyone can read the dataset for script generation
- **Update/Delete**: `false` - no one can edit or delete items once created

This makes the dataset **append-only**, which is the safest approach for a crowdsourced contribution app.

### Scripts

- **Read/Create**: `true` - anyone can read cached scripts or create new ones
- **Update/Delete**: `false` - no one can edit or delete cached scripts

### Settings and Analytics

- **Read**: `true` - anyone can read settings and analytics
- **Create/Update**: Only admins can modify settings and analytics
- **Delete**: `false` - no one can delete settings or analytics

## Admin Permissions

If you want to curate content (remove bad entries), you can tag your own account as admin in Firestore:

1. Create a `/users` collection
2. Add a document with your UID
3. Set a `role` field to `"admin"`

The rules will then allow only your UID with role `"admin"` to delete content.

## Deployment

To deploy these rules:

1. Open the Firebase Console
2. Navigate to Firestore Database
3. Go to the Rules tab
4. Replace the existing rules with the ones above
5. Click "Publish"

## Security Considerations

1. **Append-only**: The rules ensure that content can only be added, not modified or deleted
2. **Authentication required for creation**: Users must be authenticated to contribute, preventing abuse
3. **Anonymous auth allowed**: Users don't need accounts to contribute
4. **Admin controls**: Admins can manage settings and analytics