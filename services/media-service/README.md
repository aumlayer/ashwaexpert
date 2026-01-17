# Media Service

## Service Overview

**Version**: 1.0.0  
**Technology Stack**: Python FastAPI, PostgreSQL, MinIO  
**Purpose**: Handles secure file uploads and downloads including ticket photos, invoice PDFs, and website media.

The Media Service manages all file storage operations using MinIO (S3-compatible) and maintains metadata about uploaded files.

## Responsibilities and Boundaries

### What This Service Owns
- File upload and storage (MinIO)
- File metadata management
- Secure file access URLs
- File type validation
- File size limits

### What This Service Does NOT Own
- Business context (tickets, invoices handled by respective services)
- User authentication (auth-service)

## Owned Data and Schema

### Database Schema: `media`

#### `media_objects` table
- `id` (UUID, PK)
- `file_name` (VARCHAR, NOT NULL)
- `original_file_name` (VARCHAR, NOT NULL)
- `file_type` (VARCHAR, NOT NULL) - 'image', 'pdf', 'document', 'other'
- `mime_type` (VARCHAR, NOT NULL)
- `file_size` (BIGINT, NOT NULL) - bytes
- `storage_path` (VARCHAR, NOT NULL) - MinIO path
- `bucket_name` (VARCHAR, NOT NULL)
- `uploaded_by` (UUID, FK -> auth.users.id, nullable)
- `context_type` (VARCHAR) - 'ticket_photo', 'invoice_pdf', 'website_media', 'other'
- `context_id` (UUID, nullable) - Reference to ticket/invoice/etc
- `is_public` (BOOLEAN, DEFAULT false)
- `expires_at` (TIMESTAMP, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Public APIs

### 1. Upload File

**POST** `/api/v1/media/upload`

Upload a file.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file` (file, required)
- `context_type` (string, optional) - 'ticket_photo', 'invoice_pdf', 'website_media'
- `context_id` (UUID, optional)
- `is_public` (boolean, optional, default: false)

**Response:** `201 Created`
```json
{
  "id": "110e8400-e29b-41d4-a716-446655440000",
  "file_name": "photo_123456.jpg",
  "original_file_name": "ac_photo.jpg",
  "file_type": "image",
  "mime_type": "image/jpeg",
  "file_size": 245678,
  "url": "https://media.example.com/files/110e8400-e29b-41d4-a716-446655440000",
  "created_at": "2024-02-01T10:30:00Z"
}
```

### 2. Get File

**GET** `/api/v1/media/{media_id}`

Get file metadata and download URL.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": "110e8400-e29b-41d4-a716-446655440000",
  "file_name": "photo_123456.jpg",
  "original_file_name": "ac_photo.jpg",
  "file_type": "image",
  "mime_type": "image/jpeg",
  "file_size": 245678,
  "url": "https://media.example.com/files/110e8400-e29b-41d4-a716-446655440000",
  "download_url": "https://media.example.com/files/110e8400-e29b-41d4-a716-446655440000/download?token=xxx",
  "created_at": "2024-02-01T10:30:00Z"
}
```

### 3. Download File

**GET** `/api/v1/media/{media_id}/download`

Download file content.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `token` (optional): Temporary access token for public files

**Response:** `200 OK` (file content with appropriate Content-Type)

### 4. Delete File

**DELETE** `/api/v1/media/{media_id}`

Delete a file.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `204 No Content`

### 5. Generate Invoice PDF

**POST** `/api/v1/media/invoices/generate-pdf`

Generate PDF for invoice (called by billing-service).

**Headers:**
```
Authorization: Bearer <internal_service_token>
```

**Request Body:**
```json
{
  "invoice_id": "990e8400-e29b-41d4-a716-446655440000",
  "invoice_number": "FY26-27-INV-000001",
  "invoice_data": {
    "subscriber": {...},
    "line_items": [...],
    "totals": {...}
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "120e8400-e29b-41d4-a716-446655440000",
  "url": "https://media.example.com/files/120e8400-e29b-41d4-a716-446655440000",
  "storage_path": "invoices/FY26-27-INV-000001.pdf"
}
```

### 6. List Files

**GET** `/api/v1/media`

List files with filtering.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `context_type` (optional)
- `context_id` (optional)
- `file_type` (optional)
- `page` (optional)
- `limit` (optional)

**Response:** `200 OK`

## Events Published

### MediaUploaded
Emitted when a file is successfully uploaded.

```json
{
  "event_type": "MediaUploaded",
  "media_id": "110e8400-e29b-41d4-a716-446655440000",
  "context_type": "ticket_photo",
  "context_id": "bb0e8400-e29b-41d4-a716-446655440000",
  "file_type": "image",
  "timestamp": "2024-02-01T10:30:00Z"
}
```

## Events Consumed

- **InvoiceGenerated** (from billing-service): Generate invoice PDF

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `MINIO_ENDPOINT` | MinIO server endpoint | Yes | - |
| `MINIO_ACCESS_KEY` | MinIO access key | Yes | - |
| `MINIO_SECRET_KEY` | MinIO secret key | Yes | - |
| `MINIO_BUCKET_MEDIA` | Bucket for general media | Yes | - |
| `MINIO_BUCKET_INVOICES` | Bucket for invoices | Yes | - |
| `MAX_FILE_SIZE_MB` | Maximum file size in MB | No | `10` |
| `ALLOWED_IMAGE_TYPES` | Allowed image MIME types | No | `image/jpeg,image/png,image/webp` |
| `ALLOWED_DOCUMENT_TYPES` | Allowed document MIME types | No | `application/pdf` |
| `LOG_LEVEL` | Logging level | No | `INFO` |

## Local Development

### Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure MinIO connection in `.env`

3. Create buckets:
```bash
# Use MinIO client or API to create buckets
```

4. Run service:
```bash
python src/main.py
```

## Deployment Notes

- MinIO buckets must be created before deployment
- File size limits should be enforced
- Secure download URLs with expiration
- Invoice PDF generation requires template

## Health Checks and SLOs

- **Health Endpoint**: `GET /health`
- **Expected Response Time**: < 500ms (upload depends on file size)
- **SLO**: 99.9% uptime

## Runbook

### Common Failures

- MinIO connection failures: Verify credentials and endpoint
- File upload failures: Check bucket permissions and disk space
- PDF generation failures: Verify template and dependencies

## Security Notes

### Authentication Requirements

- All endpoints require authentication (except public files with token)
- File access should be validated against context ownership
- Admin endpoints require admin role

### Rate Limits

- File upload: 20 requests/minute per user
- File download: Standard rate limits

### PII Handling

- Files may contain sensitive information (photos, invoices)
- Ensure secure storage and access controls
- Implement file expiration for temporary files
- Validate file types to prevent malicious uploads

### Additional Security

- File type validation is mandatory
- File size limits prevent DoS attacks
- Virus scanning recommended for uploads
- Secure URLs with expiration tokens
