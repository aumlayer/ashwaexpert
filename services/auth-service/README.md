# Auth Service

## Service Overview

**Version**: 1.0.0  
**Technology Stack**: Python FastAPI, PostgreSQL, Redis  
**Purpose**: Handles user authentication, registration, password management, OTP verification, and JWT token issuance.

The Auth Service is responsible for all authentication and authorization concerns. It manages user credentials, sessions, OTP generation/verification, and issues JWT tokens for authenticated users.

## Responsibilities and Boundaries

### What This Service Owns
- User registration and profile creation
- Password hashing and validation
- OTP generation, storage, and verification
- JWT access token and refresh token issuance
- Token refresh and revocation
- User roles and permissions
- Session management
- Login history and audit events

### What This Service Does NOT Own
- Subscriber profiles (subscriber-service)
- Business data (other services)
- Payment information
- Ticket assignments

## Owned Data and Schema

### Database Schema: `auth`

#### `users` table
- `id` (UUID, PK)
- `email` (VARCHAR, UNIQUE, NOT NULL)
- `phone` (VARCHAR, UNIQUE)
- `password_hash` (VARCHAR, NOT NULL)
- `is_active` (BOOLEAN, DEFAULT true)
- `is_verified` (BOOLEAN, DEFAULT false)
- `role` (VARCHAR) - 'admin', 'subscriber', 'technician', 'cms_user'
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `last_login_at` (TIMESTAMP)

#### `user_roles` table
- `id` (UUID, PK)
- `user_id` (UUID, FK -> users.id)
- `role` (VARCHAR, NOT NULL)
- `created_at` (TIMESTAMP)

#### `otp_events` table
- `id` (UUID, PK)
- `user_id` (UUID, FK -> users.id, nullable)
- `identifier` (VARCHAR, NOT NULL) - email or phone
- `otp_code` (VARCHAR, NOT NULL) - hashed
- `purpose` (VARCHAR) - 'login', 'registration', 'password_reset'
- `is_used` (BOOLEAN, DEFAULT false)
- `expires_at` (TIMESTAMP, NOT NULL)
- `created_at` (TIMESTAMP)

#### `sessions` table
- `id` (UUID, PK)
- `user_id` (UUID, FK -> users.id)
- `refresh_token` (VARCHAR, UNIQUE, NOT NULL)
- `device_info` (JSONB)
- `ip_address` (VARCHAR)
- `expires_at` (TIMESTAMP, NOT NULL)
- `created_at` (TIMESTAMP)
- `last_used_at` (TIMESTAMP)

#### `login_history` table
- `id` (UUID, PK)
- `user_id` (UUID, FK -> users.id)
- `ip_address` (VARCHAR)
- `user_agent` (VARCHAR)
- `success` (BOOLEAN)
- `failure_reason` (VARCHAR)
- `created_at` (TIMESTAMP)

## Public APIs

### 1. Register User

**POST** `/api/v1/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "phone": "+919876543210",
  "password": "SecurePassword123!",
  "role": "subscriber"
}
```

**Response:** `201 Created`
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "message": "Registration successful. OTP sent to email."
}
```

**Rate Limit**: 5 requests per hour per email/phone

### 2. Request OTP

**POST** `/api/v1/auth/otp/request`

Request OTP for login or password reset.

**Request Body:**
```json
{
  "identifier": "user@example.com",
  "purpose": "login"
}
```

**Response:** `200 OK`
```json
{
  "message": "OTP sent successfully",
  "expires_in_seconds": 300
}
```

**Rate Limit**: 3 requests per 15 minutes per identifier

### 3. Verify OTP and Login

**POST** `/api/v1/auth/otp/verify`

Verify OTP and receive JWT tokens.

**Request Body:**
```json
{
  "identifier": "user@example.com",
  "otp_code": "123456",
  "purpose": "login"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "550e8400-e29b-41d4-a716-446655440000",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "subscriber"
  }
}
```

### 4. Password Login

**POST** `/api/v1/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK` (same as OTP verify)

### 5. Refresh Token

**POST** `/api/v1/auth/refresh`

Get new access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

### 6. Logout

**POST** `/api/v1/auth/logout`

Invalidate refresh token and logout.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

### 7. Validate Token

**POST** `/api/v1/auth/validate`

Validate JWT token (used by gateway).

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "valid": true,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "role": "subscriber",
  "expires_at": "2024-01-15T11:30:00Z"
}
```

