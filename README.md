# Telugu Context Builder

An AI-powered Telugu-English reel script generator with crowdsourced content contribution.

## Features

- AI-powered script generation for Telugu-English social media reels
- Crowdsourced content contribution system
- Relevance-based matching using Fuse.js
- Firebase integration for data storage and authentication
- Admin dashboard for content management

## Quick Start

1. Visit the home page to generate scripts
2. Enter a topic and click "Generate"
3. Share the `/contribute` link with friends to crowdsource content
4. Admins can manage content through the admin dashboard at `/admin`

## Documentation

- [Running the Application](docs/RUNNING_THE_APP.md) - How to set up and run the application locally
- [Project Structure](docs/PROJECT_STRUCTURE.md) - Overview of the project's directory structure
- [Contribution System](docs/CONTRIBUTION_SYSTEM.md) - Details about the crowdsourced content contribution system
- [AI Service](docs/AI_SERVICE.md) - Information about the AI-powered script generation
- [Firestore Rules](docs/FIRESTORE_RULES.md) - Explanation of Firebase security rules
- [Testing](docs/TESTING.md) - Guide to testing the application
- [Deployment](docs/DEPLOYMENT.md) - Instructions for deploying the application
- [Contributing](docs/CONTRIBUTING.md) - Guidelines for contributing to the project

## Contribution System

### How It Works

Instead of manually maintaining JSON files, this application allows users to contribute content directly through a web form that saves to Firebase Firestore.

### Contribution Form

The contribution form is accessible at `/contribute` and allows users to submit:

- **Dialogues** - Authentic Telugu-English expressions
- **Memes** - Popular cultural references
- **Trends** - Current social media trends

All submissions are saved to the `contentItems` collection in Firestore.

### Firestore Structure

```
contentItems (collection)
├── documentId1
│   ├── type: "dialogue"
│   ├── dialogue: "How you doin?"
│   ├── situation: "when hitting on someone"
│   ├── tags: ["flirt", "friends"]
│   └── createdAt: timestamp
├── documentId2
│   ├── type: "meme"
│   ├── dialogue: "This is fine"
│   ├── situation: "when everything is going wrong"
│   ├── tags: ["reaction", "stress"]
│   └── createdAt: timestamp
└── documentId3
    ├── type: "trend"
    ├── dialogue: "Skibidi Toilet"
    ├── situation: "when something is weird"
    ├── tags: ["weird", "viral"]
    └── createdAt: timestamp
```

### Security Rules

The Firestore security rules ensure:

- Anyone can read the content (for script generation)
- Authenticated users (including anonymous) can create new content
- No one can edit or delete existing content (append-only)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /contentItems/{docId} {
      allow create: if request.auth != null;
      allow read: if true;
      allow update, delete: if false;
    }
  }
}
```

## Development

### Prerequisites

- Node.js
- Firebase account
- OpenAI API key

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Firebase project and add configuration to `.env`
4. Add OpenAI API key to `.env`
5. Deploy Firestore security rules
6. Run the app: `npm run dev`

### Environment Variables

```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_OPENAI_KEY=your_openai_api_key
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](docs/CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License.