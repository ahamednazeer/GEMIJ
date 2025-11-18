# API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow this format:

```json
{
  "success": boolean,
  "data": any,
  "message": string,
  "error": string,
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

## Authentication Endpoints

### POST /auth/register

Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "title": "Dr.",
  "affiliation": "University Name",
  "country": "USA",
  "orcid": "0000-0000-0000-0000"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "AUTHOR"
    },
    "token": "jwt-token"
  }
}
```

### POST /auth/login

Authenticate a user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### GET /auth/profile

Get current user profile (requires authentication).

### PUT /auth/profile

Update user profile (requires authentication).

## Submission Endpoints

### POST /submissions

Create a new submission (requires authentication).

**Request Body:**
```json
{
  "title": "Paper Title",
  "abstract": "Paper abstract...",
  "keywords": ["keyword1", "keyword2"],
  "manuscriptType": "Research Article",
  "isDoubleBlind": true,
  "suggestedReviewers": ["reviewer1@example.com"],
  "excludedReviewers": ["excluded@example.com"],
  "comments": "Additional comments",
  "coAuthors": [
    {
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com",
      "affiliation": "University",
      "isCorresponding": false,
      "order": 1
    }
  ]
}
```

### GET /submissions

Get user's submissions (requires authentication).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sortBy` (optional): Sort field (default: createdAt)
- `sortOrder` (optional): Sort order (asc/desc, default: desc)

### GET /submissions/:id

Get a specific submission (requires authentication).

### PUT /submissions/:id

Update a submission (requires authentication, only for drafts).

### POST /submissions/:id/submit

Submit a manuscript for review (requires authentication).

### POST /submissions/:id/withdraw

Withdraw a submission (requires authentication).

### POST /submissions/:id/files

Upload files for a submission (requires authentication).

**Content-Type:** `multipart/form-data`

### DELETE /submissions/files/:fileId

Delete a submission file (requires authentication).

### GET /submissions/files/:fileId/download

Download a submission file (requires authentication).

## Editorial Endpoints

### GET /editor/submissions

Get submissions for editorial review (requires EDITOR or ADMIN role).

**Query Parameters:**
- `status` (optional): Filter by status
- `page` (optional): Page number
- `limit` (optional): Items per page

### POST /editor/submissions/:submissionId/assign-editor

Assign an editor to a submission (requires ADMIN role).

**Request Body:**
```json
{
  "editorId": "editor-user-id",
  "isChief": false
}
```

### POST /editor/submissions/:submissionId/assign-reviewer

Assign a reviewer to a submission (requires EDITOR or ADMIN role).

**Request Body:**
```json
{
  "reviewerId": "reviewer-user-id",
  "dueDate": "2024-01-15T00:00:00Z"
}
```

### POST /editor/submissions/:submissionId/decision

Make an editorial decision (requires EDITOR or ADMIN role).

**Request Body:**
```json
{
  "decision": "ACCEPT|REJECT|REVISION_REQUIRED",
  "comments": "Editorial comments",
  "editorComments": "Confidential editor comments"
}
```

### GET /editor/reviewers

Get list of available reviewers (requires EDITOR or ADMIN role).

**Query Parameters:**
- `search` (optional): Search by name, email, or affiliation
- `page` (optional): Page number
- `limit` (optional): Items per page

## Review Endpoints

### GET /reviews

Get review invitations for the current user (requires REVIEWER, EDITOR, or ADMIN role).

**Query Parameters:**
- `status` (optional): Filter by review status
- `page` (optional): Page number
- `limit` (optional): Items per page

### GET /reviews/:reviewId

Get a specific review (requires REVIEWER, EDITOR, or ADMIN role).

### POST /reviews/:reviewId/respond

Respond to a review invitation (requires REVIEWER, EDITOR, or ADMIN role).

**Request Body:**
```json
{
  "accept": true
}
```

### PUT /reviews/:reviewId

Update a review (requires REVIEWER, EDITOR, or ADMIN role).

**Request Body:**
```json
{
  "recommendation": "ACCEPT|MINOR_REVISION|MAJOR_REVISION|REJECT",
  "confidentialComments": "Comments for editor only",
  "authorComments": "Comments for authors",
  "rating": 4
}
```

### POST /reviews/:reviewId/submit

Submit a completed review (requires REVIEWER, EDITOR, or ADMIN role).

## Payment Endpoints

### POST /payments/submissions/:submissionId/payment-intent

Create a payment intent for APC (requires authentication).

