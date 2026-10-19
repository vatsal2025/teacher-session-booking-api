# Teacher Session Booking API

Backend for a platform where users can book sessions with teachers. Teachers create
available sessions, users book them, and completed sessions appear in the user's history.

## Tech Stack

- Node.js + TypeScript
- Express.js
- MongoDB + Mongoose

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment file and set your MongoDB connection string:

   ```bash
   cp .env.example .env
   ```

   ```
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/teacher_sessions
   ```

3. (Optional) Seed a sample teacher so you can create sessions immediately:

   ```bash
   npm run seed
   ```

4. Run the server:

   ```bash
   npm run dev        # development (ts-node-dev)
   # or
   npm run build && npm start
   ```

The API listens on `http://localhost:5000` by default. A Postman collection
(`postman_collection.json`) is included for testing all endpoints.

## Data Models

- **User** - fullName, email (unique), phone, timestamps
- **Teacher** - fullName, email, specialization, experience, timestamps
- **Session** - teacherId, userId (nullable), startTime, endTime,
  status (AVAILABLE / BOOKED / COMPLETED), completedAt, timestamps

## API Endpoints

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 1 | POST | `/users` | Create a user (email must be unique) |
| 2 | POST | `/sessions` | Create a session for a teacher (defaults to AVAILABLE, validates teacher and `endTime > startTime`) |
| 3 | GET | `/sessions/available?dateTimestamp=<epoch ms>` | All AVAILABLE sessions on that date (aggregation pipeline) |
| 4 | POST | `/sessions/:id/book` | Book a session (`{ "userId": "..." }`; only AVAILABLE sessions) |
| 5 | PATCH | `/sessions/:id/complete` | Mark a BOOKED session COMPLETED (sets `completedAt`) |
| 6 | GET | `/users/:id/sessions` | User's sessions split into upcoming and completed (aggregation pipeline) |

### Sample requests

Create a user:

```bash
curl -X POST http://localhost:5000/users \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Rahul Verma","email":"rahul@example.com","phone":"9876543210"}'
```

Create a session (needs an existing teacherId):

```bash
curl -X POST http://localhost:5000/sessions \
  -H "Content-Type: application/json" \
  -d '{"teacherId":"<teacherId>","startTime":"2026-10-25T10:00:00.000Z","endTime":"2026-10-25T11:00:00.000Z"}'
```

List available sessions for a date:

```bash
curl "http://localhost:5000/sessions/available?dateTimestamp=1761379200000"
```

Book a session:

```bash
curl -X POST http://localhost:5000/sessions/<sessionId>/book \
  -H "Content-Type: application/json" \
  -d '{"userId":"<userId>"}'
```

Mark a session complete:

```bash
curl -X PATCH http://localhost:5000/sessions/<sessionId>/complete
```

Get a user's sessions:

```bash
curl http://localhost:5000/users/<userId>/sessions
```

## Project Structure

```
src/
  config/       environment configuration
  models/       Mongoose schemas (User, Teacher, Session)
  controllers/  request handlers
  routes/       Express routers
  middleware/   centralized error handler
  scripts/      seed script
  app.ts        Express app setup
  server.ts     DB connection + server bootstrap
```

## Notes

- Errors are returned as `{ "success": false, "message": "..." }` with proper
  HTTP status codes (400 validation, 404 not found, 409 conflict, 500 server).
- All handlers are async/await and forward errors to a centralized error handler.
- Configuration comes from environment variables (see `.env.example`).
