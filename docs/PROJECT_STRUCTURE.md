# Project Structure

This document explains the directory structure and key files of the Telugu Context Builder project.

## Directory Structure

```
context-builder/
├── docs/                    # Documentation files
│   ├── CONTRIBUTING.md     # Contribution guidelines
│   ├── FIRESTORE_RULES.md  # Firestore security rules
│   └── PROJECT_STRUCTURE.md # This file
├── public/                 # Public assets
│   └── data/              # Legacy JSON data files
│       ├── dialogues.json
│       ├── memes.json
│       └── trends.json
├── src/                    # Source code
│   ├── __tests__/         # Test files
│   ├── components/        # React components
│   ├── context/           # React context providers
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page components
│   ├── services/          # Service modules
│   ├── utils/             # Utility functions
│   ├── App.css            # Main CSS file
│   ├── App.jsx            # Main App component
│   ├── cyberpunk-theme.css # Cyberpunk theme styles
│   ├── firebase.js        # Firebase configuration
│   ├── index.css          # Global CSS
│   └── main.jsx           # Entry point
├── index.html             # HTML template
├── package.json           # Project dependencies and scripts
├── README.md              # Project README
├── vite.config.js         # Vite configuration
└── ...                    # Other configuration files
```

## Key Files

### src/App.jsx

The main application component that sets up routing and context providers.

### src/firebase.js

Firebase configuration and initialization, including:
- Firebase app initialization
- Authentication setup (anonymous sign-in)
- Firestore configuration
- Analytics setup
- Helper functions for Firestore operations

### src/pages/Home.jsx

The main page that displays the script generator and header.

### src/pages/Contribute.jsx

The contribution form page that allows users to submit new content.

### src/pages/Admin.jsx

The admin dashboard for managing content and viewing analytics.

### src/components/Generator.jsx

The main script generator component that:
- Fetches data from Firestore
- Uses relevance matching to find relevant content
- Generates scripts using AI or rule-based fallback
- Handles caching of generated scripts

### src/components/Header.jsx

The navigation header component used across all pages.

### src/services/aiService.js

AI service that handles:
- OpenAI API calls
- Script generation with relevance matching
- Fallback rule-based generation
- Celtx format conversion
- Usage tracking

### src/utils/relevance.js

Utility functions for relevance matching using Fuse.js:
- `findRelevantItems`: Finds relevant items from a dataset based on user prompt

### src/__tests__/

Test files for various components and utilities:
- Contribution system tests
- Component tests
- Utility function tests

## Data Flow

1. **Content Contribution**: Users submit content via the contribution form (`/contribute`)
2. **Data Storage**: Content is stored in Firestore `contentItems` collection
3. **Data Retrieval**: Generator fetches content from Firestore
4. **Relevance Matching**: `findRelevantItems` finds relevant content based on user topic
5. **Script Generation**: AI service generates scripts using relevant content
6. **Caching**: Generated scripts are cached in Firestore `scripts` collection
7. **Display**: Generated scripts are displayed to the user

## Firestore Collections

### contentItems

Stores user-contributed content:
- `type`: "dialogue" | "meme" | "trend"
- `dialogue`: The content text
- `situation`: Context/situation description
- `tags`: Array of tags
- `createdAt`: Timestamp

### scripts

Stores cached generated scripts:
- `topic`: Generation topic
- `batch`: Array of generated scripts
- `createdAt`: Timestamp
- `expiresAt`: Expiration timestamp

### settings

Stores application settings:
- `useAI`: Boolean for AI mode
- `updatedAt`: Timestamp

### analytics

Stores usage analytics:
- `scriptsGenerated`: Counter
- `aiModeUsage`: Counter
- `ruleModeUsage`: Counter
- `datasetHits`: Counter
- `datasetMisses`: Counter
- `lastUpdated`: Timestamp

### users

Stores user information (admin management):
- `role`: User role ("admin" for administrators)