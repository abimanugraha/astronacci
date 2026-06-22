# Voucher Seat Assignment API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Laravel REST API that assigns exactly 3 random, non-repeating, valid aircraft seats to voucher winners per flight+date, with database-level duplicate prevention.

**Architecture:** Lean controllers → Form Requests for validation → `SeatGeneratorService` for the seat-randomization domain logic → Eloquent model persisted in SQLite → API Resource for uniform JSON output. Composite unique constraint on (`flight_number`, `flight_date`) enforces "one voucher per flight per date" at the DB layer.

**Tech Stack:** Laravel 11.x, PHP 8.2+, SQLite, Composer, Docker (docker-compose), PHPUnit (`php artisan test`).

## Global Constraints

- **PHP:** 8.2+ (host has 8.2.30 — use this, do not upgrade PHP requirement beyond 8.2).
- **Laravel:** latest stable via `composer create-project laravel/laravel` (currently 12.x on PHP 8.2).
- **Database:** SQLite only. `DB_CONNECTION=sqlite`. No MySQL/Postgres.
- **ORM only:** no raw SQL anywhere — migrations use Schema builder, queries use Eloquent.
- **Aircraft types — exact string keys:** `"ATR"`, `"Airbus 320"`, `"Boeing 737 Max"`. These are the values accepted by the API and used by `SeatGeneratorService`.
- **Seat matrices (verbatim from spec):**
  - ATR: rows `1`–`18`, letters `A`, `C`, `D`, `F` (B and E do NOT exist).
  - Airbus 320: rows `1`–`32`, letters `A`, `B`, `C`, `D`, `E`, `F`.
  - Boeing 737 Max: rows `1`–`32`, letters `A`, `B`, `C`, `D`, `E`, `F`.
- **3 seats per voucher:** unique within the voucher, drawn from valid set only.
- **Unique composite constraint:** `flight_number` + `flight_date` (one voucher per flight per date).
- **Naming:** keep classes/files exactly as the spec names them (`SeatGeneratorService`, `VoucherResource`, `VoucherApiTest`, `vouchers` table).
- **CORS:** must allow a React frontend (default Vite dev origin `http://localhost:5173` and `http://localhost:3000`).
- **TDD:** every behavior step is "write failing test → run (FAIL) → implement → run (PASS) → commit".

---

## File Structure

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── VoucherController.php          # check() + generate()
│   │   ├── Requests/
│   │   │   ├── CheckVoucherRequest.php        # validates POST /api/check input
│   │   │   └── GenerateVoucherRequest.php     # validates POST /api/generate input
│   │   └── Resources/
│   │       └── VoucherResource.php            # uniform JSON shape
│   ├── Models/
│   │   └── Voucher.php                        # Eloquent model, $fillable
│   └── Services/
│       └── SeatGeneratorService.php           # aircraft seat matrix + draw 3
├── database/
│   └── migrations/
│       └── 2026_06_22_000000_create_vouchers_table.php   # composite unique index
├── routes/
│   └── api.php                                 # POST /check, POST /generate
├── config/
│   └── cors.php                                # allows localhost:5173 + :3000
├── tests/
│   ├── Feature/
│   │   ├── SeatGeneratorServiceTest.php        # unit-style feature tests for service
│   │   └── VoucherApiTest.php                  # end-to-end HTTP tests
│   └── TestCase.php                            # (ships with Laravel)
├── Dockerfile
├── docker-compose.yml
├── .env                                        # DB_CONNECTION=sqlite
└── composer.json
```

Responsibilities:
- `Voucher.php` — Eloquent model, `$fillable`, no business logic.
- `SeatGeneratorService.php` — pure domain logic; given an aircraft type, returns 3 unique valid seats. No DB access.
- `CheckVoucherRequest.php` / `GenerateVoucherRequest.php` — validation only.
- `VoucherController.php` — orchestration only; calls service + model + resource.
- `VoucherResource.php` — shapes output JSON; one place to change if payload evolves.
- `VoucherApiTest.php` — HTTP-level integration; `SeatGeneratorServiceTest.php` — unit-level matrix/draw checks.

---

## Task 1: Scaffold Laravel Project, SQLite, and Docker

**Files:**
- Create (via composer): everything in a fresh Laravel install under `/home/apps/astronacci/backend/`
- Modify: `.env` → SQLite config
- Create: `Dockerfile`, `docker-compose.yml`, `README.md`
- Preserve: `backend.md` (the spec) — move out, scaffold, move back

**Interfaces:**
- Consumes: nothing (greenfield).
- Produces: a bootable Laravel app where `php artisan migrate` works against SQLite and `php artisan test` passes the default example tests. Later tasks add migrations/models/routes on top.

- [ ] **Step 1: Move `backend.md` out so `composer create-project` can install into an empty dir**

```bash
mv /home/apps/astronacci/backend/backend.md /tmp/backend.md
ls -la /home/apps/astronacci/backend/
```
Expected: directory is empty.

- [ ] **Step 2: Install latest Laravel into the backend dir**

```bash
composer create-project laravel/laravel /home/apps/astronacci/backend --prefer-dist
```
Expected: finishes with `Application key set successfully.` and a working Laravel skeleton.

- [ ] **Step 3: Move `backend.md` back into the project**

```bash
mv /tmp/backend.md /home/apps/astronacci/backend/backend.md
```

- [ ] **Step 4: Configure `.env` for SQLite**

Open `/home/apps/astronacci/backend/.env` and make the DB section look exactly like this (delete `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` if present):

```
DB_CONNECTION=sqlite
DB_HOST=
DB_PORT=
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=
```

Then create the SQLite file and ensure the default migration works:

```bash
touch /home/apps/astronacci/backend/database/database.sqlite
cd /home/apps/astronacci/backend && php artisan migrate
```
Expected: `Migration table created successfully.` plus Laravel's default migrations (users, password_reset_tokens, etc.) run without errors.

- [ ] **Step 5: Register `routes/api.php` with the application (Laravel 11 does not load it by default)**

Open `/home/apps/astronacci/backend/bootstrap/app.php`. Find the `->withRouting(...)` call and add the `api:` line so the result looks like:

```php
->withRouting(
    web: __DIR__.'/../routes/web.php',
    api: __DIR__.'/../routes/api.php',
    commands: __DIR__.'/../routes/console.php',
    health: '/up',
)
```

Then create an empty `routes/api.php` placeholder so the file exists (Task 5 will populate it):

```php
<?php

