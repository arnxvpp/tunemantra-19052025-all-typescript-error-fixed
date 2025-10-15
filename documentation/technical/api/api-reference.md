# TuneMantra API Reference

<div align="center">
  <img src="../diagrams/api-overview-diagram.svg" alt="TuneMantra API Overview" width="700" />
</div>

## Overview

The TuneMantra API provides a comprehensive set of endpoints for interacting with all aspects of the platform. This reference document covers authentication, request formats, response handling, error codes, and detailed specifications for each API endpoint.

## API Status

**Completion: 95.00% (Core Backend Services)**

| API Group | Status | Completion % |
|-----------|--------|--------------|
| Authentication | Complete | 100.00% |
| User Management | Complete | 100.00% |
| Content Management | Complete | 100.00% |
| Distribution | Complete | 100.00% |
| Rights Management | Near completion | 97.50% |
| Royalty Management | Complete | 100.00% |
| Analytics | Advanced development | 87.50% |
| Payment | Complete | 100.00% |
| Search | Complete | 100.00% |
| Webhooks | Near completion | 95.00% |

## Authentication

All API requests must be authenticated using JWT (JSON Web Tokens) or API keys.

### Authentication Methods

#### JWT Authentication

For user-based interactions, use JWT authentication:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

JWT tokens are obtained by calling the `/api/auth/login` endpoint and are valid for 24 hours.

#### API Key Authentication

For service-to-service communication, use API key authentication:

```
X-API-Key: tm_a1b2c3d4e5f6g7h8i9j0...
```

API keys can be generated in the Admin Dashboard and have configurable permissions and expiration.

### Obtaining a JWT Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2025-03-24T23:59:59Z",
    "user": {
      "id": 123,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "artist"
    }
  }
}
```

## API Request Format

### Base URL

```
https://api.tunemantra.com/v1
```

### Request Headers

All requests should include:

```
Content-Type: application/json
Accept: application/json
Authorization: Bearer <token> (or X-API-Key for API key auth)
```

Optional headers:

```
X-Request-ID: <unique request identifier>
X-Idempotency-Key: <idempotency key for POST/PUT/DELETE>
```

### Request Parameters

- **Path Parameters**: Part of the URL path (e.g., `/users/{userId}`)
- **Query Parameters**: Appended to the URL (e.g., `?page=1&limit=10`)
- **Request Body**: JSON payload for POST, PUT, and PATCH requests

## API Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": {
    // Response data specific to the endpoint
  },
  "meta": {
    "requestId": "req_1234567890",
    "timestamp": "2025-03-23T15:23:45Z",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

For error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request data is invalid",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address"
      }
    ]
  },
  "meta": {
    "requestId": "req_1234567890",
    "timestamp": "2025-03-23T15:23:45Z"
  }
}
```

## Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | BAD_REQUEST | The request is malformed |
| 400 | VALIDATION_ERROR | The request data fails validation |
| 401 | UNAUTHORIZED | Authentication is required |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | The requested resource does not exist |
| 409 | CONFLICT | The request conflicts with the current state |
| 422 | UNPROCESSABLE_ENTITY | The request is valid but cannot be processed |
| 429 | RATE_LIMITED | Too many requests |
| 500 | SERVER_ERROR | An unexpected server error occurred |
| 503 | SERVICE_UNAVAILABLE | The service is temporarily unavailable |

## Core API Endpoints

### User Management API

#### Get Current User

```http
GET /api/users/me
```

Response:

```json
{
  "success": true,
  "data": {
    "id": 123,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "artist",
    "organizationId": 456,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2025-03-10T14:25:00Z",
    "settings": {
      "notifications": {
        "email": true,
        "push": true
      },
      "theme": "dark"
    }
  }
}
```

#### List Users

```http
GET /api/organizations/{organizationId}/users?page=1&limit=10&role=artist
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "artist",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    // Additional users...
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "pages": 5
    }
  }
}
```

#### Create User

```http
POST /api/organizations/{organizationId}/users
Content-Type: application/json

{
  "email": "newuser@example.com",
  "name": "Jane Smith",
  "role": "manager",
  "password": "securePassword123",
  "settings": {
    "notifications": {
      "email": true,
      "push": false
    }
  }
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": 124,
    "email": "newuser@example.com",
    "name": "Jane Smith",
    "role": "manager",
    "organizationId": 456,
    "createdAt": "2025-03-23T15:30:00Z",
    "updatedAt": "2025-03-23T15:30:00Z"
  }
}
```

### Content Management API

#### Get Release