### 8. Get Current User

**GET** `/api/v1/auth/me`

Get current authenticated user details.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "phone": "+919876543210",
  "role": "subscriber",
  "is_active": true,
  "is_verified": true
}
```

## Events Published

### UserCreated
Emitted when a new user is registered.

```json
{
  "event_type": "UserCreated",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "role": "subscriber",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### UserLoggedIn
Emitted on successful login.

```json
{
  "event_type": "UserLoggedIn",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "login_method": "password",
  "ip_address": "192.168.1.1",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Events Consumed

None. Auth service is the source of truth for authentication.

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `REDIS_URL` | Redis connection string | Yes | - |
| `JWT_SECRET` | Secret for JWT signing | Yes | - |
| `JWT_ALGORITHM` | JWT algorithm | No | `HS256` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL | No | `60` |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL | No | `30` |
| `OTP_EXPIRE_MINUTES` | OTP expiration time | No | `5` |
| `OTP_LENGTH` | OTP code length | No | `6` |
| `PASSWORD_MIN_LENGTH` | Minimum password length | No | `8` |
| `BCRYPT_ROUNDS` | Bcrypt hashing rounds | No | `12` |
| `MSG91_API_KEY` | MSG91 API key for SMS OTP | Yes | - |
| `SMTP_HOST` | SMTP server host | Yes | - |
| `SMTP_PORT` | SMTP server port | No | `587` |
| `SMTP_USER` | SMTP username | Yes | - |
| `SMTP_PASSWORD` | SMTP password | Yes | - |
| `SMTP_FROM_EMAIL` | From email address | Yes | - |
| `LOG_LEVEL` | Logging level | No | `INFO` |

## Local Development

### Prerequisites
- Python 3.11+
- PostgreSQL 14+
- Redis 7+

### Setup

1. Install dependencies:
```bash
cd services/auth-service
pip install -r requirements.txt
```

2. Set up database:
```bash
# Run migrations
alembic upgrade head
```

3. Copy environment file:
```bash
cp config/example.env .env
```

4. Update `.env` with database and service URLs.

5. Run the service:
```bash
python src/main.py
```

Or use the dev script:
```bash
./scripts/dev-run.sh
```

## Deployment Notes

### Docker

```bash
docker build -t auth-service:latest .
docker run -p 8001:8000 --env-file .env auth-service:latest
```

### Health Checks

**Endpoint**: `GET /health`

### Database Migrations

Run migrations on deployment:
```bash
alembic upgrade head
```

## Health Checks and SLOs

- **Health Endpoint**: `GET /health`
- **Expected Response Time**: < 100ms
- **SLO**: 99.9% uptime
- **Token Validation**: < 50ms

## Runbook

### Common Failures

#### Database Connection Errors

**Recovery**: Verify DATABASE_URL and PostgreSQL availability

#### OTP Not Sending

**Recovery**: Check MSG91/SMTP configuration and credentials

#### Token Validation Failures

**Recovery**: Verify JWT_SECRET matches across services

## Security Notes

### Authentication Requirements

- Registration and OTP endpoints are public but rate-limited
- All other endpoints require authentication
- Password must meet complexity requirements

### Rate Limits

- Registration: 5/hour per email/phone
- OTP request: 3/15 minutes per identifier
- Login attempts: 5/15 minutes per identifier

### PII Handling

- Passwords are hashed using bcrypt
- OTP codes are hashed before storage
- PII is encrypted in transit (TLS)
- Audit logs contain IP addresses and user agents