use Illuminate\Support\Facades\Route;

// Voucher API routes are registered in Task 5.
```

Verify it loads:
```bash
cd /home/apps/astronacci/backend && php artisan route:list
```
Expected: command exits 0, no errors. (It will list the default Laravel routes; `/api` routes will appear after Task 5.)

- [ ] **Step 6: Run the default test suite to verify the harness works**

```bash
cd /home/apps/astronacci/backend && php artisan test
```
Expected: default Laravel tests PASS (Pest or PHPUnit depending on scaffold).

- [ ] **Step 7: Write `Dockerfile`**

Create `/home/apps/astronacci/backend/Dockerfile` with this exact content:

```dockerfile
FROM php:8.2-cli

WORKDIR /var/www/html

# System deps + PHP extensions required by Laravel
RUN apt-get update && apt-get install -y \
    git curl libpng-dev libonig-dev libxml2-dev libzip-dev unzip sqlite3 \
    && docker-php-ext-install pdo_sqlite mbstring exif pcntl bcmath gd zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2.9 /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts || true

COPY . .

RUN composer install --no-dev --optimize-autoloader

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
```

- [ ] **Step 8: Write `docker-compose.yml`**

Create `/home/apps/astronacci/backend/docker-compose.yml`:

```yaml
services:
  app:
    build: .
    image: astronacci-backend:latest
    container_name: astronacci-backend
    ports:
      - "8000:8000"
    volumes:
      - ./:/var/www/html
    environment:
      - DB_CONNECTION=sqlite
    command: php artisan serve --host=0.0.0.0 --port=8000
