# Trips Frontend-Backend Integration Guide

## Connection Status: ✅ CONNECTED

The Trips page (`frontend/client/src/pages/Trips.jsx`) is now fully integrated with the backend API.

## API Endpoint Mapping

### Backend Routes (`server/routes/tripRoutes.js`)
All routes require JWT authentication via `Authorization: Bearer <token>` header.

| Method | Endpoint | Controller | Response Format |
|--------|----------|-----------|-----------------|
| GET | `/api/trips` | `getTrips()` | `{ count, trips: Trip[] }` |
| POST | `/api/trips` | `createTrip()` | `{ message, trip: Trip }` |
| GET | `/api/trips/:id` | `getTripById()` | `{ trip: Trip }` |
| PATCH | `/api/trips/:id` | `updateTrip()` | `{ message, trip: Trip }` |
| DELETE | `/api/trips/:id` | `deleteTrip()` | `{ message, trip: Trip }` |

## Frontend API Integration

### Response Parsing
The frontend correctly handles all backend response formats:

```javascript
// GET /trips - Backend returns { count, trips }
const tripsData = res.data?.trips || res.data?.data || res.data || []

// POST /trips - Backend returns { message, trip }
const newTrip = res.data?.trip || res.data?.data || res.data

// PATCH /trips/:id - Backend returns { message, trip }
const updatedTrip = res.data?.trip || res.data?.data || res.data

// DELETE /trips/:id - Backend returns { message, trip }
await api.delete(`/trips/${tripId}`)
```

## Trip Model Schema

**MongoDB Collection:** `trips`

```javascript
{
  _id: ObjectId,                    // Auto-generated
  title: String,                    // Required
  description: String,              // Optional (default: "")
  startDate: Date,                  // Required (ISO8601)
  endDate: Date,                    // Required (ISO8601)
  coverImage: String,               // Optional (URL)
  owner: ObjectId,                  // User who created (Required)
  collaborators: [ObjectId],        // Array of user IDs (default: [])
  createdAt: Date,                  // Auto-generated
  updatedAt: Date                   // Auto-generated
}
```

## Access Control

### Trip Ownership & Permissions

**Reading Trips:**
- Users can read trips where they are:
  - The owner, OR
  - A collaborator

**Updating Trips:**
- Owner or collaborators can update: `title`, `description`, `startDate`, `endDate`, `coverImage`
- Cannot modify: `owner`, `collaborators` (handled by separate endpoints)

**Deleting Trips:**
- Only the trip owner can delete

**Query Logic:**
```javascript
// Get user's trips (owner or collaborator)
{
  $or: [
    { owner: userId },
    { collaborators: userId }
  ]
}
```

## Frontend State Management

### Trips Component State

```javascript
const [trips, setTrips] = useState([])              // All trips
const [loading, setLoading] = useState(true)        // Initial fetch
const [error, setError] = useState("")              // Error messages
const [savingId, setSavingId] = useState(null)      // Create/Edit ID
const [deletingId, setDeletingId] = useState(null)  // Delete ID
const [createDialogOpen, setCreateDialogOpen] = useState(false) // Modal state
```

### Data Flow

```
Fetch Trips
    ↓
GET /api/trips
    ↓
Parse response: res.data.trips
    ↓
Display in Grid
    ↓
User Action (Create/Edit/Delete)
    ↓
Submit to API
    ↓
Update Local State
    ↓
Re-render UI
```

## Setup Instructions

### Prerequisites
- ✅ Backend running on `http://localhost:5000` (or configured URL)
- ✅ MongoDB connected via `MONGODB_URI` env var
- ✅ Frontend running on `http://localhost:5173` (Vite)
- ✅ User authenticated with valid JWT token

### Environment Configuration

**Backend (.env):**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/traveloop
JWT_SECRET=your-secret-key
NODE_ENV=development
```

**Frontend (.env):**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Running the Application

**Terminal 1 - Start Backend:**
```bash
cd server
npm start
# Server running on http://localhost:5000
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend/client
npm run dev
# Frontend running on http://localhost:5173
```

## Testing the Integration

### 1. Manual Testing via UI

1. Open `http://localhost:5173/trips` (requires login)
2. Click "New Trip" button
3. Fill in form:
   - Title: "Summer Europe 2026"
   - Description: "Exploring European cities"
   - Start Date: 2026-06-01
   - End Date: 2026-08-31
4. Click "Create Trip" → Should see trip in grid
5. Click edit icon → Modify and save
6. Click delete icon → Confirm deletion

### 2. Testing via Browser DevTools

**Check Network Requests:**
1. Open DevTools → Network tab
2. Create/Edit/Delete a trip
3. Verify requests have `Authorization: Bearer <token>` header

**Check Response Format:**
```javascript
// GET /api/trips response
{
  "count": 3,
  "trips": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "title": "Summer Europe 2026",
      "description": "Exploring European cities",
      "startDate": "2026-06-01T00:00:00.000Z",
      "endDate": "2026-08-31T00:00:00.000Z",
      "owner": "65a1b2c3d4e5f6g7h8i9j0k0",
      "collaborators": [],
      "coverImage": "",
      "createdAt": "2026-05-10T10:00:00.000Z",
      "updatedAt": "2026-05-10T10:00:00.000Z"
    }
  ]
}
```

