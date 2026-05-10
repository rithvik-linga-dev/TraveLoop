# API Response Examples

## Real-World Response Examples from Backend

### GET /api/trips
**Request:**
```bash
GET /api/trips
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "count": 2,
  "trips": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Summer Europe Adventure",
      "description": "Exploring France, Italy, and Spain",
      "startDate": "2026-06-01T00:00:00.000Z",
      "endDate": "2026-08-31T00:00:00.000Z",
      "coverImage": "https://example.com/image.jpg",
      "owner": "507f1f77bcf86cd799439010",
      "collaborators": [],
      "createdAt": "2026-05-10T10:30:00.000Z",
      "updatedAt": "2026-05-10T10:30:00.000Z",
      "__v": 0
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Tokyo Winter 2026",
      "description": "Experience Japanese winter festivals",
      "startDate": "2026-12-15T00:00:00.000Z",
      "endDate": "2026-12-30T00:00:00.000Z",
      "coverImage": "",
      "owner": "507f1f77bcf86cd799439010",
      "collaborators": ["507f1f77bcf86cd799439013"],
      "createdAt": "2026-05-09T14:20:00.000Z",
      "updatedAt": "2026-05-09T14:20:00.000Z",
      "__v": 0
    }
  ]
}
```

### POST /api/trips
**Request:**
```bash
POST /api/trips
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "Beach Getaway",
  "description": "Relaxing week at the beach",
  "startDate": "2026-07-10T00:00:00Z",
  "endDate": "2026-07-17T00:00:00Z"
}
```

**Success Response (201):**
```json
{
  "message": "Trip created successfully.",
  "trip": {
    "_id": "507f1f77bcf86cd799439014",
    "title": "Beach Getaway",
    "description": "Relaxing week at the beach",
    "startDate": "2026-07-10T00:00:00.000Z",
    "endDate": "2026-07-17T00:00:00.000Z",
    "coverImage": "",
    "owner": "507f1f77bcf86cd799439010",
    "collaborators": [],
    "createdAt": "2026-05-10T15:45:00.000Z",
    "updatedAt": "2026-05-10T15:45:00.000Z",
    "__v": 0
  }
}
```

**Error Response (400 - Missing Fields):**
```json
{
  "message": "Please provide title, startDate, and endDate."
}
```

**Error Response (400 - Invalid Date):**
```json
{
  "message": "Invalid startDate or endDate."
}
```

**Error Response (400 - End Before Start):**
```json
{
  "message": "End date must be on or after the start date."
}
```

### GET /api/trips/:id
**Request:**
```bash
GET /api/trips/507f1f77bcf86cd799439011
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "trip": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Summer Europe Adventure",
    "description": "Exploring France, Italy, and Spain",
    "startDate": "2026-06-01T00:00:00.000Z",
    "endDate": "2026-08-31T00:00:00.000Z",
    "coverImage": "https://example.com/image.jpg",
    "owner": "507f1f77bcf86cd799439010",
    "collaborators": [],
    "createdAt": "2026-05-10T10:30:00.000Z",
    "updatedAt": "2026-05-10T10:30:00.000Z",
    "__v": 0
  }
}
```

**Error Response (400 - Invalid ID):**
```json
{
  "message": "Invalid trip ID."
}
```

**Error Response (404 - Not Found):**
```json
{
  "message": "Trip not found."
}
```

### PATCH /api/trips/:id
**Request:**
```bash
PATCH /api/trips/507f1f77bcf86cd799439011
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "Summer Europe Grand Tour",
  "description": "Updated: 10 countries in 90 days"
}
```

**Success Response (200):**
```json
{
  "message": "Trip updated successfully.",
  "trip": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Summer Europe Grand Tour",
    "description": "Updated: 10 countries in 90 days",
    "startDate": "2026-06-01T00:00:00.000Z",
    "endDate": "2026-08-31T00:00:00.000Z",
    "coverImage": "https://example.com/image.jpg",
    "owner": "507f1f77bcf86cd799439010",
    "collaborators": [],
    "createdAt": "2026-05-10T10:30:00.000Z",
    "updatedAt": "2026-05-10T16:20:00.000Z",
    "__v": 0
  }
}
```

**Error Response (400 - No Changes):**
```json
{
  "message": "No valid fields to update. Allowed: title, description, startDate, endDate, coverImage."
}
```

**Error Response (400 - Invalid Field):**
```json
{
  "message": "End date must be on or after the start date."
}
```

### DELETE /api/trips/:id
**Request:**
```bash
DELETE /api/trips/507f1f77bcf86cd799439011
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "message": "Trip deleted successfully.",
  "trip": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Summer Europe Adventure",
    "description": "Exploring France, Italy, and Spain",
    "startDate": "2026-06-01T00:00:00.000Z",
    "endDate": "2026-08-31T00:00:00.000Z",
    "coverImage": "https://example.com/image.jpg",
    "owner": "507f1f77bcf86cd799439010",
    "collaborators": [],
    "createdAt": "2026-05-10T10:30:00.000Z",
    "updatedAt": "2026-05-10T10:30:00.000Z",
    "__v": 0
  }
}
```

**Error Response (404 - Not Found or Not Owner):**
```json
{
  "message": "Trip not found."
}
```

## Authentication Error Responses

### 401 - Missing Token
```json
{
  "message": "Access denied. No token provided."
}
```

### 401 - Invalid Token
```json
{
  "message": "Invalid token."
}
```

### 401 - Expired Token
```json
{
  "message": "Token expired. Please log in again."
}
```

## Frontend Response Parsing

The frontend handles all response variations:

```javascript
// Flexible response parsing in Trips component:

// GET /trips - expects { count, trips }
const tripsData = res.data?.trips || res.data?.data || res.data || []

// POST/PATCH /trips - expects { message, trip }
const newTrip = res.data?.trip || res.data?.data || res.data

// DELETE /trips - just needs successful status code
await api.delete(`/trips/${tripId}`)
```

This ensures compatibility with both the current backend format and potential future changes.