```

- [ ] **Step 9: Verify Docker build succeeds**

```bash
cd /home/apps/astronacci/backend && docker compose build
```
Expected: image builds without errors (may print warnings about Composer scripts; this is fine).

- [ ] **Step 10: Initialize git and commit the scaffold**

```bash
cd /home/apps/astronacci/backend
git init
git add .
git commit -m "chore: scaffold Laravel project with SQLite and Docker"
```
Expected: one commit with the full Laravel skeleton + Dockerfile + docker-compose.yml.

---

## Task 2: Vouchers Migration and Model with Composite Unique Constraint

**Files:**
- Create: `database/migrations/2026_06_22_000000_create_vouchers_table.php`
- Create: `app/Models/Voucher.php`
- Test: `tests/Feature/VoucherModelTest.php`

**Interfaces:**
- Consumes: nothing.
- Produces: `Voucher` Eloquent model with fillable fields `crew_name`, `crew_id`, `flight_number`, `flight_date`, `aircraft_type`, `seat1`, `seat2`, `seat3`. Table `vouchers` has a composite unique index on (`flight_number`, `flight_date`). The `aircraft_type` column accepts one of `"ATR"`, `"Airbus 320"`, `"Boeing 737 Max"`.

- [ ] **Step 1: Write the failing test**

Create `/home/apps/astronacci/backend/tests/Feature/VoucherModelTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VoucherModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_voucher_can_be_created_with_all_fields(): void
    {
        $voucher = Voucher::create([
            'crew_name' => 'Jane Doe',
            'crew_id' => 'C001',
            'flight_number' => 'GA101',
            'flight_date' => '2026-06-22',
            'aircraft_type' => 'ATR',
            'seat1' => '1A',
            'seat2' => '2C',
            'seat3' => '3D',
        ]);

        $this->assertDatabaseHas('vouchers', [
            'crew_name' => 'Jane Doe',
            'flight_number' => 'GA101',
            'seat1' => '1A',
        ]);
    }

    public function test_composite_unique_constraint_rejects_duplicate_flight_and_date(): void
    {
        Voucher::create([
            'crew_name' => 'Jane',
            'crew_id' => 'C001',
            'flight_number' => 'GA101',
            'flight_date' => '2026-06-22',
            'aircraft_type' => 'ATR',
            'seat1' => '1A', 'seat2' => '2C', 'seat3' => '3D',
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);

        Voucher::create([
            'crew_name' => 'Other Crew',
            'crew_id' => 'C002',
            'flight_number' => 'GA101',
            'flight_date' => '2026-06-22',
            'aircraft_type' => 'ATR',
            'seat1' => '4A', 'seat2' => '5C', 'seat3' => '6D',
        ]);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/apps/astronacci/backend && php artisan test --filter=VoucherModelTest
```
Expected: FAIL with `Class "App\Models\Voucher" not found` and/or "table vouchers not found".

- [ ] **Step 3: Create the migration**

```bash
cd /home/apps/astronacci/backend && php artisan make:migration create_vouchers_table
```

Open the generated file `database/migrations/2026_06_22_000000_create_vouchers_table.php` and replace its `up()` method body with:

```php
public function up(): void
{
    Schema::create('vouchers', function (Blueprint $table) {
        $table->id();
        $table->string('crew_name');
        $table->string('crew_id');
        $table->string('flight_number');
        $table->string('flight_date');
        $table->string('aircraft_type');
        $table->string('seat1');
        $table->string('seat2');
        $table->string('seat3');
        $table->timestamps();

        // Composite unique constraint — one voucher per flight per date, DB-enforced.
        $table->unique(['flight_number', 'flight_date'], 'vouchers_flight_date_unique');
    });
}
```

Leave the `down()` method as `Schema::dropIfExists('vouchers');`.

- [ ] **Step 4: Create the model**

Create `/home/apps/astronacci/backend/app/Models/Voucher.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Voucher extends Model
{
    use HasFactory;

    protected $fillable = [
        'crew_name',
        'crew_id',
        'flight_number',
        'flight_date',
        'aircraft_type',
        'seat1',
        'seat2',
        'seat3',
    ];
}
```

- [ ] **Step 5: Run migration then re-run tests**

```bash
cd /home/apps/astronacci/backend && php artisan migrate:fresh && php artisan test --filter=VoucherModelTest
```
Expected: 2 tests PASS.

- [ ] **Step 6: Commit**

```bash
cd /home/apps/astronacci/backend
git add app/Models/Voucher.php database/migrations/2026_06_22_000000_create_vouchers_table.php tests/Feature/VoucherModelTest.php
git commit -m "feat: add Voucher model and vouchers migration with composite unique constraint"
```

---

## Task 3: SeatGeneratorService (the domain core)

**Files:**
- Create: `app/Services/SeatGeneratorService.php`
- Test: `tests/Feature/SeatGeneratorServiceTest.php`

**Interfaces:**
- Consumes: nothing.
- Produces: `SeatGeneratorService::draw(string $aircraftType): array` — returns an array of exactly 3 strings, each a valid seat (e.g., `["5A", "12D", "1F"]`), all unique. Throws `\InvalidArgumentException` for unknown aircraft types. Valid `$aircraftType` values: `"ATR"`, `"Airbus 320"`, `"Boeing 737 Max"`.

- [ ] **Step 1: Write the failing tests**

Create `/home/apps/astronacci/backend/tests/Feature/SeatGeneratorServiceTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Services\SeatGeneratorService;
use Tests\TestCase;

class SeatGeneratorServiceTest extends TestCase
{
    private SeatGeneratorService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new SeatGeneratorService();
    }

    public function test_draw_returns_exactly_three_seats(): void
    {
        $seats = $this->service->draw('ATR');

        $this->assertCount(3, $seats);
    }

    public function test_draw_returns_unique_seats(): void
    {
        $seats = $this->service->draw('Airbus 320');

        $this->assertEquals(3, count(array_unique($seats)));
    }

    public function test_atr_seats_only_use_valid_letters_and_rows(): void
    {
        // Run multiple draws to exercise the shuffler.
        for ($i = 0; $i < 50; $i++) {
            $seats = $this->service->draw('ATR');

            foreach ($seats as $seat) {
                preg_match('/^(\d+)([A-Z])$/', $seat, $m);
                $this->assertNotEmpty($m, "ATR seat '{$seat}' is not in <row><letter> format");
                [$row, $letter] = [(int) $m[1], $m[2]];

                $this->assertGreaterThanOrEqual(1, $row);
                $this->assertLessThanOrEqual(18, $row);
                $this->assertContains($letter, ['A', 'C', 'D', 'F'], "ATR seat '{$seat}' has invalid letter");
                $this->assertNotContains($letter, ['B', 'E'], "ATR must never produce B or E");
            }
        }
    }

    public function test_airbus_320_seats_use_valid_letters_and_rows(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $seats = $this->service->draw('Airbus 320');

            foreach ($seats as $seat) {
                preg_match('/^(\d+)([A-Z])$/', $seat, $m);
                [$row, $letter] = [(int) $m[1], $m[2]];

                $this->assertGreaterThanOrEqual(1, $row);
                $this->assertLessThanOrEqual(32, $row);
                $this->assertContains($letter, ['A', 'B', 'C', 'D', 'E', 'F']);
            }
        }
    }

    public function test_boeing_737_max_seats_use_valid_letters_and_rows(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $seats = $this->service->draw('Boeing 737 Max');

            foreach ($seats as $seat) {
                preg_match('/^(\d+)([A-Z])$/', $seat, $m);
                [$row, $letter] = [(int) $m[1], $m[2]];

                $this->assertGreaterThanOrEqual(1, $row);
                $this->assertLessThanOrEqual(32, $row);
                $this->assertContains($letter, ['A', 'B', 'C', 'D', 'E', 'F']);
            }
        }
    }

    public function test_unknown_aircraft_type_throws(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->service->draw('Boeing 747');
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/apps/astronacci/backend && php artisan test --filter=SeatGeneratorServiceTest
```
Expected: FAIL with `Class "App\Services\SeatGeneratorService" not found`.

- [ ] **Step 3: Implement the service**

Create `/home/apps/astronacci/backend/app/Services/SeatGeneratorService.php`:

```php
<?php

namespace App\Services;

class SeatGeneratorService
{
    /**
     * Aircraft seat matrices. Keys are the exact aircraft_type strings
     * accepted by the API. Letters are the only valid seat letters for
     * that aircraft (ATR has no B or E).
     */
    private const SEAT_MATRIX = [
        'ATR' => [
            'rows' => [1, 18],
            'letters' => ['A', 'C', 'D', 'F'],
        ],
        'Airbus 320' => [
            'rows' => [1, 32],
            'letters' => ['A', 'B', 'C', 'D', 'E', 'F'],
        ],
        'Boeing 737 Max' => [
            'rows' => [1, 32],
            'letters' => ['A', 'B', 'C', 'D', 'E', 'F'],
        ],
    ];

    /**
     * Draw exactly 3 unique, non-repeating valid seats for the given aircraft.
     *
     * @return string[] Always length 3, e.g. ["5A", "12D", "1F"].
     *
     * @throws \InvalidArgumentException If $aircraftType is unknown.
     */
    public function draw(string $aircraftType): array
    {
        if (!isset(self::SEAT_MATRIX[$aircraftType])) {
            throw new \InvalidArgumentException("Unknown aircraft type: {$aircraftType}");
        }

        ['rows' => [$min, $max], 'letters' => $letters] = self::SEAT_MATRIX[$aircraftType];

        $all = [];
        for ($row = $min; $row <= $max; $row++) {
            foreach ($letters as $letter) {
                $all[] = $row . $letter;
            }
        }

        shuffle($all);

        return array_slice($all, 0, 3);
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/apps/astronacci/backend && php artisan test --filter=SeatGeneratorServiceTest
```
Expected: 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /home/apps/astronacci/backend
git add app/Services/SeatGeneratorService.php tests/Feature/SeatGeneratorServiceTest.php
git commit -m "feat: add SeatGeneratorService with aircraft-specific seat matrices"
```

---

## Task 4: Form Requests (Validation Layer)

**Files:**
- Create: `app/Http/Requests/CheckVoucherRequest.php`
- Create: `app/Http/Requests/GenerateVoucherRequest.php`
- Test: `tests/Feature/VoucherValidationTest.php`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `CheckVoucherRequest::rules()` returns `['flight_number' => 'required|string', 'flight_date' => 'required|string']`.
  - `GenerateVoucherRequest::rules()` returns rules requiring all of `crew_name`, `crew_id`, `flight_number`, `flight_date`, `aircraft_type` — with `aircraft_type` constrained to `["ATR", "Airbus 320", "Boeing 737 Max"]`. `GenerateVoucherRequest::messages()` returns custom Indonesian-friendly messages (Bonus).

- [ ] **Step 1: Write the failing tests**

Create `/home/apps/astronacci/backend/tests/Feature/VoucherValidationTest.php`:

```php
<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VoucherValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_check_endpoint_rejects_missing_fields(): void
    {
        $response = $this->postJson('/api/check', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['flight_number', 'flight_date']);
    }

    public function test_generate_endpoint_rejects_missing_fields(): void
    {
        $response = $this->postJson('/api/generate', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors([
            'crew_name', 'crew_id', 'flight_number', 'flight_date', 'aircraft_type',
        ]);
    }

    public function test_generate_endpoint_rejects_invalid_aircraft_type(): void
    {
        $response = $this->postJson('/api/generate', [
            'crew_name' => 'Jane',
            'crew_id' => 'C001',
            'flight_number' => 'GA101',
            'flight_date' => '2026-06-22',
            'aircraft_type' => 'Boeing 747',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['aircraft_type']);
    }

    public function test_generate_endpoint_uses_custom_error_message(): void
    {
        $response = $this->postJson('/api/generate', [
            'aircraft_type' => 'Boeing 747',
        ]);

        $response->assertStatus(422);
        // Custom message from GenerateVoucherRequest::messages() must appear.
        $response->assertJsonPath('errors.aircraft_type.0', 'Tipe pesawat tidak valid.');
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/apps/astronacci/backend && php artisan test --filter=VoucherValidationTest
```
Expected: FAIL with 404 (route not defined yet) — that's fine; we'll add routes in Task 5. For now, the validation classes themselves are the deliverable that Task 5 will wire up. **Continue to Step 3 — this test will pass after Task 5's routes are in place.** (Do not commit yet.)

- [ ] **Step 3: Create `CheckVoucherRequest`**

```bash
cd /home/apps/astronacci/backend && php artisan make:request CheckVoucherRequest
```

Open `app/Http/Requests/CheckVoucherRequest.php`. Replace its contents with:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckVoucherRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'flight_number' => ['required', 'string'],
            'flight_date'   => ['required', 'string'],
        ];
    }
}
```

- [ ] **Step 4: Create `GenerateVoucherRequest` with custom messages**

```bash
cd /home/apps/astronacci/backend && php artisan make:request GenerateVoucherRequest
```

Open `app/Http/Requests/GenerateVoucherRequest.php`. Replace its contents with:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GenerateVoucherRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'crew_name'      => ['required', 'string'],
            'crew_id'        => ['required', 'string'],
            'flight_number'  => ['required', 'string'],
            'flight_date'    => ['required', 'string'],
            'aircraft_type'  => ['required', 'string', 'in:ATR,Airbus 320,Boeing 737 Max'],
        ];
    }

    public function messages(): array
    {
        return [
            'crew_name.required'     => 'Nama crew wajib diisi.',
            'crew_id.required'       => 'ID crew wajib diisi.',
            'flight_number.required' => 'Nomor penerbangan wajib diisi.',
            'flight_date.required'   => 'Tanggal penerbangan wajib diisi.',
            'aircraft_type.required' => 'Tipe pesawat wajib diisi.',
            'aircraft_type.in'       => 'Tipe pesawat tidak valid.',
        ];
    }
}
```

