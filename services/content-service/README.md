# Content Service

## Service Overview

**Version**: 1.0.0  
**Technology Stack**: Python FastAPI, PostgreSQL  
**Purpose**: Manages case studies, blog posts, and SEO content for the public website.

The Content Service handles all content management operations including case studies with SEO metadata, content publishing, and public content retrieval.

## Responsibilities and Boundaries

### What This Service Owns
- Case study CRUD operations
- SEO metadata management (title, description, keywords, OG tags)
- Content publishing workflow
- Content versioning (optional)
- Public content listing and retrieval

### What This Service Does NOT Own
- Media files (media-service handles uploads)
- User authentication (auth-service)
- Lead generation (lead-service)

## Owned Data and Schema

### Database Schema: `content`

#### `case_studies` table
- `id` (UUID, PK)
- `title` (VARCHAR, NOT NULL)
- `slug` (VARCHAR, UNIQUE, NOT NULL)
- `summary` (TEXT)
- `content` (TEXT, NOT NULL)
- `featured_image_url` (VARCHAR)
- `status` (VARCHAR) - 'draft', 'published', 'archived'
- `published_at` (TIMESTAMP, nullable)
- `author_id` (UUID, FK -> auth.users.id)
- `seo_title` (VARCHAR)
- `seo_description` (TEXT)
- `seo_keywords` (VARCHAR)
- `og_image_url` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Public APIs

### 1. List Published Case Studies (Public)

**GET** `/api/v1/content/case-studies`

List all published case studies.

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search in title/content

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Success Story: Acme Corp",
      "slug": "success-story-acme-corp",
      "summary": "How we helped Acme Corp...",
      "featured_image_url": "https://...",
      "published_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10
}
```

### 2. Get Case Study by Slug (Public)

**GET** `/api/v1/content/case-studies/{slug}`

Get full case study content by slug.

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Success Story: Acme Corp",
  "slug": "success-story-acme-corp",
  "summary": "How we helped Acme Corp...",
  "content": "Full content here...",
  "featured_image_url": "https://...",
  "seo_title": "Acme Corp Success Story",
  "seo_description": "Learn how we helped...",
  "seo_keywords": "case study, success, acme",
  "og_image_url": "https://...",
  "published_at": "2024-01-15T10:30:00Z"
}
```

### 3. Create Case Study (CMS)

**POST** `/api/v1/content/case-studies`

Create a new case study.

**Headers:**
```
Authorization: Bearer <cms_token>
```

**Request Body:**
```json
{
  "title": "Success Story: Acme Corp",
  "slug": "success-story-acme-corp",
  "summary": "Brief summary",
  "content": "Full content...",
  "featured_image_url": "https://...",
  "seo_title": "Acme Corp Success Story",
  "seo_description": "Learn how we helped...",
  "seo_keywords": "case study, success",
  "og_image_url": "https://...",
  "status": "draft"
}
```

**Response:** `201 Created`

### 4. Update Case Study (CMS)

**PUT** `/api/v1/content/case-studies/{case_study_id}`

Update existing case study.

**Headers:**
```
Authorization: Bearer <cms_token>
```

**Response:** `200 OK`

### 5. Publish Case Study (CMS)

**POST** `/api/v1/content/case-studies/{case_study_id}/publish`

Publish a case study.

**Headers:**
```
Authorization: Bearer <cms_token>
```

**Response:** `200 OK`

### 6. Delete Case Study (CMS)

**DELETE** `/api/v1/content/case-studies/{case_study_id}`

Delete a case study (soft delete by archiving).

**Headers:**
```
Authorization: Bearer <cms_token>
```

**Response:** `204 No Content`

## Events Published

### CaseStudyPublished
Emitted when a case study is published.

```json
{
  "event_type": "CaseStudyPublished",
  "case_study_id": "550e8400-e29b-41d4-a716-446655440000",
  "slug": "success-story-acme-corp",
  "title": "Success Story: Acme Corp",
  "published_at": "2024-01-15T10:30:00Z"
}
```

## Events Consumed

None.

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `REDIS_URL` | Redis connection string (for caching) | Yes | - |
| `LOG_LEVEL` | Logging level | No | `INFO` |
| `CACHE_TTL_SECONDS` | Cache TTL for public content | No | `3600` |

## Local Development

### Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run migrations:
```bash
alembic upgrade head
```

3. Run service:
```bash
python src/main.py
```

## Deployment Notes

- Public endpoints are cached (Redis)
- CMS endpoints require authentication
- SEO metadata is critical for public endpoints

## Health Checks and SLOs

- **Health Endpoint**: `GET /health`
- **Expected Response Time**: < 100ms (cached), < 500ms (uncached)
- **SLO**: 99.9% uptime

## Runbook

### Common Failures

- Cache misses causing slow responses: Monitor cache hit rates
- Database connection: Verify DATABASE_URL

## Security Notes

### Authentication Requirements

- Public listing/detail endpoints are open
- All CMS endpoints require CMS user authentication
- Content moderation before publishing

### Rate Limits

- Public endpoints: Standard rate limits
- CMS endpoints: Standard rate limits

### PII Handling

- Content may contain client names (ensure permissions)
- SEO metadata is public
