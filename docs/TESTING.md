# Testing

This document explains the testing approach for the Telugu Context Builder project.

## Overview

The project uses Jest for unit testing and React Testing Library for component testing. Tests are organized in the `src/__tests__` directory.

## Test Structure

```
src/
└── __tests__/
    ├── contribution.test.js      # Tests for contribution system
    ├── Contribute.test.js        # Tests for Contribute component
    ├── Header.test.js            # Tests for Header component
    └── relevance.test.js         # Tests for relevance utility
```

## Running Tests

To run all tests:

```bash
npm test
```

To run tests in watch mode:

```bash
npm test -- --watch
```

To run tests with coverage:

```bash
npm test -- --coverage
```

## Test Types

### Unit Tests

Unit tests focus on individual functions and utilities:

1. **Relevance Utility**: Tests the `findRelevantItems` function
   - Verifies correct item filtering by type
   - Tests relevance matching accuracy
   - Checks limit parameter functionality

2. **Contribution System**: Tests the contribution system functions
   - Verifies data processing
   - Tests error handling

### Component Tests

Component tests focus on React components:

1. **Contribute Component**: Tests the contribution form
   - Verifies form rendering
   - Checks form field presence
   - Tests form submission

2. **Header Component**: Tests the navigation header
   - Verifies navigation links
   - Checks link destinations

## Writing Tests

### Test File Naming

Test files should be named according to the following conventions:

- Utility function tests: `[filename].test.js`
- Component tests: `[ComponentName].test.js`

### Test Structure

Tests should follow this structure:

```javascript
import { functionToTest } from '../path/to/module';

describe('Module Name', () => {
  test('should do something', () => {
    // Arrange
    const input = 'test input';
    
    // Act
    const result = functionToTest(input);
    
    // Assert
    expect(result).toBe('expected output');
  });
});
```

### Mocking

When testing components that use external dependencies:

1. **Firebase**: Mock Firebase modules using `jest.mock()`
2. **API Calls**: Mock API calls to prevent actual network requests
3. **Context**: Provide mock context values for context-dependent components

### Test Coverage

Aim for the following coverage targets:

- Functions: 80% coverage
- Components: 70% coverage
- Critical paths: 100% coverage

## Continuous Integration

Tests are run automatically in the following scenarios:

1. **Pull Requests**: All tests run when a pull request is created
2. **Merges**: Tests run before merging to main branch
3. **Deployments**: Tests run before deployment

## Test Data

Use realistic test data that reflects actual usage:

1. **Mock Datasets**: Create mock datasets that match real data structure
2. **Edge Cases**: Include edge cases in test data
3. **Invalid Data**: Test with invalid data to verify error handling

## Best Practices

1. **Keep Tests Independent**: Each test should be able to run independently
2. **Use Descriptive Names**: Test names should clearly describe what is being tested
3. **Test One Thing**: Each test should focus on a single behavior
4. **Avoid Implementation Details**: Test behavior, not implementation
5. **Clean Up**: Clean up any test data or state after each test
6. **Use Factories**: Create factory functions for complex test data

## Debugging Tests

When tests fail:

1. **Read Error Messages**: Carefully read the error message and stack trace
2. **Run Single Test**: Run a single test to isolate the issue
3. **Use Console Logs**: Add console.log statements to debug test code
4. **Check Mocks**: Verify that mocks are set up correctly
5. **Review Dependencies**: Check if external dependencies are properly mocked

## Performance

To ensure tests run quickly:

1. **Minimize Setup**: Keep test setup to a minimum
2. **Use Mocks**: Mock external dependencies to avoid slow operations
3. **Parallel Execution**: Run tests in parallel when possible
4. **Avoid Network Calls**: Never make actual network calls in tests

## Future Improvements

Planned testing improvements:

1. **Integration Tests**: Add tests that verify interactions between components
2. **End-to-End Tests**: Implement end-to-end tests using Cypress or similar
3. **Snapshot Tests**: Add snapshot tests for UI components
4. **Performance Tests**: Add performance tests for critical functions
5. **Accessibility Tests**: Add accessibility tests for UI components