- [ ] **Step 5: Do NOT commit yet — leave this branch uncommitted until Task 5 wires the routes that make the validation tests pass.**

(Note: this is the one place a task defers its commit — the validation tests need Task 5's routes to actually pass. That's documented here so the engineer isn't confused. Both Task 4 and Task 5 work will be committed together at the end of Task 5.)

---

## Task 5: Controller, Routes, API Resource, CORS

**Files:**
- Create: `app/Http/Resources/VoucherResource.php`
- Create: `app/Http/Controllers/VoucherController.php`
- Modify: `routes/api.php` (add POST `/check`, POST `/generate`)
- Modify: `config/cors.php` (allow React origins)
- Test (already written in Task 4): `tests/Feature/VoucherValidationTest.php` will now pass.

**Interfaces:**
- Consumes: `Voucher` model (Task 2), `SeatGeneratorService::draw()` (Task 3), `CheckVoucherRequest`, `GenerateVoucherRequest` (Task 4).
- Produces:
  - `POST /api/check` → `{ "exists": bool, "message": string }` (200 on success, 422 on validation fail).
  - `POST /api/generate` → 201 with a `VoucherResource` payload (the formatted voucher), 422 on validation fail, 409 on composite-unique violation.
  - `VoucherResource::toArray()` returns an array with keys: `id`, `crew_name`, `crew_id`, `flight_number`, `flight_date`, `aircraft_type`, `seats` (an array of 3 strings), `created_at`, `updated_at`.

- [ ] **Step 1: Write the failing controller/route integration test**

Create `/home/apps/astronacci/backend/tests/Feature/VoucherApiTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VoucherApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_check_returns_false_when_no_voucher_exists(): void
    {
        $response = $this->postJson('/api/check', [
            'flight_number' => 'GA101',
            'flight_date' => '2026-06-22',
        ]);

        $response->assertOk();
        $response->assertJson(['exists' => false]);
    }

    public function test_check_returns_true_when_voucher_exists(): void
    {
        Voucher::create([
            'crew_name' => 'Jane', 'crew_id' => 'C001',
            'flight_number' => 'GA101', 'flight_date' => '2026-06-22',
            'aircraft_type' => 'ATR',
            'seat1' => '1A', 'seat2' => '2C', 'seat3' => '3D',
        ]);

        $response = $this->postJson('/api/check', [
            'flight_number' => 'GA101',
            'flight_date' => '2026-06-22',
        ]);

        $response->assertOk();
        $response->assertJson(['exists' => true]);
    }

    public function test_generate_creates_voucher_and_returns_resource_shape(): void
    {
        $response = $this->postJson('/api/generate', [
            'crew_name' => 'Jane Doe',
            'crew_id' => 'C001',
            'flight_number' => 'GA102',
            'flight_date' => '2026-06-22',
            'aircraft_type' => 'ATR',
        ]);

        $response->assertCreated();
        $response->assertJsonStructure([
            'data' => [
                'id', 'crew_name', 'crew_id', 'flight_number', 'flight_date',
                'aircraft_type', 'seats', 'created_at', 'updated_at',
            ],
        ]);

        $seats = $response->json('data.seats');
        $this->assertCount(3, $seats);
        $this->assertEquals(3, count(array_unique($seats)));

        $this->assertDatabaseHas('vouchers', [
            'flight_number' => 'GA102',
            'flight_date' => '2026-06-22',
        ]);
    }

    public function test_generate_rejects_duplicate_flight_and_date_with_409(): void
    {
        Voucher::create([
            'crew_name' => 'Existing', 'crew_id' => 'C099',
            'flight_number' => 'GA103', 'flight_date' => '2026-06-22',
            'aircraft_type' => 'ATR',
            'seat1' => '1A', 'seat2' => '2C', 'seat3' => '3D',
        ]);

        $response = $this->postJson('/api/generate', [
            'crew_name' => 'New Crew',
            'crew_id' => 'C001',
            'flight_number' => 'GA103',
            'flight_date' => '2026-06-22',
            'aircraft_type' => 'ATR',
        ]);

        $response->assertStatus(409);
        $response->assertJson(['message' => 'Voucher already exists for this flight and date.']);
    }

    public function test_generate_with_airbus_320_produces_valid_seats(): void
    {
        $response = $this->postJson('/api/generate', [
            'crew_name' => 'Jane', 'crew_id' => 'C001',
            'flight_number' => 'GA104', 'flight_date' => '2026-06-22',
            'aircraft_type' => 'Airbus 320',
        ]);

        $response->assertCreated();
        foreach ($response->json('data.seats') as $seat) {
            preg_match('/^(\d+)([A-Z])$/', $seat, $m);
            $this->assertNotEmpty($m);
            $this->assertGreaterThanOrEqual(1, (int) $m[1]);
            $this->assertLessThanOrEqual(32, (int) $m[1]);
            $this->assertContains($m[2], ['A', 'B', 'C', 'D', 'E', 'F']);
        }
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/apps/astronacci/backend && php artisan test --filter=VoucherApiTest
```
Expected: FAIL with 404 `Not Found` (routes not registered yet).

- [ ] **Step 3: Create the API Resource**

```bash
cd /home/apps/astronacci/backend && php artisan make:resource VoucherResource
```

Open `app/Http/Resources/VoucherResource.php`. Replace `toArray()` with:

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VoucherResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'crew_name'     => $this->crew_name,
            'crew_id'       => $this->crew_id,
            'flight_number' => $this->flight_number,
            'flight_date'   => $this->flight_date,
            'aircraft_type' => $this->aircraft_type,
            'seats'         => [$this->seat1, $this->seat2, $this->seat3],
            'created_at'    => $this->created_at,
            'updated_at'    => $this->updated_at,
        ];
    }
}
```

- [ ] **Step 4: Create the controller**

```bash
cd /home/apps/astronacci/backend && php artisan make:controller VoucherController
```

Open `app/Http/Controllers/VoucherController.php`. Replace its contents with:

```php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\CheckVoucherRequest;
use App\Http\Requests\GenerateVoucherRequest;
use App\Http\Resources\VoucherResource;
use App\Models\Voucher;
use App\Services\SeatGeneratorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;

