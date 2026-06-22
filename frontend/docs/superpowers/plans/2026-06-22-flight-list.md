# Flight List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Flight List" tab to the existing single-page Voucher Seat Assignment frontend, backed by a new `GET /api/vouchers` Laravel endpoint, that shows every voucher generated so far in a daisyUI table.

**Architecture:** One new Laravel endpoint (`GET /api/vouchers` returning `VoucherResource::collection(Voucher::all())`). One new React component (`VoucherList`) that fetches on mount and renders a table with loading/error/empty states. `App.jsx` gains `activeTab` state and renders a daisyUI tabs UI above either the existing Generate view or the new Flight List view. No router, no pagination, no auto-refresh.

**Tech Stack:** Laravel 11 (backend, already running on `:8000`), React 19 + Vite 8 + Tailwind v4 + daisyUI v5 (frontend, on `:5173`), Vitest + @testing-library/react (frontend tests), PHPUnit via `php artisan test` (backend tests).

## Global Constraints

- **Backend base URL:** `http://localhost:8000` (Laravel dev server). Frontend reads from `VITE_API_BASE_URL` env var (currently the public IP `163.223.104.47:8000` for cross-device access).
- **Aircraft type strings — exact keys:** `"ATR"`, `"Airbus 320"`, `"Boeing 737 Max"`.
- **Backend response shape for `GET /api/vouchers`:** `{ "data": [ { id, crew_name, crew_id, flight_number, flight_date, aircraft_type, seats: [s1, s2, s3], created_at, updated_at }, ... ] }`. Same per-item shape as `POST /api/generate`'s 201 body. `VoucherResource::collection(...)` provides this.
- **Frontend API client pattern:** lazy env read (see `src/lib/api.js` — `baseURL()` is called inside each function so test/runtime env overrides take effect). New `listVouchers` follows the same pattern.
- **daisyUI v5 component classes available:** `card`, `card-body`, `card-title`, `tabs`, `tabs-boxed`, `tab`, `tab-active`, `table`, `table-zebra`, `btn`, `btn-sm`, `btn-ghost`, `loading`, `loading-spinner`. Do NOT use removed v4 classes.
- **Error copy (verbatim):** `"Could not load flights. Please try again."` for the list-fetch failure path.
- **Empty state copy (verbatim):** `"No vouchers generated yet. Switch to the Generate tab to create one."`
- **Loading text (verbatim):** `"Loading flights…"`
- **CORS:** Laravel's `config/cors.php` already allows the public origin `http://163.223.104.47:5173`. The new `GET` endpoint inherits this — no CORS change needed.
- **TDD:** every behavior step is "write failing test → run (FAIL) → implement → run (PASS) → commit".
- **Commits:** after every green test cycle. Conventional Commit format.
- **No emojis in code or UI.**
- **No comments** in code unless behavior is genuinely non-obvious.
- **File paths:** all frontend paths are relative to `/home/apps/astronacci/frontend/`. All backend paths are relative to `/home/apps/astronacci/backend/`.

---

## File Structure

```
backend/
├── app/Http/Controllers/
│   └── VoucherController.php           # MODIFY — add index() method
├── routes/
│   └── api.php                          # MODIFY — add GET /vouchers route
└── tests/Feature/
    └── VoucherApiTest.php               # MODIFY — add test_index_returns_all_vouchers_as_resource_collection

frontend/
└── src/
    ├── lib/
    │   ├── api.js                       # MODIFY — add listVouchers()
    │   └── __tests__/
    │       └── api.test.js              # MODIFY — add describe('listVouchers') block
    ├── components/
    │   ├── VoucherList.jsx              # NEW — fetch + table + states
    │   └── __tests__/
    │       ├── VoucherList.test.jsx     # NEW — 4 behavior tests
    │       └── App.test.jsx             # MODIFY — mock listVouchers, add 2 tab-switch tests
    └── App.jsx                          # MODIFY — add activeTab state + tabs UI + conditional render
```