```http
GET /api/releases/{releaseId}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "rel_123456",
    "title": "Summer Vibes",
    "artistName": "DJ Sunshine",
    "releaseDate": "2025-05-15",
    "upc": "123456789012",
    "status": "approved",
    "coverArtUrl": "https://assets.tunemantra.com/covers/rel_123456.jpg",
    "genre": "Electronic",
    "subGenre": "House",
    "language": "English",
    "tracks": [
      {
        "id": "trk_789012",
        "title": "Beach Party",
        "duration": 195,
        "isrc": "ABCDE1234567",
        "trackNumber": 1,
        "explicit": false
      },
      // Additional tracks...
    ],
    "rightsHolders": [
      {
        "id": "rh_456789",
        "name": "John Doe",
        "role": "Primary Artist",
        "share": 50
      },
      {
        "id": "rh_567890",
        "name": "Jane Smith",
        "role": "Producer",
        "share": 50
      }
    ],
    "distributionStatus": {
      "spotify": "live",
      "appleMusic": "pending",
      "amazonMusic": "processing"
    }
  }
}
```

#### Create Release

```http
POST /api/organizations/{organizationId}/releases
Content-Type: application/json

{
  "title": "Summer Vibes",
  "artistName": "DJ Sunshine",
  "releaseDate": "2025-05-15",
  "genre": "Electronic",
  "subGenre": "House",
  "language": "English",
  "tracks": [
    {
      "title": "Beach Party",
      "duration": 195,
      "isrc": "ABCDE1234567",
      "trackNumber": 1,
      "explicit": false,
      "audioFileId": "audio_123456"
    }
  ],
  "rightsHolders": [
    {
      "userId": 123,
      "role": "Primary Artist",
      "share": 50
    },
    {
      "userId": 124,
      "role": "Producer",
      "share": 50
    }
  ],
  "coverArtId": "image_789012"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "rel_123456",
    "title": "Summer Vibes",
    "status": "draft",
    "createdAt": "2025-03-23T16:00:00Z",
    "updatedAt": "2025-03-23T16:00:00Z"
    // Additional release data...
  }
}
```

### Distribution API

#### Get Distribution Status

```http
GET /api/releases/{releaseId}/distribution
```

Response:

```json
{
  "success": true,
  "data": {
    "releaseId": "rel_123456",
    "status": "partially_distributed",
    "platformStatuses": [
      {
        "platform": "spotify",
        "status": "live",
        "url": "https://open.spotify.com/album/123456",
        "distributedAt": "2025-03-20T10:15:00Z",
        "liveAt": "2025-03-22T00:00:00Z"
      },
      {
        "platform": "appleMusic",
        "status": "pending",
        "scheduledFor": "2025-03-24T00:00:00Z"
      },
      {
        "platform": "amazonMusic",
        "status": "processing",
        "submittedAt": "2025-03-23T09:30:00Z"
      }
    ],
    "issues": []
  }
}
```

#### Create Distribution

```http
POST /api/releases/{releaseId}/distribute
Content-Type: application/json

{
  "platforms": ["spotify", "appleMusic", "amazonMusic", "deezer"],
  "scheduledReleaseDate": "2025-05-15",
  "priority": "standard"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "distributionId": "dist_123456",
    "status": "scheduled",
    "platforms": ["spotify", "appleMusic", "amazonMusic", "deezer"],
    "scheduledReleaseDate": "2025-05-15",
    "estimatedCompletionDate": "2025-05-14T00:00:00Z"
  }
}
```

### Rights Management API

#### Get Rights Information

```http
GET /api/releases/{releaseId}/rights
```

Response:

```json
{
  "success": true,
  "data": {
    "releaseId": "rel_123456",
    "rightsHolders": [
      {
        "id": "rh_456789",
        "userId": 123,
        "name": "John Doe",
        "role": "Primary Artist",
        "share": 50,
        "verified": true,
        "blockchainVerificationId": "0x1234567890abcdef",
        "agreedToTerms": true,
        "agreedAt": "2025-03-15T12:30:00Z"
      },
      {
        "id": "rh_567890",
        "userId": 124,
        "name": "Jane Smith",
        "role": "Producer",
        "share": 50,
        "verified": true,
        "blockchainVerificationId": "0xabcdef1234567890",
        "agreedToTerms": true,
        "agreedAt": "2025-03-15T14:45:00Z"
      }
    ],
    "license": {
      "type": "exclusive",
      "territory": "worldwide",
      "startDate": "2025-05-15",
      "endDate": null
    },
    "copyrightOwner": "TuneMantra Records",
    "publishingRights": "TuneMantra Publishing"
  }
}
```

