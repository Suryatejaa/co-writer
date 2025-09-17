# AI Service

This document explains the AI service implementation in the Telugu Context Builder project.

## Overview

The AI service is responsible for generating Telugu-English reel scripts using OpenAI's GPT models. It includes:

1. Integration with OpenAI API
2. Relevance-based content matching
3. Fallback rule-based generation
4. Celtx format conversion
5. Usage tracking

## Key Functions

### generateScriptWithRelevance

Generates a script using relevance-based matching with the following process:

1. Takes a topic and datasets (dialogues, memes, trends)
2. Uses Fuse.js to find relevant items from each dataset
3. Sends a prompt to OpenAI with the relevant context
4. Parses and validates the response
5. Provides a rule-based fallback if AI generation fails

### generateBatchScripts

Generates a batch of scripts for caching:

1. Takes a topic and datasets
2. Selects relevant items using keyword matching
3. Sends a prompt to OpenAI to generate 3 scripts
4. Parses and validates the response
5. Caches the results in Firestore

### getOrGenerateBatchScripts

Retrieves cached scripts or generates new ones:

1. Checks Firestore for existing scripts with the same topic
2. Returns cached scripts if they exist and haven't expired
3. Generates new scripts if no cache exists or cache has expired

### convertToCeltxFormat

Converts a generated script to Celtx screenplay format:

1. Takes a script object with hook, context, punchline, and caption
2. Formats it according to Celtx screenplay conventions
3. Returns a formatted string suitable for Celtx import

### generateRuleBasedScript

Fallback function that generates scripts without AI:

1. Takes a topic and datasets
2. Uses keyword matching to find relevant items
3. Constructs a script using template-based formatting
4. Returns a script object matching the AI-generated format

## Relevance Matching

The relevance matching system uses Fuse.js to find relevant content:

1. **Dataset Preparation**: Each dataset (dialogues, memes, trends) is processed to include searchable fields
2. **Search Setup**: Fuse.js is configured with keys to search (situation, dialogue, tags)
3. **Matching**: User prompts are matched against datasets to find relevant items
4. **Selection**: Top matches are selected for inclusion in the AI prompt

## Prompt Engineering

The AI service uses carefully crafted prompts to ensure quality output:

1. **Structure Definition**: Clear JSON schema definition for expected output
2. **Context Inclusion**: Relevant dataset items are included in the prompt
3. **Constraints**: Strict rules about content usage and generation
4. **Examples**: Sample outputs to guide the AI

## Error Handling

The AI service includes robust error handling:

1. **API Errors**: Catches and handles OpenAI API errors gracefully
2. **Parsing Errors**: Handles JSON parsing failures with fallbacks
3. **Validation Errors**: Validates AI responses and provides fallbacks for invalid responses
4. **Rate Limiting**: Implements exponential backoff for rate limit errors

## Caching

The service implements caching to reduce API usage:

1. **Firestore Storage**: Generated scripts are stored in Firestore
2. **Expiration**: Cached scripts expire after 7 days
3. **Retrieval**: Checks cache before generating new scripts
4. **Invalidation**: Automatically removes expired cache entries

## Usage Tracking

The service tracks API usage for cost monitoring:

1. **Token Counting**: Tracks prompt and completion tokens
2. **Cost Calculation**: Estimates API costs based on token usage
3. **Storage**: Stores usage data in Firestore analytics collection

## Integration Points

### OpenAI API

- Uses `gpt-5-nano` model for script generation
- Implements proper error handling and retries
- Follows OpenAI's best practices for API usage

### Firebase

- Stores cached scripts in Firestore
- Tracks usage analytics
- Implements security rules for data access

### Frontend Components

- Generator component uses the AI service for script generation
- Admin dashboard displays usage analytics
- Components handle loading states and errors

## Performance Considerations

1. **Caching**: Reduces API calls by caching generated scripts
2. **Batch Generation**: Generates multiple scripts at once for efficiency
3. **Fallbacks**: Provides rule-based generation when AI fails
4. **Validation**: Validates responses to prevent processing invalid data

## Future Improvements

1. **Model Selection**: Allow users to choose different AI models
2. **Prompt Customization**: Enable custom prompt templates
3. **Advanced Matching**: Implement more sophisticated relevance matching
4. **Multi-language Support**: Extend support for additional languages