Responsibilities:
- `VoucherController::index()` — return all vouchers via `VoucherResource::collection`. No filtering, no pagination.
- `listVouchers()` — axios GET to `/api/vouchers`, return `response.data.data` (the inner array).
- `VoucherList` — owns its fetch lifecycle (`useEffect` on mount, manual re-fetch on Refresh button click). Presentational after data lands.
- `App.jsx` — owns `activeTab` state, renders tabs UI, conditionally renders the Generate view or Flight List view.

---

## Task 1: Backend — `GET /api/vouchers` Endpoint

**Files:**
- Modify: `/home/apps/astronacci/backend/app/Http/Controllers/VoucherController.php`
- Modify: `/home/apps/astronacci/backend/routes/api.php`
- Modify: `/home/apps/astronacci/backend/tests/Feature/VoucherApiTest.php`

**Interfaces:**
- Consumes: `Voucher` Eloquent model (already imported in controller), `VoucherResource` (already imported in controller).
- Produces: `GET /api/vouchers` endpoint. Response 200 with `{ data: [ ...VoucherResource items ] }`. Empty DB → `{ data: [] }`.

- [ ] **Step 1: Write the failing test**

Open `/home/apps/astronacci/backend/tests/Feature/VoucherApiTest.php`. Add this test method at the end of the `VoucherApiTest` class (before the closing `}`):

```php
    public function test_index_returns_all_vouchers_as_resource_collection(): void
    {
        Voucher::create([
            'crew_name' => 'Putri', 'crew_id' => 'CRW001',
            'flight_number' => 'GA102', 'flight_date' => '2026-07-01',
            'aircraft_type' => 'ATR',
            'seat1' => '1A', 'seat2' => '14C', 'seat3' => '18F',
        ]);
        Voucher::create([
            'crew_name' => 'Budi', 'crew_id' => 'CRW002',
            'flight_number' => 'GA205', 'flight_date' => '2026-07-03',
            'aircraft_type' => 'Airbus 320',
            'seat1' => '5A', 'seat2' => '6B', 'seat3' => '7C',
        ]);

        $response = $this->getJson('/api/vouchers');

        $response->assertOk();
        $response->assertJsonCount(2, 'data');
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'crew_name', 'crew_id', 'flight_number', 'flight_date', 'aircraft_type', 'seats', 'created_at', 'updated_at'],
            ],
        ]);
        $response->assertJsonPath('data.0.seats', ['1A', '14C', '18F']);
        $response->assertJsonPath('data.1.seats', ['5A', '6B', '7C']);
    }
```

- [ ] **Step 2: Run the test — expect it to fail**

```bash
cd /home/apps/astronacci/backend
php artisan test --filter=test_index_returns_all_vouchers_as_resource_collection
```

Expected: FAIL with `Expected status code 200 but received 404` (route does not exist yet).

- [ ] **Step 3: Add the `index()` method to `VoucherController`**

Open `/home/apps/astronacci/backend/app/Http/Controllers/VoucherController.php`. Add this method inside the `VoucherController` class (after `__construct`, before `check`):

```php
    public function index(): JsonResource
    {
        return VoucherResource::collection(Voucher::all());
    }
```

The `JsonResource` return type and `Voucher` / `VoucherResource` imports already exist at the top of the file (verified by reading the current controller).

- [ ] **Step 4: Register the route**

Open `/home/apps/astronacci/backend/routes/api.php`. Add this line above the existing two `Route::post(...)` calls (so GET comes before POSTs in the file):

```php
Route::get('/vouchers', [VoucherController::class, 'index']);
```

The final `routes/api.php` should be:

```php
<?php

use App\Http\Controllers\VoucherController;
use Illuminate\Support\Facades\Route;

Route::get('/vouchers', [VoucherController::class, 'index']);
Route::post('/check', [VoucherController::class, 'check']);
Route::post('/generate', [VoucherController::class, 'generate']);
```

- [ ] **Step 5: Run the test — expect it to pass**

```bash
cd /home/apps/astronacci/backend
php artisan test --filter=test_index_returns_all_vouchers_as_resource_collection
```

Expected: PASS — 1 test, 1 assertion block.

Then run the full backend test suite to confirm no regressions:

```bash
cd /home/apps/astronacci/backend
php artisan test
```

Expected: all backend tests pass.