**Response:**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentId": "payment-id",
    "amount": 299.00,
    "currency": "USD"
  }
}
```

### POST /payments/payments/:paymentId/confirm

Confirm a payment (requires authentication).

**Request Body:**
```json
{
  "paymentIntentId": "pi_xxx"
}
```

### GET /payments/submissions/:submissionId/payment-status

Get payment status for a submission (requires authentication).

### POST /payments/webhook

Stripe webhook endpoint (no authentication required).

## Public Endpoints

### GET /public/current-issue

Get the current journal issue.

### GET /public/archive

Get archived issues.

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

### GET /public/issues/:volume/:number

Get a specific issue.

### GET /public/articles/:doi

Get an article by DOI.

### GET /public/articles/:doi/download

Download an article PDF.

### GET /public/search

Search articles.

**Query Parameters:**
- `q` (optional): Search query
- `author` (optional): Author name
- `year` (optional): Publication year
- `page` (optional): Page number
- `limit` (optional): Items per page

### GET /public/stats

Get journal statistics.

## Error Codes

- `400` - Bad Request: Invalid request data
- `401` - Unauthorized: Authentication required
- `403` - Forbidden: Insufficient permissions
- `404` - Not Found: Resource not found
- `409` - Conflict: Resource already exists
- `422` - Unprocessable Entity: Validation failed
- `429` - Too Many Requests: Rate limit exceeded
- `500` - Internal Server Error: Server error

## Rate Limiting

- General API: 100 requests per 15 minutes
- Login endpoint: 5 requests per minute
- File upload: 10 requests per minute

## File Upload Limits

- Maximum file size: 10MB
- Allowed file types: PDF, DOC, DOCX, TEX, ZIP
- Maximum files per submission: 10

## Webhook Events

### Stripe Webhooks

The system handles the following Stripe webhook events:

- `payment_intent.succeeded`: Payment completed successfully
- `payment_intent.payment_failed`: Payment failed

Configure your Stripe webhook endpoint to: `https://yourdomain.com/api/payments/webhook`

## Data Models

### User
```json
{
  "id": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "title": "string",
  "affiliation": "string",
  "country": "string",
  "orcid": "string",
  "bio": "string",
  "role": "VISITOR|AUTHOR|REVIEWER|EDITOR|ADMIN",
  "isActive": "boolean",
  "createdAt": "datetime",
  "lastLoginAt": "datetime"
}
```

### Submission
```json
{
  "id": "string",
  "title": "string",
  "abstract": "string",
  "keywords": ["string"],
  "manuscriptType": "string",
  "status": "DRAFT|SUBMITTED|UNDER_REVIEW|ACCEPTED|REJECTED|PUBLISHED",
  "isDoubleBlind": "boolean",
  "submittedAt": "datetime",
  "acceptedAt": "datetime",
  "publishedAt": "datetime",
  "doi": "string",
  "volume": "number",
  "issue": "number",
  "pages": "string",
  "author": "User",
  "coAuthors": ["CoAuthor"],
  "files": ["SubmissionFile"],
  "reviews": ["Review"]
}
```

### Review
```json
{
  "id": "string",
  "status": "PENDING|IN_PROGRESS|COMPLETED|DECLINED",
  "recommendation": "ACCEPT|MINOR_REVISION|MAJOR_REVISION|REJECT",
  "confidentialComments": "string",
  "authorComments": "string",
  "rating": "number",
  "invitedAt": "datetime",
  "acceptedAt": "datetime",
  "submittedAt": "datetime",
  "dueDate": "datetime",
  "reviewer": "User",
  "submission": "Submission"
}
```

## SDK Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Create submission
const submission = await api.post('/submissions', {
  title: 'My Research Paper',
  abstract: 'This paper presents...',
  keywords: ['research', 'technology'],
  manuscriptType: 'Research Article',
  coAuthors: []
});

// Upload files
const formData = new FormData();
formData.append('files', fileBlob, 'manuscript.pdf');

await api.post(`/submissions/${submissionId}/files`, formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
```

### Python

```python
import requests

class JournalAPI:
    def __init__(self, base_url, token=None):
        self.base_url = base_url
        self.headers = {'Authorization': f'Bearer {token}'} if token else {}
    
    def create_submission(self, data):
        response = requests.post(
            f'{self.base_url}/submissions',
            json=data,
            headers=self.headers
        )
        return response.json()
    
    def upload_files(self, submission_id, files):
        response = requests.post(
            f'{self.base_url}/submissions/{submission_id}/files',
            files=files,
            headers=self.headers
        )
        return response.json()

# Usage
api = JournalAPI('http://localhost:5000/api', token='your-jwt-token')
submission = api.create_submission({
    'title': 'My Research Paper',
    'abstract': 'This paper presents...',
    'keywords': ['research', 'technology'],
    'manuscriptType': 'Research Article',
    'coAuthors': []
})
```