# Contribution Guide

Thank you for your interest in contributing to the Telugu Context Builder project! This guide will help you understand how to contribute content and code to the project.

## Content Contribution

### How to Contribute Content

1. Visit the contribution form at `/contribute` on the deployed application
2. Fill in the form with:
   - **Type**: Select whether you're contributing a dialogue, meme, or trend
   - **Content**: The actual dialogue, meme, or trend text
   - **Situation/Context**: Describe when/where this content is typically used
   - **Tags**: Add relevant tags (comma-separated) to help with discoverability

### Content Guidelines

#### Dialogues
- Keep dialogues authentic and culturally relevant to Telugu-speaking audiences
- Include a clear situation/context description
- Use appropriate tags that describe the emotion or scenario

#### Memes
- Focus on popular cultural references that resonate with the community
- Provide context about when the meme is typically used
- Tag appropriately for easy discovery

#### Trends
- Share current social media trends that are relevant to the audience
- Include context about the trend's origin or typical usage
- Use tags to categorize the trend

### Quality Standards

- Ensure all contributions are appropriate for a PG-13 audience
- Avoid offensive or controversial content
- Keep content family-friendly
- Verify that the situation/context descriptions are clear and helpful

## Code Contribution

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/context-builder.git
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file with the required environment variables:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   VITE_OPENAI_KEY=your_openai_api_key
   ```
5. Run the development server:
   ```bash
   npm run dev
   ```

### Code Standards

- Follow the existing code style
- Write clear, descriptive commit messages
- Add tests for new functionality
- Ensure all tests pass before submitting a pull request
- Update documentation as needed

### Pull Request Process

1. Create a new branch for your feature or bug fix
2. Make your changes
3. Write tests if applicable
4. Ensure all tests pass
5. Commit your changes
6. Push to your fork
7. Create a pull request to the main repository

## Testing

### Running Tests

To run the test suite:

```bash
npm test
```

### Writing Tests

- Place test files in the `src/__tests__` directory
- Use Jest for unit tests
- Use React Testing Library for component tests
- Aim for good test coverage

## Reporting Issues

If you find a bug or have a feature request, please open an issue on GitHub with:

- A clear, descriptive title
- A detailed description of the issue
- Steps to reproduce (for bugs)
- Expected vs. actual behavior
- Any relevant screenshots or error messages

## Community

For questions or discussions about contributing, feel free to reach out to the maintainers or participate in the project's discussions.

Thank you for contributing to Telugu Context Builder!