- [ ] **Step 6: Smoke-test against the running server**

If the Laravel dev server is not already running, start it in a separate terminal:

```bash
cd /home/apps/astronacci/backend
php artisan serve --host 0.0.0.0
```

Then hit the new endpoint:

```bash
curl -s http://localhost:8000/api/vouchers -H "Accept: application/json" | head -c 500
```

Expected: JSON output starting with `{"data":[...`.

- [ ] **Step 7: Commit**

```bash
cd /home/apps/astronacci/backend
git add app/Http/Controllers/VoucherController.php routes/api.php tests/Feature/VoucherApiTest.php
git commit -m "feat: add GET /api/vouchers endpoint for listing all generated vouchers"
```

---

## Task 2: Frontend — `listVouchers()` API Helper

**Files:**
- Modify: `/home/apps/astronacci/frontend/src/lib/api.js`
- Modify: `/home/apps/astronacci/frontend/src/lib/__tests__/api.test.js`

**Interfaces:**
- Consumes: lazy `baseURL()` from the same module, `axios.get`.
- Produces: `listVouchers()` async function — `GET {baseURL}/api/vouchers`, returns `response.data.data` (the inner array). Throws axios errors.

- [ ] **Step 1: Add 2 failing tests to `api.test.js`**

Open `/home/apps/astronacci/frontend/src/lib/__tests__/api.test.js`. The existing file has one `describe('api client', ...)` block that tests `checkVoucher` and `generateVoucher` and mocks `axios` via `vi.mock('axios')`. The auto-mock already provides `axios.get` as a `vi.fn()` — no factory change needed.

Append this new `describe` block at the end of the file (after the closing `});` of the existing `describe('api client', ...)`):

```javascript
describe('listVouchers', () => {
  beforeEach(() => {
    axios.get.mockReset();
    import.meta.env.VITE_API_BASE_URL = 'http://localhost:8000';
  });

  it('GETs /api/vouchers and returns the parsed data array', async () => {
    const body = {
      data: [
        {
          id: 1, crew_name: 'Putri', crew_id: 'CRW001',
          flight_number: 'GA102', flight_date: '2026-07-01',
          aircraft_type: 'ATR',
          seats: ['1A', '14C', '18F'],
          created_at: '2026-06-22T00:00:00.000000Z',
          updated_at: '2026-06-22T00:00:00.000000Z',
        },
        {
          id: 2, crew_name: 'Budi', crew_id: 'CRW002',
          flight_number: 'GA205', flight_date: '2026-07-03',
          aircraft_type: 'Airbus 320',
          seats: ['5A', '6B', '7C'],
          created_at: '2026-06-22T00:00:00.000000Z',
          updated_at: '2026-06-22T00:00:00.000000Z',
        },
      ],
    };
    axios.get.mockResolvedValueOnce({ status: 200, data: body });

    const result = await listVouchers();

    expect(axios.get).toHaveBeenCalledWith('http://localhost:8000/api/vouchers');
    expect(result).toEqual(body.data);
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty('seats', ['1A', '14C', '18F']);
  });

  it('propagates the axios error on non-2xx', async () => {
    const error = new Error('Request failed with status code 500');
    error.response = { status: 500, data: { message: 'boom' } };
    axios.get.mockRejectedValueOnce(error);

    await expect(listVouchers()).rejects.toBe(error);
  });
});
```

The test file imports `axios` and `listVouchers` at the top — `listVouchers` does not exist yet. The import will fail, which is the RED state for this task.

If the existing test file does not already import `listVouchers` from `../api`, the import line needs to be updated. The current import is:

```javascript
import { checkVoucher, generateVoucher } from '../api';
```

Change it to:

```javascript
import { checkVoucher, generateVoucher, listVouchers } from '../api';
```

- [ ] **Step 2: Run the tests — expect them to fail**

```bash
cd /home/apps/astronacci/frontend
npm test
```

