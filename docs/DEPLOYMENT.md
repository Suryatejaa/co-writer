# Deployment

This document explains how to deploy the Telugu Context Builder application.

## Overview

The application can be deployed to various hosting platforms. The recommended approach is to use Firebase Hosting for the frontend and Firebase Functions for any backend functionality.

## Prerequisites

Before deploying, ensure you have:

1. A Firebase project
2. Firebase CLI installed (`npm install -g firebase-tools`)
3. All environment variables configured
4. Firestore security rules deployed

## Building the Application

First, create a production build:

```bash
npm run build
```

This will generate optimized files in the `dist/` directory.

## Firebase Deployment

### 1. Initialize Firebase

If you haven't already, initialize Firebase in your project:

```bash
firebase login
firebase init
```

Select the following features:
- Firestore
- Hosting
- Functions (if needed)

### 2. Configure Firebase Hosting

Update `firebase.json` to configure hosting:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### 3. Deploy to Firebase

Deploy the application:

```bash
firebase deploy
```

This will deploy both the frontend and Firestore rules.

## Environment Variables

Ensure all environment variables are set in the production environment:

```env
VITE_FIREBASE_API_KEY=your_production_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_production_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_production_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_production_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_production_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_production_firebase_app_id
VITE_OPENAI_KEY=your_production_openai_api_key
```

For Firebase Hosting, you can set environment variables in the Firebase Console or use a `.env.production` file.

## Alternative Deployment Options

### Vercel

1. Push your code to a Git repository
2. Connect the repository to Vercel
3. Configure environment variables in the Vercel dashboard
4. Deploy

### Netlify

1. Push your code to a Git repository
2. Connect the repository to Netlify
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Configure environment variables in the Netlify dashboard
5. Deploy

### Custom Server

To deploy to a custom server:

1. Build the application: `npm run build`
2. Upload the contents of the `dist/` directory to your server
3. Configure your web server to serve `index.html` for all routes (SPA routing)
4. Set environment variables on your server

## Domain Configuration

To use a custom domain:

### Firebase Hosting

1. In the Firebase Console, go to Hosting settings
2. Add your custom domain
3. Follow the instructions to verify domain ownership
4. Update your DNS records as instructed

### Other Platforms

Follow the domain configuration instructions for your chosen platform.

## SSL Certificate

Most modern hosting platforms (including Firebase Hosting, Vercel, and Netlify) automatically provision SSL certificates for custom domains.

## Monitoring and Analytics

The application includes Firebase Analytics for monitoring usage:

1. View analytics in the Firebase Console
2. Set up custom events for specific user actions
3. Monitor performance and usage patterns

## Error Tracking

The application includes basic error logging to the console. For production, consider integrating with error tracking services like:

1. Sentry
2. Rollbar
3. Firebase Crashlytics

## Performance Optimization

The production build includes several optimizations:

1. **Code Splitting**: Code is split into chunks for faster loading
2. **Minification**: JavaScript and CSS are minified
3. **Compression**: Assets are compressed
4. **Caching**: Static assets are cached

## Security Considerations

1. **Environment Variables**: Never commit sensitive environment variables to version control
2. **Firestore Rules**: Ensure Firestore security rules are properly configured
3. **API Keys**: Protect API keys and use them appropriately
4. **Content Security**: Implement content security policies

## Backup and Recovery

1. **Firestore Backups**: Set up regular Firestore backups in the Firebase Console
2. **Code Backups**: Use version control (Git) for code backups
3. **Environment Variables**: Keep a secure backup of environment variables

## Scaling

The application is designed to scale:

1. **Firestore**: Automatically scales with usage
2. **Hosting**: Served via CDN for global distribution
3. **Functions**: Can be scaled automatically (if using Firebase Functions)

## Maintenance

Regular maintenance tasks:

1. **Dependency Updates**: Regularly update dependencies
2. **Security Audits**: Run security audits using `npm audit`
3. **Performance Monitoring**: Monitor application performance
4. **Backup Verification**: Verify backups are working correctly

## Troubleshooting

Common deployment issues:

1. **Environment Variables**: Ensure all required environment variables are set
2. **Firebase Configuration**: Verify Firebase configuration values
3. **Routing Issues**: Ensure SPA routing is properly configured
4. **Build Errors**: Check build logs for errors

## Rollback

To rollback to a previous version:

1. **Firebase**: Use `firebase hosting:rollback` to rollback to a previous deployment
2. **Other Platforms**: Use the platform's rollback feature or redeploy a previous version

## CI/CD

For continuous integration and deployment:

1. **GitHub Actions**: Set up GitHub Actions workflows
2. **Firebase CI**: Use Firebase CLI in CI environment
3. **Automated Testing**: Run tests before deployment
4. **Environment Branches**: Use different environments for different branches

## Future Improvements

Planned deployment improvements:

1. **Automated Deployments**: Set up automated deployments on code push
2. **Staging Environment**: Create a separate staging environment
3. **Blue-Green Deployment**: Implement blue-green deployment strategy
4. **Canary Releases**: Implement canary releases for new features