class VoucherController extends Controller
{
    public function __construct(
        private readonly SeatGeneratorService $seatGenerator,
    ) {}

    public function check(CheckVoucherRequest $request): JsonResponse
    {
        $exists = Voucher::where('flight_number', $request->flight_number)
            ->where('flight_date', $request->flight_date)
            ->exists();

        return response()->json([
            'exists'  => $exists,
            'message' => $exists
                ? 'A voucher already exists for this flight and date.'
                : 'No voucher found for this flight and date.',
        ]);
    }

    public function generate(GenerateVoucherRequest $request): JsonResource|JsonResponse
    {
        $alreadyExists = Voucher::where('flight_number', $request->flight_number)
            ->where('flight_date', $request->flight_date)
            ->exists();

        if ($alreadyExists) {
            return response()->json([
                'message' => 'Voucher already exists for this flight and date.',
            ], 409);
        }

        [$seat1, $seat2, $seat3] = $this->seatGenerator->draw($request->aircraft_type);

        $voucher = Voucher::create([
            'crew_name'      => $request->crew_name,
            'crew_id'        => $request->crew_id,
            'flight_number'  => $request->flight_number,
            'flight_date'    => $request->flight_date,
            'aircraft_type'  => $request->aircraft_type,
            'seat1'          => $seat1,
            'seat2'          => $seat2,
            'seat3'          => $seat3,
        ]);

        return (new VoucherResource($voucher))
            ->response()
            ->setStatusCode(201);
    }
}
```

- [ ] **Step 5: Register routes**

Open `/home/apps/astronacci/backend/routes/api.php` and replace its contents with:

```php
<?php

