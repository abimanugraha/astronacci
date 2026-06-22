# Agent Prompt: PHP Laravel Backend Development Task

## 1. Context & Goal
You are an expert Laravel Developer. Build a RESTful API using the latest stable version of Laravel (latest) with an SQLite database. The system randomly assigns exactly 3 non-repeating valid seat numbers to voucher winners based on the aircraft layout, while strictly preventing duplicate assignments for the same flight on the same date.

## 2. Database & Migration Configuration
- Use **SQLite** as the database driver (`DB_CONNECTION=sqlite`).
- Create a migration using `php artisan make:migration create_vouchers_table` with the following schema:
  - `id` (BIGINT, Primary Key, Auto Increment)
  - `crew_name` (VARCHAR, NOT NULL)
  - `crew_id` (VARCHAR, NOT NULL)
  - `flight_number` (VARCHAR, NOT NULL)
  - `flight_date` (VARCHAR, NOT NULL)
  - `aircraft_type` (VARCHAR, NOT NULL)
  - `seat1`, `seat2`, `seat3` (VARCHAR, NOT NULL)
  - Timestamps (`created_at`, `updated_at`)
- **Bonus Requirement:** Implement a unique composite constraint on `flight_number` + `flight_date` at the database level to maintain structural integrity.

## 3. Business Logic: Seat Layout Matrix
Implement the seat generation logic inside a dedicated Service Class: `App\Services\SeatGeneratorService`. The randomizer must *only* pick from valid combinations defined below:
- **ATR:** Rows `1` to `18`. Valid seats per row: `A`, `C`, `D`, `F` (Seats `B` and `E` do not exist. E.g., `5B` is invalid).
- **Airbus 320:** Rows `1` to `32`. Valid seats per row: `A`, `B`, `C`, `D`, `E`, `F`.
- **Boeing 737 Max:** Rows `1` to `32`. Valid seats per row: `A`, `B`, `C`, `D`, `E`, `F`.

*Algorithm:* Generate all valid seats for the chosen aircraft type, shuffle them, and pick exactly 3 unique, non-repeating seats.

## 4. REST API Endpoints (routes/api.php)

### 1. `POST /api/check`
- **Purpose:** Check if a flight code already has vouchers on that specific date.
- **Validation:** Use a custom Form Request.
- **Logic:** Query database for matching `flight_number` and `flight_date`.
- **Response:** JSON format indicating existence (`{ "exists": true/false, "message": "..." }`).

### 2. `POST /api/generate`
- **Purpose:** Validate, invoke `SeatGeneratorService`, save to SQLite, and return data.
- **Validation:** Use a custom Form Request with custom error messages (Bonus). Meticulously validate that `aircraft_type` matches options.
- **Data Transformation:** Use a Laravel **API Resource** class to format the JSON payload output uniformly.

## 5. Architectural & Code Quality Rules
- No raw SQL queries; interact strictly via **Eloquent ORM**.
- Keep controllers lean; decouple logic cleanly to the service layer.
- Ensure proper **CORS middleware configuration** so the React frontend can fetch data without blockages.
- **Bonus Point Requirements:** - Write automated tests inside `tests/Feature/VoucherApiTest.php` using `php artisan test`.
  - Provide a standard `Dockerfile` or `docker-compose.yml` (or Laravel Sail boilerplate setup) for immediate containerized deployment.
