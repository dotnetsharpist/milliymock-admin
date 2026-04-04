# API Services

Clean and scalable API service layer for Questions and Options.

## Structure

```
src/services/
├── apiClient.ts          # Centralized request wrapper
├── questionService.ts    # Question API operations
├── optionService.ts      # Option API operations
└── index.ts             # Barrel export
```

## Configuration

Set your API base URL in `.env`:

```env
VITE_API_BASE_URL=https://your-api-domain.com
```

## Authentication

The service automatically attaches the Bearer token from `localStorage.getItem('authToken')` to all requests.

To set the token:

```typescript
localStorage.setItem('authToken', 'your-token-here');
```

## Usage Examples

### Questions

```typescript
import { getQuestions, createQuestion, updateQuestion, deleteQuestion } from '@/services';

// Get all questions for a test
const questions = await getQuestions(123);

// Create a new question
const newQuestion = await createQuestion({
  Text: 'What is 2 + 2?',
  Order: 1,
  Score: 10,
  Type: 'MultipleChoice',
  TestId: 123,
  CorrectAnswer: '4',
});

// Create a question with an image
const questionWithImage = await createQuestion({
  Text: 'Identify this image',
  Image: imageFile, // File object from input[type="file"]
  Order: 2,
  Score: 15,
  Type: 'MultipleChoice',
  TestId: 123,
});

// Update a question
const updated = await updateQuestion(456, {
  Text: 'Updated question text',
  Order: 1,
  Score: 12,
  Type: 'FreeAnswer',
  TestId: 123,
});

// Delete a question
await deleteQuestion(456);
```

### Options

```typescript
import { createOption, updateOption, deleteOption } from '@/services';

// Create an option
const newOption = await createOption({
  questionId: 123,
  questionGroupId: null,
  text: 'Option A',
  isCorrect: true,
});

// Update an option
const updated = await updateOption(789, {
  text: 'Updated option text',
  isCorrect: false,
});

// Delete an option
await deleteOption(789);
```

## Error Handling

All service functions throw errors that can be caught:

```typescript
try {
  const questions = await getQuestions(123);
} catch (error) {
  console.error('Failed to fetch questions:', error.message);
}
```

## API Response Format

All API responses are wrapped in this format:

```json
{
  "code": 200,
  "message": "Success",
  "data": { /* actual data */ }
}
```

The service automatically:
- Checks if `code === 200`
- Returns only the unwrapped `data`
- Throws an error if `code !== 200`

## Features

✅ Centralized request wrapper
✅ Automatic Bearer token attachment
✅ Response unwrapping (returns only `data`)
✅ Proper FormData handling for file uploads
✅ Type-safe with TypeScript interfaces
✅ Clean separation of concerns
✅ Null/undefined value handling
✅ Query string builder utility
