# Flight List View Design

**Date:** 2026-06-22
**Status:** Approved (pending spec review)
**Goal:** Add a "Flight List" tab to the frontend that fetches and displays every voucher generated so far, with a corresponding `GET /api/vouchers` endpoint on the backend.

## Context

The system currently has two API endpoints (`POST /api/check`, `POST /api/generate`) and a single-page Generate Voucher form. There is no way to see vouchers that have already been generated. The user wants to add a navigable list view so they can review all flights that have received vouchers.

## Decisions (locked during brainstorming)

1. **Navigation:** daisyUI tabs at the top of the page. Two views: "Generate Voucher" (existing form) and "Flight List" (new). Local React state, no router.
2. **List display:** Responsive daisyUI table. One row per voucher. Columns: Crew | Flight | Date | Aircraft | Seats. Seats joined as a single string cell.

## Architecture

### Backend (Laravel)

Add `GET /api/vouchers` returning all vouchers as a `VoucherResource` collection.

- `app/Http/Controllers/VoucherController.php` — new `index()` method.
- `routes/api.php` — new `Route::get('/vouchers', [VoucherController::class, 'index'])`.
- No filtering, pagination, or sorting. YAGNI — add when list grows.

Response shape (200 OK):

```json
{
  "data": [
    {
      "id": 1,
      "crew_name": "Putri",
      "crew_id": "CRW001",
      "flight_number": "GA102",
      "flight_date": "2026-07-01",
      "aircraft_type": "ATR",
      "seats": ["1A", "14C", "18F"],
      "created_at": "2026-06-22T00:00:00.000000Z",
      "updated_at": "2026-06-22T00:00:00.000000Z"
    }
  ]
}
```

The per-item shape is identical to `POST /api/generate`'s 201 response body. `VoucherResource::collection(...)` handles the wrapping.

### Frontend (React)

#### New helper in `src/lib/api.js`

```js
export async function listVouchers() {
  const response = await axios.get(`${baseURL()}/api/vouchers`);
  return response.data.data;
}
```

Returns the inner `data` array (consistent with how `generateVoucher` unwraps).

#### New component `src/components/VoucherList.jsx`

Presentational + minimal local state for fetch lifecycle. Props: none.

```jsx
useEffect(() => { fetchVouchers(); }, []);
```

State machine: `idle | loading | success | error`. On mount → fetch → set state. Re-fetch on Refresh button click.

#### `src/App.jsx` changes

Add `activeTab` state (`'generate' | 'list'`). Render daisyUI `tabs` UI above the existing content area. Conditionally render either the Generate view (form + result + banner) or the Flight List view.

```jsx
const [activeTab, setActiveTab] = useState('generate');
```

After successful voucher generation, stay on the Generate tab (user just saw their result).

### Visual treatment

| Element | Class |
|---|---|
| Tabs container | `tabs tabs-boxed bg-base-200/60 mb-6` |
| Active tab | `tab tab-active` |
| Inactive tab | `tab` |
| List card shell | `card bg-base-100 shadow-md border border-base-300` (matches SeatMap) |
| Card body padding | `card-body` |
| Card title | `<h2 className="card-title text-base-content/80 text-base">Flight list</h2>` + Refresh button on the right |
| Refresh button | `btn btn-sm btn-ghost` with refresh icon if desired (text label is fine) |
| Table | `table table-zebra` |
| Header row | `<thead><tr><th>Crew</th><th>Flight</th><th>Date</th><th>Aircraft</th><th>Seats</th></tr></thead>` |
| Body row | `<tr><td>{crew_name}</td><td>{flight_number}</td><td>{flight_date}</td><td>{aircraft_type}</td><td>{seats.join(', ')}</td></tr>` |
| Seats cell | monospace via `font-mono` |

### States

| State | Render |
|---|---|
| Loading (initial + refresh) | `<div className="flex items-center gap-2 py-8 justify-center"><span className="loading loading-spinner loading-md" /><span>Loading flights…</span></div>` |
| Loaded, empty | Centered paragraph: "No vouchers generated yet." + a hint sentence "Switch to the Generate tab to create one." |
| Loaded, has rows | Table rendered as above |
| Error | `<ErrorBanner message="Could not load flights. Please try again." />` (re-use existing component for visual consistency) |

## Data flow

```
User clicks "Flight List" tab
  ↓
App renders <VoucherList />
  ↓
VoucherList.useEffect → listVouchers() → GET /api/vouchers
  ↓
set state: loading → success | error
  ↓
Render table | empty message | error banner
  ↓
User clicks Refresh → re-fetch
```

## Tests

### Backend — `tests/Feature/VoucherApiTest.php`

Add 1 test: `test_index_returns_all_vouchers_as_resource_collection`. Seed 2 vouchers, hit `GET /api/vouchers`, assert 200, assert `data` array length 2, assert each item has the `VoucherResource` shape (including `seats` as a 3-element array).

### Frontend

#### `src/lib/__tests__/api.test.js` — add 2 cases

- `listVouchers()` GETs `${baseURL}/api/vouchers` and returns the parsed `data` array.
- `listVouchers()` propagates axios errors (no try/catch).

#### `src/components/__tests__/VoucherList.test.jsx` — NEW, 4 cases

- Shows loading spinner initially (mock `listVouchers` to return a never-resolving promise).
- On resolve, renders a table row per voucher.
- On resolve with empty array, renders the "No vouchers generated yet." message.
- On reject, renders the ErrorBanner.

Mock pattern: `vi.mock('../../lib/api', () => ({ listVouchers: vi.fn() }))` and control resolution/rejection per test.

#### `src/components/__tests__/App.test.jsx` — add 2 cases

- Default active tab is Generate (form is visible, VoucherList is not).
- Clicking "Flight List" tab renders the VoucherList (table appears after mock resolves).

## Out of scope (YAGNI)

- Clicking a row to see per-voucher detail or seat map.
- Pagination, filtering, search, sort.
- Auto-refresh / polling.
- Delete voucher.
- Date / time formatting libraries — raw `YYYY-MM-DD` is fine.
- `created_at` display.
- Persistence of the active tab across reloads.
- Cross-tab state sync (e.g., auto-refreshing the list when a new voucher is generated on the Generate tab).