#### Update Rights Holder

```http
PUT /api/releases/{releaseId}/rights/holders/{rightsHolderId}
Content-Type: application/json

{
  "role": "Primary Artist",
  "share": 40
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "rh_456789",
    "userId": 123,
    "name": "John Doe",
    "role": "Primary Artist",
    "share": 40,
    "verified": true,
    "updatedAt": "2025-03-23T16:30:00Z"
  }
}
```

### Royalty Management API

#### Get Royalty Overview

```http
GET /api/organizations/{organizationId}/royalties/overview?period=2025-02
```

Response:

```json
{
  "success": true,
  "data": {
    "period": "2025-02",
    "totalEarnings": 12345.67,
    "currency": "USD",
    "platforms": [
      {
        "name": "Spotify",
        "earnings": 5678.90,
        "streams": 1234567,
        "avgPerStream": 0.0046
      },
      {
        "name": "Apple Music",
        "earnings": 3456.78,
        "streams": 456789,
        "avgPerStream": 0.0076
      },
      {
        "name": "Amazon Music",
        "earnings": 2345.67,
        "streams": 345678,
        "avgPerStream": 0.0068
      },
      {
        "name": "Others",
        "earnings": 864.32,
        "streams": 123456,
        "avgPerStream": 0.0070
      }
    ],
    "topReleases": [
      {
        "releaseId": "rel_123456",
        "title": "Summer Vibes",
        "artistName": "DJ Sunshine",
        "earnings": 4567.89,
        "streams": 789012
      },
      // Additional releases...
    ],
    "paymentStatus": "processing",
    "estimatedPaymentDate": "2025-04-15"
  }
}
```

#### Get Detailed Royalty Statement

```http
GET /api/organizations/{organizationId}/royalties/statements/{statementId}
```

Response:

```json
{
  "success": true,
  "data": {
    "statementId": "stmt_123456",
    "period": "2025-02",
    "organizationId": 456,
    "generateDate": "2025-03-15T00:00:00Z",
    "totalEarnings": 12345.67,
    "currency": "USD",
    "status": "paid",
    "paymentDate": "2025-03-20T00:00:00Z",
    "paymentMethod": "Bank Transfer",
    "transactionId": "txn_abcdef123456",
    "releases": [
      {
        "releaseId": "rel_123456",
        "title": "Summer Vibes",
        "artistName": "DJ Sunshine",
        "earnings": 4567.89,
        "platforms": [
          {
            "name": "Spotify",
            "earnings": 2345.67,
            "streams": 456789,
            "countries": [
              {
                "code": "US",
                "earnings": 1234.56,
                "streams": 234567
              },
              // Additional countries...
            ]
          },
          // Additional platforms...
        ],
        "tracks": [
          {
            "trackId": "trk_789012",
            "title": "Beach Party",
            "earnings": 3456.78,
            "streams": 567890
          },
          // Additional tracks...
        ]
      },
      // Additional releases...
    ],
    "deductions": [
      {
        "type": "platform_fee",
        "description": "Platform Service Fee",
        "amount": 1234.57
      },
      {
        "type": "tax_withholding",
        "description": "Tax Withholding (US)",
        "amount": 246.91
      }
    ],
    "payees": [
      {
        "userId": 123,
        "name": "John Doe",
        "role": "Primary Artist",
        "amount": 5432.10,
        "percentage": 50
      },
      {
        "userId": 124,
        "name": "Jane Smith",
        "role": "Producer",
        "amount": 5432.09,
        "percentage": 50
      }
    ]
  }
}
```

### Analytics API

#### Get Performance Overview

```http
GET /api/organizations/{organizationId}/analytics/overview?period=last90days
```

Response:

```json
{
  "success": true,
  "data": {
    "period": "last90days",
    "streams": {
      "total": 12345678,
      "previousPeriod": 9876543,
      "change": 25.0,
      "timeline": [
        {
          "date": "2025-01-01",
          "value": 123456
        },
        // Additional date points...
      ]
    },
    "earnings": {
      "total": 45678.90,
      "previousPeriod": 34567.89,
      "change": 32.1,
      "timeline": [
        {
          "date": "2025-01-01",
          "value": 456.78
        },
        // Additional date points...
      ]
    },
    "platforms": [
      {
        "name": "Spotify",
        "streams": 5678901,
        "earnings": 23456.78,
        "change": 15.4
      },
      // Additional platforms...
    ],
    "topReleases": [
      {
        "releaseId": "rel_123456",
        "title": "Summer Vibes",
        "artistName": "DJ Sunshine",
        "streams": 1234567,
        "earnings": 5678.90
      },
      // Additional releases...
    ],
    "topCountries": [
      {
        "code": "US",
        "name": "United States",
        "streams": 3456789,
        "earnings": 15678.90
      },
      // Additional countries...
    ]
  }
}
```

