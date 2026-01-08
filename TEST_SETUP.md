# Test Setup for Generator Component

This document explains how to set up and run tests for the `handleMagicEnhance` function fix.

## Installation

To run the tests, you'll need to install the testing dependencies:

```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom --legacy-peer-deps
```

**Note:** The `--legacy-peer-deps` flag is required due to a peer dependency conflict with `react-helmet-async` (which expects React 18, but the project uses React 19). This is safe to use and won't affect functionality.

## Running Tests

Once dependencies are installed, you can run tests with:

```bash
# Run tests once
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Coverage

The test suite (`src/pages/Generator.test.jsx`) covers:

### 1. Image Transformation Flow (Priority 1)
- ✅ Transform image when referenceImage and activeStyleId exist
- ✅ Show error when referenceImage exists but no style is selected
- ✅ Show error when style is missing instructions
- ✅ Handle transformImage API failure gracefully
- ✅ Handle transformImage returning no imageUrl
- ✅ Validate referenceImage is non-empty string

### 2. Prompt Transformation Flow (Priority 2)
- ✅ Transform prompt when prompt exists and no referenceImage
- ✅ Handle empty prompt result from transformPrompt
- ✅ Not transform prompt when referenceImage exists (priority check)

### 3. Standard Enhancement Flow (Priority 3)
- ✅ Use standard enhancement when prompt exists but no style

### 4. Edge Cases and Validation
- ✅ Return early if both prompt and referenceImage are empty
- ✅ Handle whitespace-only strings correctly
- ✅ Prevent fallthrough from image transformation to prompt transformation

### 5. Restyle Flow Specific Tests
- ✅ Correctly handle restyle scenario: referenceImage from job, empty prompt, style selected
- ✅ Not trigger standard generation when image transformation is available

### 6. Error Handling
- ✅ Handle API errors without silent fallthrough
- ✅ Provide specific error messages for different failure cases

## Key Test Scenarios

The most important test is the **restyle flow scenario** which verifies the bug fix:

```javascript
// Restyle scenario: referenceImage exists, prompt is empty, style is selected
const referenceImage = 'https://example.com/generated-image.webp'; // From restyle
const prompt = ''; // Cleared by onRestyle
const activeStyleId = 'test-style-1'; // User selects style

// Should prioritize image transformation
// Should NOT fall through to prompt transformation or standard generation
```

This test ensures that when "Apply Style & Generate" is clicked with:
- A reference image (from restyle)
- An empty prompt (cleared during restyle)
- A selected style

The function correctly triggers image transformation instead of falling through to standard generation.

## Notes

- Tests use mocks for Firebase functions and Firestore
- The test suite validates the logic flow and error handling
- For full integration testing, see the backend tests in `functions/` directory