### 3. Testing via cURL

**Fetch Trips:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/trips
```

**Create Trip:**
```bash
curl -X POST http://localhost:5000/api/trips \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Trip",
    "description": "Test description",
    "startDate": "2026-06-01T00:00:00Z",
    "endDate": "2026-06-10T00:00:00Z"
  }'
```

**Update Trip:**
```bash
curl -X PATCH http://localhost:5000/api/trips/TRIP_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "description": "Updated description"
  }'
```

**Delete Trip:**
```bash
curl -X DELETE http://localhost:5000/api/trips/TRIP_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Error Handling

### Common HTTP Status Codes

| Status | Message | Cause | Solution |
|--------|---------|-------|----------|
| 200 | Success | Operation succeeded | None |
| 201 | Created | Trip created | None |
| 400 | Bad Request | Invalid data | Check request format |
| 401 | Unauthorized | No/invalid token | Login again |
| 404 | Not Found | Trip doesn't exist | Verify trip ID |
| 500 | Server Error | Database error | Check backend logs |

### Frontend Error Display
- Errors appear as red alert box at top of Trips page
- User can dismiss by closing error or trying again
- Error messages from backend are displayed directly

## Date Handling

### Frontend to Backend
```javascript
// Form input (YYYY-MM-DD)
startDate: "2026-06-01"

// Convert to ISO8601 for API
new Date("2026-06-01").toISOString()
// → "2026-06-01T00:00:00.000Z"

// Backend receives Date object
```

### Backend to Frontend
```javascript
// MongoDB stores as Date object
startDate: Date → "2026-06-01T00:00:00.000Z"

// Frontend receives ISO8601 string
formatDate(date) → "Jun 1, 2026"
```

## Features Breakdown

### 1. Fetch Trips
- ✅ GET request on component mount
- ✅ Filters trips user owns or collaborates on
- ✅ Sorts by newest first (createdAt DESC)
- ✅ Shows loading spinner
- ✅ Displays error if request fails

### 2. Create Trip
- ✅ Modal form with validation
- ✅ Validates: title, startDate, endDate
- ✅ Validates: endDate >= startDate
- ✅ POST to `/api/trips`
- ✅ Adds new trip to state (prepends to list)
- ✅ Closes modal on success

### 3. Edit Trip
- ✅ Pre-populates form with trip data
- ✅ PATCH to `/api/trips/:id`
- ✅ Updates trip in state immutably
- ✅ Same validation as create

### 4. Delete Trip
- ✅ Confirmation dialog
- ✅ Shows trip title in confirmation
- ✅ DELETE to `/api/trips/:id`
- ✅ Removes trip from state
- ✅ Only owner can delete (backend enforces)

### 5. Status Badges
- ✅ Completed (date in past)
- ✅ In Progress (active date range)
- ✅ Starting Today (start date = today)
- ✅ Tomorrow (start date = tomorrow)
- ✅ Upcoming (within 30 days)

## Future Enhancements

### Short Term
- [ ] Add collaborator invite system (uses collaborationRoutes)
- [ ] Add budget tracking integration
- [ ] Add itinerary preview
- [ ] Add packing list preview

### Medium Term
- [ ] Trip sharing with email invite
- [ ] Real-time collaboration
- [ ] Trip analytics dashboard
- [ ] Export trip to PDF

### Long Term
- [ ] Mobile app sync
- [ ] Offline support
- [ ] Social features (share trips, follow travelers)
- [ ] AI-powered trip suggestions

## Troubleshooting

### Trips Not Loading

**Check 1: Is backend running?**
```bash
curl http://localhost:5000
# Should return "Traveloop Backend Running"
```

**Check 2: Is MongoDB connected?**
```bash
# Check server logs for connection message
# Look for: "Connected to MongoDB"
```

**Check 3: Is auth token valid?**
```javascript
// Check in browser console
localStorage.getItem('authToken')
// Should return a long JWT string
```

### API Responses Showing Errors

**401 Unauthorized:**
- Token expired or invalid
- Clear localStorage and login again
- Check `Authorization` header in Network tab

**404 Trip Not Found:**
- Trip was deleted
- User lacks access permissions
- Verify trip ID is correct

**400 Bad Request:**
- Invalid date format
- Missing required fields
- Check request body in Network tab

### Modals Not Responding

- Check Dialog components import correctly
- Verify DialogTrigger is connected to Dialog
- Check browser console for React errors
- Try hard refresh (Ctrl+Shift+R)

## Files Modified/Created

### Created
- `frontend/client/src/pages/Trips.jsx` (Main component)

### Modified  
- `frontend/client/src/App.jsx` (Added Trips route)

### Backend Files (Reference)
- `server/models/Trip.js` (Trip schema)
- `server/routes/tripRoutes.js` (API routes)
- `server/controllers/tripController.js` (Business logic)
- `server/middleware/authMiddleware.js` (Auth protection)
- `server/utils/tripAccess.js` (Access control)

## Notes

- The Trip model includes `timestamps: true` for `createdAt` and `updatedAt`
- Frontend displays trips sorted by newest first
- Backend enforces access control per user
- All dates are stored as ISO8601 in MongoDB
- Delete operation is owner-only (non-collaborators cannot delete)
- Update operation allows owner and collaborators to modify trip details