use App\Http\Controllers\VoucherController;
use Illuminate\Support\Facades\Route;

Route::post('/check', [VoucherController::class, 'check']);
Route::post('/generate', [VoucherController::class, 'generate']);
```

- [ ] **Step 6: Configure CORS for React frontend**

Open `/home/apps/astronacci/backend/config/cors.php` and replace the `'paths'` and `'allowed_origins'` entries with:

```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],

'allowed_methods' => ['*'],

'allowed_origins' => [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
],

'allowed_origins_patterns' => [],

'allowed_headers' => ['*'],

'exposed_headers' => [],

'max_age' => 0,

'supports_credentials' => false,
```

- [ ] **Step 7: Ensure `config/cors.php` exists — if Laravel 11 does not publish it by default**

In Laravel 11, CORS config is auto-loaded from the framework. To override it explicitly, publish the file:

```bash
cd /home/apps/astronacci/backend && php artisan config:publish cors
```

If the command says the file already exists, edit it per Step 6. If it says the config is not publishable, skip this step — your edit in Step 6 already created the file.

- [ ] **Step 8: Run all validation and API tests**

```bash
cd /home/apps/astronacci/backend && php artisan test --filter=VoucherValidationTest && php artisan test --filter=VoucherApiTest
```
Expected: 4 validation tests + 5 API tests, all PASS.

- [ ] **Step 9: Run the full suite**

```bash
cd /home/apps/astronacci/backend && php artisan test
```
Expected: all tests PASS (default Laravel tests + Task 2 + Task 3 + Task 4 + Task 5 tests).

- [ ] **Step 10: Commit Tasks 4 and 5 together**

```bash
cd /home/apps/astronacci/backend
git add app/Http/Requests/ app/Http/Resources/ app/Http/Controllers/VoucherController.php routes/api.php config/cors.php tests/Feature/VoucherValidationTest.php tests/Feature/VoucherApiTest.php
git commit -m "feat: add check/generate endpoints with form requests, resource, and CORS"
```

---

## Task 6: Manual Smoke Test via HTTP and Final Verification

**Files:**
- No new files. Verifies the whole system end-to-end from outside the process.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: confidence that the served app works from a real HTTP client (curl), not just the test harness.

- [ ] **Step 1: Start the dev server in the background**

```bash
cd /home/apps/astronacci/backend && php artisan serve --host=127.0.0.1 --port=8000 &
```
Expected: `Server running on [http://127.0.0.1:8000]`.

- [ ] **Step 2: Hit `POST /api/check` for a non-existent flight**

```bash
curl -s -X POST http://127.0.0.1:8000/api/check \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"flight_number":"GA999","flight_date":"2026-06-22"}'
```
Expected: `{"exists":false,"message":"No voucher found for this flight and date.""}`

- [ ] **Step 3: Hit `POST /api/generate` for an ATR flight**

```bash
curl -s -X POST http://127.0.0.1:8000/api/generate \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "crew_name":"Jane Doe",
    "crew_id":"C001",
    "flight_number":"GA999",
    "flight_date":"2026-06-22",
    "aircraft_type":"ATR"
  }'
```
Expected: HTTP 201 with JSON of shape `{"data":{"id":...,"seats":["?A","?C","?D"]...}}`. Seats must be 3 distinct ATR-valid seats (rows 1–18, letters A/C/D/F only).

- [ ] **Step 4: Hit `POST /api/generate` again for the SAME flight+date**

```bash
curl -s -X POST http://127.0.0.1:8000/api/generate \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "crew_name":"Other Crew",
    "crew_id":"C002",
    "flight_number":"GA999",
    "flight_date":"2026-06-22",
    "aircraft_type":"ATR"
  }' -w "\nHTTP %{http_code}\n"
```
Expected: HTTP `409` and body `{"message":"Voucher already exists for this flight and date."}`.

- [ ] **Step 5: Hit `POST /api/generate` with an invalid aircraft type**

```bash
curl -s -X POST http://127.0.0.1:8000/api/generate \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "crew_name":"Jane","crew_id":"C001",
    "flight_number":"GA998","flight_date":"2026-06-22",
    "aircraft_type":"Boeing 747"
  }' -w "\nHTTP %{http_code}\n"
```
Expected: HTTP `422` with `errors.aircraft_type` containing `"Tipe pesawat tidak valid."`.

- [ ] **Step 6: Stop the dev server**

```bash
kill %1 2>/dev/null || pkill -f "artisan serve"
```
Expected: server process terminates cleanly.

- [ ] **Step 7: Tag the release**

```bash
cd /home/apps/astronacci/backend
git tag -a v1.0.0 -m "Voucher seat assignment API — first release"
```
Expected: tag `v1.0.0` created locally.

---

## Self-Review Notes

Spec coverage check:
- ✅ SQLite via `DB_CONNECTION=sqlite` — Task 1, Step 4.
- ✅ Migration with all required columns + composite unique constraint — Task 2, Step 3.
- ✅ `SeatGeneratorService` in `App\Services` with correct matrices — Task 3.
- ✅ ATR has no B/E (explicitly tested) — Task 3 test `test_atr_seats_only_use_valid_letters_and_rows`.
- ✅ `POST /api/check` with custom Form Request, JSON `{exists, message}` — Task 5 controller + `CheckVoucherRequest`.
- ✅ `POST /api/generate` with custom Form Request, custom messages, API Resource output — Task 5.
- ✅ Eloquent only, no raw SQL — controllers use `Voucher::where/create`, migrations use Schema builder.
- ✅ Lean controllers (delegation only) — `VoucherController` delegates validation to Form Requests, domain logic to service, persistence to model, shaping to Resource.
- ✅ CORS for React frontend — Task 5 Step 6.
- ✅ `tests/Feature/VoucherApiTest.php` — Task 5.
- ✅ Dockerfile + docker-compose — Task 1 Steps 6–7.

Placeholder scan: none. Every step has the actual code or command to run.

Type consistency: `SeatGeneratorService::draw(string): array` used identically in Task 3 test, Task 5 controller. `VoucherResource` field names (`seats`, `aircraft_type`, etc.) used identically in Task 5 controller and Task 5 test. Composite unique index name `vouchers_flight_date_unique` matches between Task 2 migration and the duplicate-rejection test (the test relies on the constraint firing `QueryException`, which Task 5's controller preempts with a manual `exists()` check + 409 — both paths are covered).
