# Database Schema

## Tables

### users
Extends Supabase auth.users with additional profile information.

| Column     | Type      | Description                    |
|------------|-----------|--------------------------------|
| id         | UUID      | Primary key (from auth.users)  |
| name       | TEXT      | User's display name            |
| email      | TEXT      | User's email address           |
| avatar_url | TEXT      | URL to user's profile image    |
| created_at | TIMESTAMP | Record creation timestamp      |
| updated_at | TIMESTAMP | Record last update timestamp   |

### locations
Stores saved map locations.

| Column     | Type      | Description                    |
|------------|-----------|--------------------------------|
| id         | UUID      | Primary key                    |
| user_id    | UUID      | Foreign key to users.id        |
| name       | TEXT      | Location name                  |
| lat        | DOUBLE    | Latitude coordinate            |
| lng        | DOUBLE    | Longitude coordinate           |
| is_public  | BOOLEAN   | Public visibility flag         |
| created_at | TIMESTAMP | Record creation timestamp      |
| updated_at | TIMESTAMP | Record last update timestamp   |

### routes
Stores saved routes.

| Column      | Type      | Description                    |
|-------------|-----------|--------------------------------|
| id          | UUID      | Primary key                    |
| user_id     | UUID      | Foreign key to users.id        |
| name        | TEXT      | Route name                     |
| description | TEXT      | Route description              |
| is_public   | BOOLEAN   | Public visibility flag         |
| created_at  | TIMESTAMP | Record creation timestamp      |
| updated_at  | TIMESTAMP | Record last update timestamp   |

### route_points
Stores waypoints for routes.

| Column       | Type      | Description                    |
|--------------|-----------|--------------------------------|
| id           | UUID      | Primary key                    |
| route_id     | UUID      | Foreign key to routes.id       |
| lat          | DOUBLE    | Latitude coordinate            |
| lng          | DOUBLE    | Longitude coordinate           |
| order_index  | INTEGER   | Waypoint order in route        |
| name         | TEXT      | Optional waypoint name         |
| created_at   | TIMESTAMP | Record creation timestamp      |

## Relationships

- `users` ← one-to-many → `locations`
- `users` ← one-to-many → `routes`
- `routes` ← one-to-many → `route_points`

## Row-Level Security (RLS)

The database uses Supabase RLS policies to control data access:

### locations
- Users can view all public locations
- Users can only view, edit, and delete their own private locations
- Users can only create locations with their own user_id

### routes
- Users can view all public routes
- Users can only view, edit, and delete their own private routes
- Users can only create routes with their own user_id

### route_points
- Users can view points for public routes
- Users can only view, edit, and delete points for their own routes
- Users can only create points for their own routes