#### Get Release Analytics

```http
GET /api/releases/{releaseId}/analytics?period=last30days&metrics=streams,earnings,listeners
```

Response:

```json
{
  "success": true,
  "data": {
    "releaseId": "rel_123456",
    "title": "Summer Vibes",
    "period": "last30days",
    "metrics": {
      "streams": {
        "total": 456789,
        "previousPeriod": 345678,
        "change": 32.1,
        "timeline": [
          {
            "date": "2025-02-23",
            "value": 15678
          },
          // Additional date points...
        ]
      },
      "earnings": {
        "total": 2345.67,
        "previousPeriod": 1234.56,
        "change": 90.0,
        "timeline": [
          {
            "date": "2025-02-23",
            "value": 78.90
          },
          // Additional date points...
        ]
      },
      "listeners": {
        "total": 123456,
        "previousPeriod": 98765,
        "change": 25.0,
        "timeline": [
          {
            "date": "2025-02-23",
            "value": 4567
          },
          // Additional date points...
        ]
      }
    },
    "platforms": [
      {
        "name": "Spotify",
        "streams": 234567,
        "earnings": 1234.56,
        "listeners": 78901
      },
      // Additional platforms...
    ],
    "countries": [
      {
        "code": "US",
        "name": "United States",
        "streams": 123456,
        "earnings": 678.90,
        "listeners": 34567
      },
      // Additional countries...
    ],
    "tracks": [
      {
        "trackId": "trk_789012",
        "title": "Beach Party",
        "streams": 345678,
        "earnings": 1789.01,
        "listeners": 98765
      },
      // Additional tracks...
    ]
  }
}
```

### Payment API

#### Get Payment Methods

```http
GET /api/organizations/{organizationId}/payment-methods
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "pm_123456",
      "type": "bank_account",
      "name": "Primary Bank Account",
      "details": {
        "accountHolderName": "TuneMantra Records LLC",
        "bankName": "Global Bank",
        "accountNumberLast4": "1234",
        "routingNumber": "******123",
        "currency": "USD"
      },
      "isDefault": true,
      "createdAt": "2024-05-15T10:30:00Z"
    },
    {
      "id": "pm_234567",
      "type": "paypal",
      "name": "PayPal Account",
      "details": {
        "email": "finance@tunemantrarecords.com"
      },
      "isDefault": false,
      "createdAt": "2024-06-20T14:45:00Z"
    }
  ]
}
```

#### Create Payment Method

```http
POST /api/organizations/{organizationId}/payment-methods
Content-Type: application/json

{
  "type": "bank_account",
  "name": "Secondary Bank Account",
  "details": {
    "accountHolderName": "TuneMantra International LLC",
    "bankName": "World Bank",
    "accountNumber": "9876543210",
    "routingNumber": "987654321",
    "currency": "EUR"
  },
  "isDefault": false
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "pm_345678",
    "type": "bank_account",
    "name": "Secondary Bank Account",
    "details": {
      "accountHolderName": "TuneMantra International LLC",
      "bankName": "World Bank",
      "accountNumberLast4": "3210",
      "routingNumber": "******321",
      "currency": "EUR"
    },
    "isDefault": false,
    "createdAt": "2025-03-23T17:15:00Z"
  }
}
```

#### Get Withdrawal History

```http
GET /api/organizations/{organizationId}/withdrawals?page=1&limit=10
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "with_123456",
      "amount": 12345.67,
      "currency": "USD",
      "status": "completed",
      "paymentMethodId": "pm_123456",
      "paymentMethodType": "bank_account",
      "paymentMethodDetails": {
        "accountHolderName": "TuneMantra Records LLC",
        "bankName": "Global Bank",
        "accountNumberLast4": "1234"
      },
      "requestedAt": "2025-03-01T10:30:00Z",
      "processedAt": "2025-03-03T15:45:00Z",
      "estimatedArrivalDate": "2025-03-05T00:00:00Z",
      "transactionId": "txn_abcdef123456"
    },
    // Additional withdrawals...
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "pages": 5
    }
  }
}
```

#### Request Withdrawal

