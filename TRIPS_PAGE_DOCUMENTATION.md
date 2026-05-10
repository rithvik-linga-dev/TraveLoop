# Trips Page Documentation

## Overview

The **Trips** page is a professional Odoo-style component that manages travel trips for the Traveloop application. It provides a complete CRUD interface with responsive cards, modal forms, and deletion confirmations.

## Features

### 1. **Trip Display**
- Responsive grid layout (1 column mobile, 2 columns tablet, 3 columns desktop)
- Individual trip cards showing:
  - Trip title and description
  - Start and end dates with duration
  - Collaborators count
  - Budget summary
  - Destination
  - Smart status badges (Upcoming, In Progress, Completed, Starting Today, Tomorrow)

### 2. **Create Trip**
- Modal dialog form with fields:
  - Trip title (required)
  - Description (optional)
  - Start date (required)
  - End date (required)
- Form validation with error messages
- Loading state during submission

### 3. **Edit Trip**
- In-place edit button on each card
- Pre-populated modal with existing data
- Same validation as create form
- PATCH request to update trip

### 4. **Delete Trip**
- Delete button on each card
- Confirmation dialog to prevent accidental deletion
- Shows trip title in confirmation message
- DELETE request removes trip from list

### 5. **Loading & Empty States**
- Loading spinner while fetching trips
- Empty state UI with illustration when no trips exist
- Error message display for API failures

### 6. **Responsive Design**
- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-friendly button sizes
- Collapsible navigation on mobile

## Technical Implementation

### Component Structure

```
Trips (Main Component)
├── useEffect (fetch trips on mount)
├── State Management
│   ├── trips: Trip[]
│   ├── loading: boolean
│   ├── error: string
│   ├── savingId: string | null
│   └── deletingId: string | null
├── API Operations
│   ├── fetchTrips() → GET /api/trips
│   ├── handleCreateTrip() → POST /api/trips
│   ├── handleEditTrip() → PATCH /api/trips/:id
│   └── handleDeleteTrip() → DELETE /api/trips/:id
└── Sub-Components
    ├── TripFormDialog (Create/Edit)
    ├── DeleteConfirmDialog
    └── TripCard (Display)
```

### Status Badge Logic

The component includes intelligent status detection:

| Status | Condition | Appearance |
|--------|-----------|------------|
| **Completed** | Start date < today AND end date < today | Gray badge |
| **In Progress** | Start date < today AND end date ≥ today | Blue animated pulse |
| **Starting Today** | Start date = today | Amber animated pulse |
| **Tomorrow** | Start date = tomorrow | Amber badge |
| **Upcoming** | 0 < days until start ≤ 30 | Blue badge |

### API Integration

The component uses the existing `api` instance from `@/lib/api.js` which:
- Automatically includes Authorization header
- Normalizes API paths
- Extracts error messages

**Expected API Response Format:**
```javascript
// GET /trips
{
  data: [
    {
      _id: string,
      title: string,
      description?: string,
      startDate: ISO8601 string,
      endDate: ISO8601 string,
      destination?: string,
      budget?: number,
      collaborators?: User[]
    }
  ]
}

// POST/PATCH /trips/:id
{
  data: { /* trip object */ }
}
```

## Styling & Design

### Odoo-Style Design Elements
- Clean, minimalist card layout
- Professional color scheme
- Uppercase labels for hierarchy
- Consistent spacing and padding
- Smooth transitions and animations
- Ring shadows for depth

### Tailwind CSS Classes Used
- `space-y-*` for vertical spacing
- `grid` with responsive `grid-cols`
- `flex` with `gap` for layout
- Custom ring and shadow utilities
- `animate-pulse` for live updates
- `line-clamp-*` for text truncation

### shadcn/ui Components
- `Card` - Trip display container
- `Dialog` - Modal forms
- `Button` - Interactive actions
- `Input` - Form fields

## Component API

### Props

None - Trips is a standalone page component

### State

- `trips: Trip[]` - Array of trip objects
- `loading: boolean` - Initial data fetch status
- `error: string` - Error message display
- `savingId: string | null` - ID of trip being saved
- `deletingId: string | null` - ID of trip being deleted
- `createDialogOpen: boolean` - Create modal visibility

### Methods

#### `fetchTrips()`
Fetches all trips from the API and populates the trips state.

#### `handleCreateTrip(formData)`
Creates a new trip and adds it to the state.
- **Params:** `{ title, description, startDate, endDate }`
- **API:** `POST /api/trips`

#### `handleEditTrip(tripId, formData)`
Updates an existing trip.
- **Params:** `tripId` (string), `formData` (object with trip fields)
- **API:** `PATCH /api/trips/:id`

#### `handleDeleteTrip(tripId)`
Deletes a trip by ID.
- **Params:** `tripId` (string)
- **API:** `DELETE /api/trips/:id`

## Usage

### Import
```javascript
import Trips from "@/pages/Trips"
```

### In App Router
```javascript
<Route path="/trips" element={<Trips />} />
```

## Validation Rules

### Trip Form Validation
- **Title:** Required, must not be empty
- **Start Date:** Required, must be a valid date
- **End Date:** Required, must be a valid date
- **Date Range:** End date must be ≥ start date

Validation errors are displayed inline with Aria attributes for accessibility.

## Accessibility

- `aria-invalid` on invalid inputs
- `aria-describedby` for error messages
- `aria-hidden` for decorative icons
- `sr-only` for screen reader only text
- Semantic HTML (form, labels, buttons)
- Keyboard navigation support
- High contrast error states

## Performance Considerations

1. **Memoization:** `useCallback` for `fetchTrips` prevents re-renders
2. **Conditional Rendering:** Only render modals when open
3. **Efficient State Updates:** Immutable state patterns
4. **Loading States:** Prevent double submissions with `savingId` tracking

## Common Tasks

### Add a New Field to Trip Cards

1. Update API response handling (if needed)
2. Add display logic in `TripCard` component
3. Add form field in `TripFormDialog` if needed
4. Update type definitions

Example:
```javascript
// In TripCard
{trip.customField && (
  <div className="flex items-center gap-2 text-muted-foreground">
    <CustomIcon className="size-4 flex-shrink-0" aria-hidden />
    <span>{trip.customField}</span>
  </div>
)}
```

### Customize Status Badges

Edit the `getStatusBadge()` method in `TripCard` component to add new status conditions or modify existing ones.

### Change Grid Layout

Modify the grid classes in the main render:
```javascript
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
```

Change to:
- `lg:grid-cols-4` for 4-column layout
- `md:grid-cols-2` for different tablet layout

## Troubleshooting

### Trips Not Loading
- Check backend API is running on correct port
- Verify `VITE_API_BASE_URL` environment variable
- Check network tab for API errors
- Ensure auth token is valid

### Dates Not Formatting Correctly
- Verify backend returns ISO8601 format dates
- Check browser timezone settings
- Inspect `formatDate()` function in `TripCard`

### Modals Not Opening
- Check Dialog components are imported correctly
- Verify DialogTrigger is properly connected to Dialog
- Check for z-index conflicts with other elements

### Delete Not Working
- Verify `trip._id` exists and is unique
- Check API DELETE endpoint responds with correct status
- Verify auth token has delete permissions

## Future Enhancements

- [ ] Sorting and filtering options
- [ ] Search functionality
- [ ] Bulk actions (delete multiple)
- [ ] Export to calendar
- [ ] Share trip with collaborators
- [ ] Duplicate trip functionality
- [ ] Trip templates
- [ ] Rich text editor for description
- [ ] Image uploads for trip banner
- [ ] Trip statistics and analytics