Expected: FAIL — the 2 new listVouchers tests fail. Either:
- `listVouchers is not a function` (import is `undefined` because the named export doesn't exist yet), or
- `Expected to be called with: .../api/vouchers but was not called` if listVouchers happens to be defined as undefined.

- [ ] **Step 3: Implement `listVouchers` in `api.js`**

Open `/home/apps/astronacci/frontend/src/lib/api.js`. Current contents:

```javascript
import axios from 'axios';

function baseURL() {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
}

export async function checkVoucher({ flight_number, flight_date }) {
  const response = await axios.post(`${baseURL()}/api/check`, { flight_number, flight_date });
  return response.data;
}

export async function generateVoucher(payload) {
  const response = await axios.post(`${baseURL()}/api/generate`, payload);
  return response.data.data;
}
```

Add this function at the bottom of the file (after `generateVoucher`):

```javascript
export async function listVouchers() {
  const response = await axios.get(`${baseURL()}/api/vouchers`);
  return response.data.data;
}
```

- [ ] **Step 4: Run the tests — expect them to pass**

```bash
cd /home/apps/astronacci/frontend
npm test
```

Expected: all api tests pass (the existing 6 + the new 2 = 8 in this file). The rest of the suite stays green.

- [ ] **Step 5: Commit**

```bash
cd /home/apps/astronacci/frontend
git add src/lib/api.js src/lib/__tests__/api.test.js
git commit -m "feat: add listVouchers API helper"
```

---

## Task 3: Frontend — `VoucherList` Component

**Files:**
- Create: `/home/apps/astronacci/frontend/src/components/VoucherList.jsx`
- Create: `/home/apps/astronacci/frontend/src/components/__tests__/VoucherList.test.jsx`

**Interfaces:**
- Consumes: `listVouchers` from `../lib/api`, `ErrorBanner` from `./ErrorBanner`.
- Produces: default-exported React component `VoucherList()` (no props). On mount, calls `listVouchers()` and renders one of four states: loading, success-with-rows, success-empty, error.

- [ ] **Step 1: Write the failing test**

Create `/home/apps/astronacci/frontend/src/components/__tests__/VoucherList.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import VoucherList from '../VoucherList';

vi.mock('../../lib/api', () => ({
  listVouchers: vi.fn(),
}));

import { listVouchers } from '../../lib/api';

const sampleVouchers = [
  {
    id: 1, crew_name: 'Putri', crew_id: 'CRW001',
    flight_number: 'GA102', flight_date: '2026-07-01',
    aircraft_type: 'ATR',
    seats: ['1A', '14C', '18F'],
  },
  {
    id: 2, crew_name: 'Budi', crew_id: 'CRW002',
    flight_number: 'GA205', flight_date: '2026-07-03',
    aircraft_type: 'Airbus 320',
    seats: ['5A', '6B', '7C'],
  },
];

describe('VoucherList', () => {
  beforeEach(() => {
    listVouchers.mockReset();
  });

  it('shows the loading state on first render', () => {
    listVouchers.mockReturnValue(new Promise(() => {}));
    render(<VoucherList />);
    expect(screen.getByText(/Loading flights/i)).toBeInTheDocument();
  });

  it('renders a row per voucher once loaded', async () => {
    listVouchers.mockResolvedValue(sampleVouchers);
    render(<VoucherList />);
    await waitFor(() => {
      expect(screen.getByText('Putri')).toBeInTheDocument();
      expect(screen.getByText('Budi')).toBeInTheDocument();
    });
    expect(screen.getByText('1A, 14C, 18F')).toBeInTheDocument();
    expect(screen.getByText('5A, 6B, 7C')).toBeInTheDocument();
    expect(screen.getByText('GA102')).toBeInTheDocument();
    expect(screen.getByText('Airbus 320')).toBeInTheDocument();
  });

  it('shows the empty state when no vouchers exist', async () => {
    listVouchers.mockResolvedValue([]);
    render(<VoucherList />);
    await waitFor(() => {
      expect(screen.getByText(/No vouchers generated yet/i)).toBeInTheDocument();
    });
  });

  it('shows the error banner when the fetch rejects', async () => {
    listVouchers.mockRejectedValue(new Error('network down'));
    render(<VoucherList />);
    await waitFor(() => {
      expect(screen.getByText(/Could not load flights/i)).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run the test — expect it to fail**

```bash
cd /home/apps/astronacci/frontend
npm test
```

Expected: FAIL — `Failed to resolve import "../VoucherList"` (module does not exist yet).

- [ ] **Step 3: Implement `VoucherList.jsx`**

Create `/home/apps/astronacci/frontend/src/components/VoucherList.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { listVouchers } from '../lib/api';
import ErrorBanner from './ErrorBanner';

const ERROR_MESSAGE = 'Could not load flights. Please try again.';

export default function VoucherList() {
  const [status, setStatus] = useState('loading');
  const [vouchers, setVouchers] = useState([]);

  async function fetchVouchers() {
    setStatus('loading');
    try {
      const data = await listVouchers();
      setVouchers(data);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  useEffect(() => {
    fetchVouchers();
  }, []);

  return (
    <section className="card bg-base-100 shadow-md border border-base-300">
      <div className="card-body">
        <div className="flex items-center justify-between gap-4">
          <h2 className="card-title text-base-content/80 text-base">Flight list</h2>
          <button
            type="button"
            onClick={fetchVouchers}
            disabled={status === 'loading'}
            className="btn btn-sm btn-ghost"
          >
            {status === 'loading' ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {status === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-8">
            <span className="loading loading-spinner loading-md" aria-hidden="true" />
            <span>Loading flights…</span>
          </div>
        )}

        {status === 'error' && <ErrorBanner message={ERROR_MESSAGE} />}

        {status === 'success' && vouchers.length === 0 && (
          <p className="text-center py-8 text-base-content/60">
            No vouchers generated yet. Switch to the Generate tab to create one.
          </p>
        )}

        {status === 'success' && vouchers.length > 0 && (
          <div className="overflow-x-auto mt-2">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Crew</th>
                  <th>Flight</th>
                  <th>Date</th>
                  <th>Aircraft</th>
                  <th>Seats</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v) => (
                  <tr key={v.id}>
                    <td>{v.crew_name}</td>
                    <td className="font-mono">{v.flight_number}</td>
                    <td className="font-mono">{v.flight_date}</td>
                    <td>{v.aircraft_type}</td>
                    <td className="font-mono">{v.seats.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run the tests — expect them to pass**

```bash
cd /home/apps/astronacci/frontend
npm test
```

Expected: all 4 VoucherList tests pass. Full suite stays green.

- [ ] **Step 5: Commit**

```bash
cd /home/apps/astronacci/frontend
git add src/components/VoucherList.jsx src/components/__tests__/VoucherList.test.jsx
git commit -m "feat: add VoucherList component with loading/empty/error states"
```

---

## Task 4: Frontend — Wire Tabs in `App.jsx`

**Files:**
- Modify: `/home/apps/astronacci/frontend/src/App.jsx`
- Modify: `/home/apps/astronacci/frontend/src/components/__tests__/App.test.jsx`

**Interfaces:**
- Consumes: `VoucherList` from `./components/VoucherList` (Task 3).
- Produces: `App` now owns `activeTab: 'generate' | 'list'` state. Renders daisyUI `tabs tabs-boxed` UI above either the existing Generate view (form + ErrorBanner + SeatResults + SeatMap) or the new Flight List view (`<VoucherList />`). Default tab is `'generate'`.

**Important test-side notes:**
1. The existing App success-path test asserts `screen.getAllByText('1A')` (already fixed for the seat-map multiple-match issue). After this task, no new multiple-match issues are introduced because `VoucherList` only renders when the list tab is active.
2. The existing `vi.mock('../../lib/api', ...)` factory must be extended to include `listVouchers: vi.fn()` so that when the Flight List tab mounts `VoucherList`, the mock returns the configured value (otherwise `VoucherList` calls the real `listVouchers` which hits the network in the test env).

- [ ] **Step 1: Add 2 failing tests to `App.test.jsx`**

Open `/home/apps/astronacci/frontend/src/components/__tests__/App.test.jsx`. The existing `vi.mock` block at the top is:

```javascript
vi.mock('../../lib/api', () => ({
  checkVoucher: vi.fn(),
  generateVoucher: vi.fn(),
}));
```

Change it to add `listVouchers`:

```javascript
vi.mock('../../lib/api', () => ({
  checkVoucher: vi.fn(),
  generateVoucher: vi.fn(),
  listVouchers: vi.fn(),
}));
```

Then update the import line that follows it to also import `listVouchers`:

```javascript
import { checkVoucher, generateVoucher, listVouchers } from '../../lib/api';
```

In the existing `beforeEach(() => { ... })` block, add a reset for `listVouchers`:

```javascript
beforeEach(() => {
  checkVoucher.mockReset();
  generateVoucher.mockReset();
  listVouchers.mockReset();
});
```

Then append these 2 new tests inside the existing `describe('App', () => { ... })` block (before the closing `});`):

```jsx
  it('shows the Generate form by default and hides the Flight List table', () => {
    render(<App />);
    expect(screen.getByLabelText(/crew name/i)).toBeInTheDocument();
    expect(screen.queryByText(/No vouchers generated yet/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('switches to the Flight List when its tab is clicked', async () => {
    listVouchers.mockResolvedValue([
      {
        id: 1, crew_name: 'Putri', crew_id: 'CRW001',
        flight_number: 'GA102', flight_date: '2026-07-01',
        aircraft_type: 'ATR',
        seats: ['1A', '14C', '18F'],
      },
    ]);

    render(<App />);
    await userEvent.setup().click(screen.getByRole('tab', { name: /flight list/i }));

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Putri')).toBeInTheDocument();
    });
    expect(screen.queryByLabelText(/crew name/i)).not.toBeInTheDocument();
  });
```

If the file does not already import `waitFor` from `@testing-library/react`, add it to the existing import. The current import is:

```javascript
import { render, screen, waitFor } from '@testing-library/react';
```

It already has `waitFor` — no change needed.

- [ ] **Step 2: Run the tests — expect failures**

```bash
cd /home/apps/astronacci/frontend
npm test
```

Expected: 
- The "shows the Generate form by default" test should still pass (existing behaviour).
- The "switches to the Flight List when its tab is clicked" test FAILS — `Unable to find a tab element with the name /flight list/i` because the tabs UI doesn't exist yet.

- [ ] **Step 3: Update `App.jsx` — add tab state, tabs UI, and conditional render**

Open `/home/apps/astronacci/frontend/src/App.jsx`. The current structure renders the page heading + form card + (conditionally) error banner + (conditionally) SeatResults and SeatMap.

Add the `VoucherList` import at the top of the file (with the other component imports):

```jsx
import VoucherList from './components/VoucherList';
```

Add `activeTab` state. The current state declarations are:

```jsx
const [status, setStatus] = useState('idle');
const [errorMessage, setErrorMessage] = useState('');
const [voucher, setVoucher] = useState(null);
```

Add below them:

```jsx
const [activeTab, setActiveTab] = useState('generate');
```

Replace the existing JSX return (the whole `<main>...</main>` block) with this new version that adds the tabs UI and wraps the generate-flow sections in an `activeTab === 'generate'` conditional, plus a sibling `activeTab === 'list'` branch:

```jsx
  return (
    <main className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-base-content">Voucher Seat Assignment</h1>
          <p className="mt-1 text-sm text-base-content/70">
            Enter the flight details to generate 3 random promotional seats.
          </p>
        </header>

        <div role="tablist" className="tabs tabs-boxed mb-6">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'generate'}
            onClick={() => setActiveTab('generate')}
            className={`tab ${activeTab === 'generate' ? 'tab-active' : ''}`}
          >
            Generate Voucher
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'list'}
            onClick={() => setActiveTab('list')}
            className={`tab ${activeTab === 'list' ? 'tab-active' : ''}`}
          >
            Flight List
          </button>
        </div>

        {activeTab === 'generate' && (
          <>
            <section className="card bg-base-100 shadow-md border border-base-300/50">
              <div className="card-body">
                <h2 className="card-title text-base-content/80 text-base mb-2">Flight details</h2>
                <VoucherForm onSubmit={handleSubmit} loading={status === 'loading'} />
              </div>
            </section>

            {status === 'error' && (
              <div className="mt-6">
                <ErrorBanner message={errorMessage} />
              </div>
            )}

            {status === 'success' && voucher && (
              <>
                <div className="mt-6">
                  <SeatResults
                    seats={voucher.seats}
                    crewName={voucher.crew_name}
                  />
                </div>
                <div className="mt-6">
                  <SeatMap
                    aircraftType={voucher.aircraft_type}
                    wonSeats={voucher.seats}
                  />
                </div>
              </>
            )}
          </>
        )}

        {activeTab === 'list' && <VoucherList />}
      </div>
    </main>
  );
```

- [ ] **Step 4: Run the tests — expect them to pass**

```bash
cd /home/apps/astronacci/frontend
npm test
```

Expected: all tests pass. New count is previous total + 2 (App tests) = previous + 2.

- [ ] **Step 5: Manual smoke check**

Start the Vite dev server (if not running):

```bash
cd /home/apps/astronacci/frontend
npm run dev -- --host 0.0.0.0
```

Open `http://localhost:5173/` (or the public IP) in a browser:
- Two tabs visible: "Generate Voucher" (active by default) and "Flight List".
- Click "Flight List" → table appears with whatever vouchers exist.
- Click "Generate Voucher" → form reappears.
- Generate a voucher, then click "Flight List" → new voucher appears in the table after the list re-fetches.

- [ ] **Step 6: Commit**

```bash
cd /home/apps/astronacci/frontend
git add src/App.jsx src/components/__tests__/App.test.jsx
git commit -m "feat: add Generate/Flight List tabs to App"
```

---

## Self-Review

**1. Spec coverage**

| Spec requirement | Implemented in |
|---|---|
| Backend `GET /api/vouchers` returning `VoucherResource::collection` | Task 1 |
| `listVouchers()` API helper returning inner data array | Task 2 |
| `VoucherList` component with loading/empty/error states | Task 3 |
| Refresh button | Task 3 |
| daisyUI `tabs tabs-boxed` UI in `App.jsx` | Task 4 |
| Default tab is `'generate'` | Task 4 (`useState('generate')`) |
| After successful generation, stay on Generate tab | Task 4 (no auto-switch logic added — default behavior) |
| Re-fetch on tab mount (switching to list shows fresh data) | Task 3 `useEffect(() => { fetchVouchers(); }, [])` |
| Loading copy "Loading flights…" | Task 3 (verbatim) |
| Empty copy "No vouchers generated yet. Switch to the Generate tab to create one." | Task 3 (verbatim) |
| Error copy "Could not load flights. Please try again." | Task 3 (verbatim) |
| Table columns: Crew, Flight, Date, Aircraft, Seats (joined) | Task 3 |
| Out-of-scope items (pagination, search, click-row detail, auto-refresh) | Excluded ✓ |

No spec requirement left without a task.

**2. Placeholder scan**

- No "TBD", "implement later", or "TODO" markers.
- Every code step contains actual code.
- All commands have expected outputs.
- Backend `index()` is a one-line return — no place to hide ambiguity.
- The Task 4 instruction to "replace the existing JSX return" is verbose but explicit — every line of the new JSX is shown.

**3. Type / signature consistency**

- `listVouchers()` signature: defined in Task 2 as `async function listVouchers()` returning `response.data.data`. Task 3's test imports it from `'../../lib/api'` and mocks it; Task 3's component calls `await listVouchers()` with no args. ✓
- `VoucherList` signature: defined in Task 3 as default-exported `VoucherList()` taking no props. Task 4's App renders `<VoucherList />` with no props. ✓
- `activeTab` state shape: Task 4 declares `useState('generate')` with values `'generate'` and `'list'`. Tests use `getByRole('tab', { name: /flight list/i })` which matches the "Flight List" tab text. ✓
- Error/empty/loading copy appears verbatim in Task 3 implementation and Task 3 tests. ✓
- Mock factory path in VoucherList.test.jsx uses `'../../lib/api'` (file is at `src/components/__tests__/`, resolves to `src/lib/api`). App.test.jsx uses `'../../lib/api'` too — same path. ✓ Consistent.

No inconsistencies.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-06-22-flight-list.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
