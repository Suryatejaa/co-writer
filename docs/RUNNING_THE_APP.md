# Running the Application

This document explains how to run the Telugu Context Builder application locally.

## Prerequisites

Before running the application, ensure you have the following installed:

1. [Node.js](https://nodejs.org/) (version 14 or higher)
2. [npm](https://www.npmjs.com/) (comes with Node.js)

## Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd context-builder
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_OPENAI_KEY=your_openai_api_key
```

You'll need to create accounts and obtain keys for:

- [Firebase](https://firebase.google.com/)
- [OpenAI](https://openai.com/)

### 4. Firebase Setup

1. Create a Firebase project
2. Enable Firestore Database
3. Enable Anonymous Authentication
4. Deploy the Firestore security rules (see [FIRESTORE_RULES.md](FIRESTORE_RULES.md))
5. Add your Firebase configuration to the `.env` file

### 5. OpenAI Setup

1. Create an OpenAI account
2. Obtain an API key
3. Add your API key to the `.env` file

## Running the Application

### Development Mode

To run the application in development mode:

```bash
npm run dev
```

The application will be available at `http://localhost:5175/` (or the next available port if 5175 is in use).

### Production Build

To create a production build:

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

## Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm run preview`: Preview the production build
- `npm run lint`: Run ESLint
- `npm test`: Run tests (if configured)

## Project Structure

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for details about the project's directory structure.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to the project.

## Troubleshooting

### Common Issues

1. **Port already in use**: If port 5175 is already in use, Vite will automatically try the next available port.

2. **Missing environment variables**: Ensure all required environment variables are set in your `.env` file.

3. **Firebase configuration errors**: Double-check your Firebase configuration values in the `.env` file.

4. **OpenAI API errors**: Verify your OpenAI API key is correct and has sufficient credits.

### Debugging

To enable debug logging, you can add the following to your `.env` file:

```env
DEBUG=true
```

This will enable additional console logging throughout the application.

## Testing

To run tests (if configured):

```bash
npm test
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for more information about testing.