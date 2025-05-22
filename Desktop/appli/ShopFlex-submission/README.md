# ShopFlex

A mobile app for e-commerce, connecting buyers and sellers.

## Firebase Security Rules Setup

Update your Firestore security rules in the Firebase console to:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Stores: public read, authenticated create, owner update/delete
    match /stores/{storeId} {
      allow read: if true;  // Public can read stores
      allow create: if request.auth != null && request.resource.data.ownerId == request.auth.uid;
      allow update, delete: if request.auth != null && 
        (request.auth.uid == resource.data.ownerId || request.auth.uid == resource.data.userId);
    }
    
    // Products: public read, authenticated create, owner update/delete
    match /products/{productId} {
      allow read: if true;  // Public can read products
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Users: own profile only
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Also update your Firebase Storage rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;  // Public can view images
      allow write: if request.auth != null;  // Only authenticated users can upload
    }
  }
}
```

## Development

- Run `npx expo start` to start the development server
- Clear cache with `npx expo start -c` if you encounter routing issues