```http
POST /api/organizations/{organizationId}/withdrawals
Content-Type: application/json

{
  "amount": 5000.00,
  "currency": "USD",
  "paymentMethodId": "pm_123456",
  "description": "March 2025 earnings withdrawal"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "with_234567",
    "amount": 5000.00,
    "currency": "USD",
    "status": "pending",
    "paymentMethodId": "pm_123456",
    "paymentMethodType": "bank_account",
    "paymentMethodDetails": {
      "accountHolderName": "TuneMantra Records LLC",
      "bankName": "Global Bank",
      "accountNumberLast4": "1234"
    },
    "requestedAt": "2025-03-23T17:30:00Z",
    "estimatedProcessingDate": "2025-03-25T00:00:00Z",
    "estimatedArrivalDate": "2025-03-27T00:00:00Z",
    "description": "March 2025 earnings withdrawal"
  }
}
```

## Webhook API

TuneMantra provides webhooks for real-time updates on various events.

### Webhook Events

| Event Type | Description |
|------------|-------------|
| `release.created` | A new release has been created |
| `release.updated` | A release has been updated |
| `release.approved` | A release has been approved for distribution |
| `release.rejected` | A release has been rejected |
| `distribution.started` | Distribution process has started |
| `distribution.completed` | Distribution to all platforms is complete |
| `distribution.failed` | Distribution to one or more platforms failed |
| `platform.status_changed` | Status on a specific platform has changed |
| `royalty.statement_generated` | A new royalty statement has been generated |
| `royalty.payment_initiated` | A royalty payment has been initiated |
| `royalty.payment_completed` | A royalty payment has been completed |
| `user.created` | A new user has been created |
| `user.deleted` | A user has been deleted |
| `payment_method.created` | A new payment method has been added |
| `withdrawal.status_changed` | Status of a withdrawal has changed |

### Webhook Payload Format

```json
{
  "id": "evt_123456789",
  "eventType": "release.approved",
  "timestamp": "2025-03-23T17:45:00Z",
  "data": {
    // Event-specific data
  }
}
```

### Register Webhook Endpoint

```http
POST /api/organizations/{organizationId}/webhooks
Content-Type: application/json

{
  "url": "https://example.com/webhooks/tunemantra",
  "events": ["release.approved", "distribution.completed", "royalty.payment_completed"],
  "description": "Production event handler",
  "secret": "whsec_abcdefghijklmnopqrstuvwxyz"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "wh_123456",
    "url": "https://example.com/webhooks/tunemantra",
    "events": ["release.approved", "distribution.completed", "royalty.payment_completed"],
    "description": "Production event handler",
    "status": "active",
    "createdAt": "2025-03-23T17:45:00Z"
  }
}
```

## API Rate Limits

TuneMantra API implements rate limiting to ensure fair usage and system stability:

| API Group | Basic Plan | Pro Plan | Enterprise Plan |
|-----------|------------|----------|----------------|
| Authentication | 10/min | 20/min | 50/min |
| User Management | 60/min | 300/min | 1000/min |
| Content Management | 120/min | 600/min | 2000/min |
| Distribution | 60/min | 300/min | 1000/min |
| Rights Management | 60/min | 300/min | 1000/min |
| Royalty Management | 60/min | 300/min | 1000/min |
| Analytics | 120/min | 600/min | 2000/min |
| Payment | 60/min | 300/min | 1000/min |
| Search | 300/min | 1000/min | 3000/min |

Exceeded rate limits return a 429 Too Many Requests response with a Retry-After header.

## API Versioning

The TuneMantra API uses semantic versioning:

- Major version changes (e.g., v1 to v2) may include breaking changes
- Minor version updates are backward compatible
- Current API version: v1

Version is specified in the URL path: `/v1/resources`

## Best Practices

1. **Use Idempotency Keys**: For non-GET requests to prevent duplicate operations
2. **Implement Retry Logic**: With exponential backoff for 5xx errors
3. **Validate Webhook Signatures**: To ensure webhook authenticity
4. **Cache Authentication Tokens**: Until close to expiration to reduce authentication requests
5. **Use Compression**: Set `Accept-Encoding: gzip` for improved performance
6. **Include Request IDs**: In all API calls for easier troubleshooting
7. **Pagination**: Use limit and page parameters for large collections
8. **Filtering**: Use query parameters to filter results

## Development Resources

- **API Playground**: [https://api-playground.tunemantra.com](https://api-playground.tunemantra.com)
- **SDK Libraries**: [https://github.com/tunemantra/api-sdks](https://github.com/tunemantra/api-sdks)
- **API Status**: [https://status.tunemantra.com](https://status.tunemantra.com)

---

*For detailed implementation examples and code snippets, please refer to the [API Implementation Guide](../developer/api-implementation-guide.md).*