# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Use React 19 route components for the four capabilities, with `src/api/client.ts` owning API URL construction and JSON fetch/error handling. Each view will expose explicit loading, empty, success, and accessible error states.
- Logic tier decision: Keep Express handlers thin and place validation and capability behavior in explicit service functions under `src/services`. Routes will expose only `/api/*` endpoints and convert invalid input or missing records into deliberate 4xx responses.
- Data tier decision: Define Mongoose schemas for users, teams, activities, and workouts with required fields and valid ObjectId references in `src/models`. Seed stable demo records with upserts and preserve unrelated records and team membership for existing demo fixtures.
- Activity tracking approach: Validate that `userId` and `teamId` are well-formed ObjectIds and reference existing records before creating an activity. Store references plus the submitted type and minutes, compute `points` from `minutes`, and set `occurredAt` to the creation time.
- Team management approach: Require a team name and mascot, default `members` to an empty array, and accept member ObjectId references. Return team and member data through the team service and reject missing names with `400`.
- Leaderboard approach: Aggregate activity `points` by team, sort descending, and return `teamName`, summed `totalPoints`, and a 1-based `rank` for each entry.
- Workout suggestions approach: Find the user by email and prioritize a workout matching their fitness goal or recent activity focus. Match recent run activity to endurance and strength activity to strength, include a reason tied to that pattern, and return a 4xx for an unknown email.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Current result: 4 of 5 tests fail. The seed/idempotency test passes; the four failures identify missing Mongoose required-field validation on `User`, `Team`, `Activity`, and `Workout`.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Current result: 4 of 4 tests fail. Activity/team POST routes return `501`, the leaderboard is empty, and workout suggestions are not ranked for Mona's endurance pattern.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - Current result: 15 of 15 tests fail. Routes still render the implementation placeholder, so loading, empty, success, error, and user-specific workout request behavior are absent.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - Current result: passes (`tsc --noEmit`).
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - Current result: passes (`tsc --noEmit` and Vite production build).
