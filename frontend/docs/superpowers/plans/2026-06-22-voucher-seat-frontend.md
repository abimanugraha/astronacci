# Voucher Seat Assignment Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page React app that lets flight crews enter flight details, calls the Laravel voucher API (`/check` then `/generate`), and renders the 3 assigned seats with clean, responsive daisyUI UI.

**Architecture:** Vite + React 18 single page. `App.jsx` owns submission state (idle / checking / generating / success / error) and orchestrates the strict two-step API flow. Pure helpers (`lib/api.js`, `lib/validation.js`, `lib/aircraft.js`) keep network, validation, and constants out of components. Presentational components (`VoucherForm`, `SeatResults`, `ErrorBanner`) are controlled and stateless except for local input state in the form. Styling uses daisyUI (Tailwind plugin) component classes — `btn`, `input`, `select`, `alert`, `card` — so markup stays semantic and themable. Every behavioral unit is built test-first with Vitest + React Testing Library; the final task is a manual browser smoke test against the running Laravel backend.

**Tech Stack:** React 18, Vite 5, Tailwind CSS 3 + daisyUI 4, Axios, Vitest, @testing-library/react, @testing-library/user-event, jsdom.

## Global Constraints

- **Node:** 24.x installed on host (do not downgrade). `npm` is the package manager — do not introduce `pnpm` or `yarn`.
- **React:** 18.x with JSX (not TypeScript). Spec explicitly names `App.jsx`.
- **Vite:** 5.x, default dev port `5173` (must stay default — backend CORS already allows `localhost:5173`).
- **Tailwind:** 3.4.x with `tailwind.config.js` + `postcss.config.js` + `@tailwind` directives. Do not use Tailwind v4 (different setup).
- **daisyUI:** 4.x installed as a Tailwind plugin and registered in ESM form (`import daisyui from 'daisyui'` then `plugins: [daisyui]`). Use component classes (`btn`, `btn-primary`, `input`, `input-bordered`, `select`, `select-bordered`, `alert`, `alert-error`, `card`, `card-body`, `card-title`, `badge`) instead of bespoke utility chains. Theme: `light` (default). Do not change theme tokens.
- **HTTP:** Axios (not `fetch`) — spec mentions it first and its interceptor/transform model simplifies error handling.
- **Backend base URL:** `http://localhost:8000` (Laravel default). Read from `VITE_API_BASE_URL` env var; never hardcode in components.
- **Endpoints (verbatim from spec/backend plan):**
  - `POST /api/check` body `{ flight_number, flight_date }` → 200 `{ exists: boolean, message: string }`, or 422 on validation error.
  - `POST /api/generate` body `{ crew_name, crew_id, flight_number, flight_date, aircraft_type }` → 201 `{ data: { id, crew_name, crew_id, flight_number, flight_date, aircraft_type, seats: [s1, s2, s3], created_at, updated_at } }`, 422 on validation error, 409 on duplicate.
- **Aircraft type strings — exact values sent to the API:** `"ATR"`, `"Airbus 320"`, `"Boeing 737 Max"`. Do not transform.
- **Date format submitted to API:** `YYYY-MM-DD` (native `<input type="date">` value — already in this format; no transformation).
- **Error banner copy (verbatim from spec):** `"Vouchers have already been generated for this flight and date."` — used when `/check` returns `exists: true` OR `/check` returns 422 OR `/generate` returns 409.
- **Seat labels in UI (verbatim from spec):** `Seat 1`, `Seat 2`, `Seat 3` (1-indexed).
- **CORS:** handled on backend side; frontend just targets `localhost:8000`.
- **TDD:** every behavior step is "write failing test → run (FAIL) → implement → run (PASS) → commit".
- **Commits:** after every green test cycle. Conventional Commit format (`feat:`, `chore:`, `test:`, `fix:`).
- **No emojis in code or UI** unless the user asks.
- **Don't add comments** unless behavior is genuinely non-obvious.

---

## File Structure

```
frontend/
├── index.html                       # Vite HTML entry
├── package.json
├── vite.config.js                   # Vite + Vitest (jsdom env, globals)
├── tailwind.config.js               # content globs, theme extensions
├── postcss.config.js                # tailwindcss + autoprefixer
├── .env                             # VITE_API_BASE_URL=http://localhost:8000
├── .env.example
├── .gitignore
├── docs/
│   ├── frontend.md                  # original spec (moved from root)
│   └── superpowers/plans/
│       └── 2026-06-22-voucher-seat-frontend.md   # this file
├── src/
│   ├── main.jsx                     # ReactDOM.createRoot(<App/>)
│   ├── App.jsx                      # orchestrator; owns submission state machine
│   ├── index.css                    # @tailwind base/components/utilities
│   ├── lib/
│   │   ├── api.js                   # axios instance + checkVoucher + generateVoucher
│   │   ├── aircraft.js              # AIRCRAFT_TYPES constant
│   │   └── validation.js            # validateForm(values) → errors object
│   ├── components/
│   │   ├── VoucherForm.jsx          # controlled inputs, calls onSubmit(values)
│   │   ├── SeatResults.jsx          # renders 3 seats as cards
│   │   └── ErrorBanner.jsx          # red banner, dismissible optional
│   └── test-setup.js                # @testing-library/jest-dom matchers
└── src/lib/__tests__/
    ├── aircraft.test.js
    ├── validation.test.js
    └── api.test.js
└── src/components/__tests__/
    ├── VoucherForm.test.jsx
    ├── SeatResults.test.jsx
    ├── ErrorBanner.test.jsx
    └── App.test.jsx
```

Responsibilities:
- `lib/aircraft.js` — single source of truth for the dropdown options and the validation allowlist. No imports beyond nothing.
- `lib/validation.js` — pure function that takes the form's values object and returns an errors object (`{}` when valid). No React, no network.
- `lib/api.js` — owns the axios instance (baseURL from env), exposes `checkVoucher({ flight_number, flight_date })` and `generateVoucher(payload)`. Throws on non-2xx (axios default); callers handle.
- `ErrorBanner.jsx` / `SeatResults.jsx` — presentational, props in, JSX out.
- `VoucherForm.jsx` — owns local input state; calls `props.onSubmit(values)` on submit. Surfaces its own validation errors inline.
- `App.jsx` — owns submission state machine, wires form callbacks to api functions, decides which banner / results to render. No DOM beyond layout shell.

---

## Task 1: Scaffold Vite + React, Tailwind, Vitest, Tooling

**Files:**
- Create: everything under `/home/apps/astronacci/frontend/` via `npm create vite` then augment
- Move: `frontend.md` → `docs/frontend.md`
- Create: `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `.env`, `.env.example`, `src/test-setup.js`, `src/index.css`, `src/lib/__tests__/sanity.test.js`

**Interfaces:**
- Consumes: nothing (project root)
- Produces: a Vite dev server that runs on `http://localhost:5173`, a Vitest runner that exits 0 with one passing sanity test, a Tailwind + daisyUI build pipeline that styles a `<h1>` in primary color.

- [ ] **Step 1: Move the spec out of the project root**

```bash
cd /home/apps/astronacci/frontend
mkdir -p docs
mv frontend.md docs/frontend.md
ls docs/
```

Expected: `frontend.md` is listed under `docs/`.

- [ ] **Step 2: Scaffold Vite + React into the current directory**

```bash
cd /home/apps/astronacci/frontend
npm create vite@latest . -- --template react
```

Notes:
- If prompted "Current directory is not empty", choose **Ignore files and continue** (the only conflicting file is `docs/`, which Vite won't touch).
- This creates `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/App.css`, `src/index.css`, `src/assets/`, `.gitignore`, `.eslintrc.cjs`, `README.md`.

- [ ] **Step 3: Install runtime dependency — Axios**

```bash
cd /home/apps/astronacci/frontend
npm install axios
```

- [ ] **Step 4: Install dev dependencies — Tailwind, PostCSS, Autoprefixer, daisyUI**

```bash
cd /home/apps/astronacci/frontend
npm install -D tailwindcss@3 postcss autoprefixer daisyui
```

- [ ] **Step 5: Install dev dependencies — Vitest + Testing Library**

```bash
cd /home/apps/astronacci/frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 6: Initialize Tailwind config**

```bash
cd /home/apps/astronacci/frontend
npx tailwindcss init -p
```

This creates `tailwind.config.js` and `postcss.config.js`.

- [ ] **Step 7: Replace `tailwind.config.js` with the real content**

Overwrite `/home/apps/astronacci/frontend/tailwind.config.js` with:

```javascript
import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [daisyui],
  daisyui: {
    themes: ['light'],
    logs: false,
  },
};
```

- [ ] **Step 8: Confirm `postcss.config.js` contents**

`/home/apps/astronacci/frontend/postcss.config.js` should already contain:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

If not, overwrite with the above.

- [ ] **Step 9: Replace `src/index.css` with Tailwind directives**

Overwrite `/home/apps/astronacci/frontend/src/index.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 10: Delete Vite's default styling files (no longer needed)**

```bash
cd /home/apps/astronacci/frontend
rm -f src/App.css src/assets/react.svg
```

- [ ] **Step 11: Replace `vite.config.js` with Vitest-aware config**

Overwrite `/home/apps/astronacci/frontend/vite.config.js` with:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.js'],
    css: true,
  },
});
```

- [ ] **Step 12: Create the Vitest setup file**

Create `/home/apps/astronacci/frontend/src/test-setup.js` with:

```javascript
import '@testing-library/jest-dom';
```

- [ ] **Step 13: Create `.env` and `.env.example`**

Create `/home/apps/astronacci/frontend/.env` with:

```
VITE_API_BASE_URL=http://localhost:8000
```

Create `/home/apps/astronacci/frontend/.env.example` with:

```
VITE_API_BASE_URL=http://localhost:8000
```

- [ ] **Step 14: Replace `src/App.jsx` with a minimal sanity shell**

Overwrite `/home/apps/astronacci/frontend/src/App.jsx` with:

```jsx
export default function App() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-base-200">
      <h1 className="text-3xl font-semibold text-primary">Voucher Seat Assignment</h1>
    </main>
  );
}
```

- [ ] **Step 15: Confirm `src/main.jsx` imports `index.css`**

`/home/apps/astronacci/frontend/src/main.jsx` should already contain `import './index.css'`. Verify and leave unchanged.

- [ ] **Step 16: Write the sanity test (will pass once Vitest runs)**

Create `/home/apps/astronacci/frontend/src/lib/__tests__/sanity.test.js` with:

```javascript
import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 17: Update `package.json` scripts**

Open `/home/apps/astronacci/frontend/package.json` and ensure the `"scripts"` block contains:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 18: Run the test suite — expect 1 passing**

```bash
cd /home/apps/astronacci/frontend
npm test
```

Expected: `Test Files  1 passed (1)` / `Tests  1 passed (1)`.

- [ ] **Step 19: Start dev server and confirm it boots**

```bash
cd /home/apps/astronacci/frontend
npm run dev
```

In a separate terminal:

```bash
curl -s http://localhost:5173 | head -20
```

Expected: HTML containing `<title>Vite + React</title>` (default Vite title — will rename later) and `<div id="root"></div>`.

Stop the dev server (`Ctrl+C`) once confirmed.

- [ ] **Step 20: Initialize git and commit the scaffold**

```bash
cd /home/apps/astronacci/frontend
git init
git add .
git commit -m "chore: scaffold Vite + React + Tailwind + Vitest"
```

If `git init` reports "Reinitialized existing Git repository" that is fine — the parent may already be a repo. Just `git add .` from inside `frontend/` and commit anyway. Use `git status` first if uncertain.

---

## Task 2: Aircraft Type Constants

**Files:**
- Create: `src/lib/aircraft.js`
- Test: `src/lib/__tests__/aircraft.test.js`

**Interfaces:**
- Consumes: nothing
- Produces: `AIRCRAFT_TYPES` — frozen array `["ATR", "Airbus 320", "Boeing 737 Max"]`, exported as a named export. Order matches spec dropdown order.

- [ ] **Step 1: Write the failing test**

Create `/home/apps/astronacci/frontend/src/lib/__tests__/aircraft.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { AIRCRAFT_TYPES } from '../aircraft';

describe('AIRCRAFT_TYPES', () => {
  it('contains the three spec-defined aircraft types in order', () => {
    expect(AIRCRAFT_TYPES).toEqual(['ATR', 'Airbus 320', 'Boeing 737 Max']);
  });

  it('is frozen', () => {
    expect(Object.isFrozen(AIRCRAFT_TYPES)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test — expect it to fail**

```bash
cd /home/apps/astronacci/frontend
npm test
```

Expected: FAIL with `Failed to resolve import "../aircraft"` (or similar module-not-found error).

- [ ] **Step 3: Implement `aircraft.js`**

Create `/home/apps/astronacci/frontend/src/lib/aircraft.js`:

```javascript
export const AIRCRAFT_TYPES = Object.freeze(['ATR', 'Airbus 320', 'Boeing 737 Max']);
```

- [ ] **Step 4: Run the test — expect it to pass**

```bash
cd /home/apps/astronacci/frontend
npm test
```

Expected: aircraft tests pass (2 tests).

- [ ] **Step 5: Commit**

```bash
cd /home/apps/astronacci/frontend
git add src/lib/aircraft.js src/lib/__tests__/aircraft.test.js
git commit -m "feat: add AIRCRAFT_TYPES constant"
```

---

## Task 3: Form Validation Helper

**Files:**
- Create: `src/lib/validation.js`
- Test: `src/lib/__tests__/validation.test.js`

**Interfaces:**
- Consumes: `AIRCRAFT_TYPES` from `./aircraft.js`
- Produces: `validateForm(values)` where `values` is `{ crew_name, crew_id, flight_number, flight_date, aircraft_type }`. Returns an errors object `{ crew_name?: string, crew_id?: string, flight_number?: string, flight_date?: string, aircraft_type?: string }`. Empty object `{}` means valid.

Rules:
- All five fields required (non-empty after `.trim()`).
- `aircraft_type` must be one of `AIRCRAFT_TYPES`.
- `flight_date` must match `/^\d{4}-\d{2}-\d{2}$/` (native date input already enforces this, but client validation must not trust the input).
- Trim leading/trailing whitespace before checking emptiness; do not mutate the input.

- [ ] **Step 1: Write the failing test**

Create `/home/apps/astronacci/frontend/src/lib/__tests__/validation.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { validateForm } from '../validation';

const valid = {
  crew_name: 'Putri',
  crew_id: 'CRW001',
  flight_number: 'GA102',
  flight_date: '2026-07-01',
  aircraft_type: 'ATR',
};

describe('validateForm', () => {
  it('returns no errors for a fully valid payload', () => {
    expect(validateForm(valid)).toEqual({});
  });

  it('flags missing crew_name', () => {
    expect(validateForm({ ...valid, crew_name: '' })).toHaveProperty('crew_name');
  });

  it('flags whitespace-only crew_name', () => {
    expect(validateForm({ ...valid, crew_name: '   ' })).toHaveProperty('crew_name');
  });

  it('flags missing crew_id', () => {
    expect(validateForm({ ...valid, crew_id: '' })).toHaveProperty('crew_id');
  });

  it('flags missing flight_number', () => {
    expect(validateForm({ ...valid, flight_number: '' })).toHaveProperty('flight_number');
  });

  it('flags missing flight_date', () => {
    expect(validateForm({ ...valid, flight_date: '' })).toHaveProperty('flight_date');
  });

  it('flags flight_date in wrong format', () => {
    expect(validateForm({ ...valid, flight_date: '01/07/2026' })).toHaveProperty('flight_date');
  });

  it('flags missing aircraft_type', () => {
    expect(validateForm({ ...valid, aircraft_type: '' })).toHaveProperty('aircraft_type');
  });

  it('flags aircraft_type not in allowlist', () => {
    expect(validateForm({ ...valid, aircraft_type: 'Boeing 747' })).toHaveProperty('aircraft_type');
  });

  it('accepts all three valid aircraft types', () => {
    for (const t of ['ATR', 'Airbus 320', 'Boeing 737 Max']) {
      expect(validateForm({ ...valid, aircraft_type: t })).toEqual({});
    }
  });

  it('does not mutate the input', () => {
    const input = { ...valid, crew_name: '  Putri  ' };
    const snapshot = JSON.stringify(input);
    validateForm(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});
```

- [ ] **Step 2: Run the test — expect it to fail**

```bash
cd /home/apps/astronacci/frontend
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `validation.js`**

Create `/home/apps/astronacci/frontend/src/lib/validation.js`:

```javascript
import { AIRCRAFT_TYPES } from './aircraft';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateForm(values) {
  const errors = {};

  const crew_name = (values.crew_name ?? '').trim();
  const crew_id = (values.crew_id ?? '').trim();
  const flight_number = (values.flight_number ?? '').trim();
  const flight_date = values.flight_date ?? '';
  const aircraft_type = values.aircraft_type ?? '';

  if (!crew_name) errors.crew_name = 'Crew name is required.';
  if (!crew_id) errors.crew_id = 'Crew ID is required.';
  if (!flight_number) errors.flight_number = 'Flight number is required.';
  if (!flight_date) {
    errors.flight_date = 'Flight date is required.';
  } else if (!DATE_RE.test(flight_date)) {
    errors.flight_date = 'Flight date must be in YYYY-MM-DD format.';
  }
  if (!aircraft_type) {
    errors.aircraft_type = 'Aircraft type is required.';
  } else if (!AIRCRAFT_TYPES.includes(aircraft_type)) {
    errors.aircraft_type = 'Aircraft type is not in the allowed list.';
  }

  return errors;
}
```

- [ ] **Step 4: Run the test — expect it to pass**

```bash
cd /home/apps/astronacci/frontend
npm test
```

Expected: all validation tests pass.

- [ ] **Step 5: Commit**

```bash
cd /home/apps/astronacci/frontend
git add src/lib/validation.js src/lib/__tests__/validation.test.js
git commit -m "feat: add validateForm helper"
```

---

## Task 4: API Client (Axios Instance + checkVoucher + generateVoucher)

**Files:**
- Create: `src/lib/api.js`
- Test: `src/lib/__tests__/api.test.js`

**Interfaces:**
- Consumes: `import.meta.env.VITE_API_BASE_URL` (string, e.g. `http://localhost:8000`).
- Produces:
  - `checkVoucher({ flight_number, flight_date })` → resolves to `{ exists: boolean, message: string }` (the parsed JSON body). Throws the axios error on non-2xx so callers can inspect `.response.status`.
  - `generateVoucher(payload)` where payload is the full form values → resolves to the `data` field of the response body (i.e. `{ id, crew_name, crew_id, flight_number, flight_date, aircraft_type, seats: [s1, s2, s3], created_at, updated_at }`). Throws on non-2xx.
- Both functions POST to `/api/check` and `/api/generate` on the configured base URL.

Notes for callers (used by App in Task 8):
- `checkVoucher` resolves with the body even on 200; callers branch on `body.exists`.
- A 422 from `/api/check` is treated by App as "duplicate" per the spec (a duplicate flight_number/date is the validation trigger) — `checkVoucher` will *throw* on 422; App's catch block maps it to the duplicate banner.

- [ ] **Step 1: Write the failing test**

Create `/home/apps/astronacci/frontend/src/lib/__tests__/api.test.js`:

```javascript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { checkVoucher, generateVoucher } from '../api';

vi.mock('axios');

const OK_CHECK_BODY = { exists: false, message: 'No voucher found for this flight and date.' };
const GENERATE_BODY = {
  data: {
    id: 1,
    crew_name: 'Putri',
    crew_id: 'CRW001',
    flight_number: 'GA102',
    flight_date: '2026-07-01',
    aircraft_type: 'ATR',
    seats: ['1A', '14C', '18F'],
    created_at: '2026-06-22T00:00:00.000000Z',
    updated_at: '2026-06-22T00:00:00.000000Z',
  },
};

describe('api client', () => {
  beforeEach(() => {
    axios.post.mockReset();
    import.meta.env.VITE_API_BASE_URL = 'http://localhost:8000';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('checkVoucher', () => {
    it('POSTs to /api/check with flight_number and flight_date', async () => {
      axios.post.mockResolvedValueOnce({ status: 200, data: OK_CHECK_BODY });

      const result = await checkVoucher({ flight_number: 'GA102', flight_date: '2026-07-01' });

      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/check',
        { flight_number: 'GA102', flight_date: '2026-07-01' },
      );
      expect(result).toEqual(OK_CHECK_BODY);
    });

    it('returns the parsed body as-is', async () => {
      axios.post.mockResolvedValueOnce({ status: 200, data: { exists: true, message: 'exists' } });
      const result = await checkVoucher({ flight_number: 'GA102', flight_date: '2026-07-01' });
      expect(result).toEqual({ exists: true, message: 'exists' });
    });

    it('propagates the axios error on non-2xx', async () => {
      const error = new Error('Request failed with status code 422');
      error.response = { status: 422, data: { message: 'invalid', errors: { flight_number: ['required'] } } };
      axios.post.mockRejectedValueOnce(error);
      await expect(
        checkVoucher({ flight_number: '', flight_date: '2026-07-01' }),
      ).rejects.toBe(error);
    });
  });

  describe('generateVoucher', () => {
    it('POSTs to /api/generate with the full payload', async () => {
      axios.post.mockResolvedValueOnce({ status: 201, data: GENERATE_BODY });

      const payload = {
        crew_name: 'Putri',
        crew_id: 'CRW001',
        flight_number: 'GA102',
        flight_date: '2026-07-01',
        aircraft_type: 'ATR',
      };

      const result = await generateVoucher(payload);

      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/generate',
        payload,
      );
      expect(result).toEqual(GENERATE_BODY.data);
    });

    it('returns only the inner data field, not the wrapper', async () => {
      axios.post.mockResolvedValueOnce({ status: 201, data: GENERATE_BODY });
      const result = await generateVoucher({
        crew_name: 'Putri',
        crew_id: 'CRW001',
        flight_number: 'GA102',
        flight_date: '2026-07-01',
        aircraft_type: 'ATR',
      });
      expect(result).toHaveProperty('seats', ['1A', '14C', '18F']);
      expect(result).not.toHaveProperty('data');
    });

    it('propagates the axios error on 409 duplicate', async () => {
      const error = new Error('Request failed with status code 409');
      error.response = { status: 409, data: { message: 'Voucher already exists for this flight and date.' } };
      axios.post.mockRejectedValueOnce(error);
      await expect(
        generateVoucher({
          crew_name: 'Putri',
          crew_id: 'CRW001',
          flight_number: 'GA102',
          flight_date: '2026-07-01',
          aircraft_type: 'ATR',
        }),
      ).rejects.toBe(error);
    });
  });
});
```

- [ ] **Step 2: Run the test — expect it to fail**

```bash
cd /home/apps/astronacci/frontend
npm test
```

Expected: FAIL — `Failed to resolve import "../api"`.

- [ ] **Step 3: Implement `api.js`**

Create `/home/apps/astronacci/frontend/src/lib/api.js`:

```javascript
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

const client = axios.create({ baseURL, headers: { Accept: 'application/json' } });

export async function checkVoucher({ flight_number, flight_date }) {
  const response = await client.post('/api/check', { flight_number, flight_date });
  return response.data;
}

export async function generateVoucher(payload) {
  const response = await client.post('/api/generate', payload);
  return response.data.data;
}
```

- [ ] **Step 4: Run the test — expect it to pass**

```bash
cd /home/apps/astronacci/frontend
npm test
```

Expected: all api tests pass.

- [ ] **Step 5: Commit**

```bash
cd /home/apps/astronacci/frontend
git add src/lib/api.js src/lib/__tests__/api.test.js
git commit -m "feat: add axios-based API client for /check and /generate"
```

---

## Task 5: ErrorBanner Component

**Files:**
- Create: `src/components/ErrorBanner.jsx`
- Test: `src/components/__tests__/ErrorBanner.test.jsx`

**Interfaces:**
- Consumes: `message: string` (required), optional `onDismiss?: () => void`.
- Produces: a red, ARIA-labelled alert (`role="alert"`) that renders the message verbatim. When `onDismiss` is provided, renders a close button with `aria-label="Dismiss error"`.

- [ ] **Step 1: Write the failing test**

Create `/home/apps/astronacci/frontend/src/components/__tests__/ErrorBanner.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBanner from '../ErrorBanner';

describe('ErrorBanner', () => {
  it('renders the message verbatim', () => {
    render(<ErrorBanner message="Vouchers have already been generated for this flight and date." />);
    expect(
      screen.getByText('Vouchers have already been generated for this flight and date.'),
    ).toBeInTheDocument();
  });

  it('has role="alert"', () => {
    render(<ErrorBanner message="boom" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('uses the daisyUI error alert classes', () => {
    const { container } = render(<ErrorBanner message="boom" />);
    expect(container.firstChild.className).toContain('alert');
    expect(container.firstChild.className).toContain('alert-error');
  });

  it('does not render a dismiss button when onDismiss is not provided', () => {
    render(<ErrorBanner message="boom" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a dismiss button that calls onDismiss when onDismiss is provided', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<ErrorBanner message="boom" onDismiss={onDismiss} />);
    const button = screen.getByRole('button', { name: /dismiss error/i });
    await user.click(button);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the test — expect it to fail**

```bash
cd /home/apps/astronacci/frontend
npm test
```

Expected: FAIL — `Failed to resolve import "../ErrorBanner"`.

- [ ] **Step 3: Implement `ErrorBanner.jsx`**

Create `/home/apps/astronacci/frontend/src/components/ErrorBanner.jsx`:

```jsx
export default function ErrorBanner({ message, onDismiss }) {
  return (
    <div role="alert" className="alert alert-error justify-between">
      <p>{message}</p>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss error"
          onClick={onDismiss}
          className="btn btn-sm btn-ghost text-error-content"
        >
          &times;
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run the test — expect it to pass**

```bash
cd /home/apps/astronacci/frontend
npm test
```

Expected: ErrorBanner tests pass.

- [ ] **Step 5: Commit**

```bash
cd /home/apps/astronacci/frontend
git add src/components/ErrorBanner.jsx src/components/__tests__/ErrorBanner.test.jsx
git commit -m "feat: add ErrorBanner component"
```

---

## Task 6: SeatResults Component

**Files:**
- Create: `src/components/SeatResults.jsx`
- Test: `src/components/__tests__/SeatResults.test.jsx`

**Interfaces:**
- Consumes: `seats: Array<string>` (required, exactly 3 elements), optional `crewName?: string`.
- Produces: a green success card grid. Each seat is rendered as `Seat {n}: {seat}` where `n` is 1, 2, 3 (1-indexed), inside an element with `aria-label="Seat {n}"`.

- [ ] **Step 1: Write the failing test**

Create `/home/apps/astronacci/frontend/src/components/__tests__/SeatResults.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SeatResults from '../SeatResults';

describe('SeatResults', () => {
  it('renders three seat cards with the spec labels', () => {
    render(<SeatResults seats={['1A', '14C', '18F']} />);
    expect(screen.getByText('Seat 1:')).toBeInTheDocument();
    expect(screen.getByText('1A')).toBeInTheDocument();
    expect(screen.getByText('Seat 2:')).toBeInTheDocument();
    expect(screen.getByText('14C')).toBeInTheDocument();
    expect(screen.getByText('Seat 3:')).toBeInTheDocument();
    expect(screen.getByText('18F')).toBeInTheDocument();
  });

  it('marks each seat card with aria-label="Seat N"', () => {
    render(<SeatResults seats={['1A', '14C', '18F']} />);
    expect(screen.getByLabelText('Seat 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Seat 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Seat 3')).toBeInTheDocument();
  });

  it('renders a success heading', () => {
    render(<SeatResults seats={['1A', '14C', '18F']} />;
    expect(screen.getByRole('heading', { name: /seats assigned/i })).toBeInTheDocument();
  });

  it('renders crew name when provided', () => {
    render(<SeatResults seats={['1A', '14C', '18F']} crewName="Putri" />);
    expect(screen.getByText(/Putri/)).toBeInTheDocument();
  });

  it('does not render crew line when crewName is absent', () => {
    render(<SeatResults seats={['1A', '14C', '18F']} />);
    expect(screen.queryByText(/Crew:/i)).not.toBeInTheDocument();
  });
});
```

Note: the third test has a typo (`/>` instead of `)`). Use the corrected version below when creating the file — the correct line is:

```jsx
  it('renders a success heading', () => {
    render(<SeatResults seats={['1A', '14C', '18F']} />);
    expect(screen.getByRole('heading', { name: /seats assigned/i })).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the test — expect it to fail**

```bash
cd /home/apps/astronacci/frontend
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `SeatResults.jsx`**

Create `/home/apps/astronacci/frontend/src/components/SeatResults.jsx`:

```jsx
export default function SeatResults({ seats, crewName }) {
  return (
    <section className="card bg-success text-success-content shadow-md">
      <div className="card-body">
        <h2 className="card-title">Seats assigned</h2>
        {crewName && <p className="text-sm opacity-90">Crew: {crewName}</p>}
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {seats.map((seat, i) => {
            const n = i + 1;
            return (
              <li
                key={n}
                aria-label={`Seat ${n}`}
                className="rounded-box bg-base-100 p-4 text-center text-neutral shadow-sm"
              >
                <p className="text-xs uppercase tracking-wide text-neutral/60">Seat {n}:</p>
                <p className="mt-1 text-2xl font-bold text-neutral">{seat}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run the test — expect it to pass**

```bash
cd /home/apps/astronacci/frontend
npm test
```

Expected: SeatResults tests pass.

- [ ] **Step 5: Commit**

```bash
cd /home/apps/astronacci/frontend
git add src/components/SeatResults.jsx src/components/__tests__/SeatResults.test.jsx
git commit -m "feat: add SeatResults component"
```

---

## Task 7: VoucherForm Component

**Files:**
- Create: `src/components/VoucherForm.jsx`
- Test: `src/components/__tests__/VoucherForm.test.jsx`

**Interfaces:**
- Consumes:
  - `onSubmit: (values) => void | Promise<void>` (required) — called with `{ crew_name, crew_id, flight_number, flight_date, aircraft_type }` after local validation passes.
  - `loading: boolean` (default `false`) — when true, disables all inputs and the submit button, and the button shows the label "Generating…".
- Produces: a controlled form. Local state holds input values. On submit: runs `validateForm` from `lib/validation.js`; if errors exist, renders inline error text under each field and does NOT call `onSubmit`; otherwise calls `onSubmit(values)`. The Aircraft Type dropdown is populated from `AIRCRAFT_TYPES` (`lib/aircraft.js`).

Field-by-field markup contracts:
- Crew Name: `<input name="crew_name" />`, label text "Crew Name".
- Crew ID: `<input name="crew_id" />`, label text "Crew ID".
- Flight Number: `<input name="flight_number" />`, label text "Flight Number", placeholder "GA102".
- Flight Date: `<input type="date" name="flight_date" />`, label text "Flight Date".
- Aircraft Type: `<select name="aircraft_type">` with a disabled placeholder `<option value="">Select an aircraft type</option>` plus one option per `AIRCRAFT_TYPES` value; label text "Aircraft Type".
- Submit button: text "Generate Vouchers" (or "Generating…" when loading), `type="submit"`.

- [ ] **Step 1: Write the failing test**

Create `/home/apps/astronacci/frontend/src/components/__tests__/VoucherForm.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoucherForm from '../VoucherForm';

describe('VoucherForm', () => {
  it('renders all five labelled inputs', () => {
    render(<VoucherForm onSubmit={() => {}} />);
    expect(screen.getByLabelText(/crew name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/crew id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/flight number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/flight date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/aircraft type/i)).toBeInTheDocument();
  });

  it('renders a Generate Vouchers submit button', () => {
    render(<VoucherForm onSubmit={() => {}} />);
    expect(screen.getByRole('button', { name: /generate vouchers/i })).toBeInTheDocument();
  });

  it('shows the three aircraft types as options', () => {
    render(<VoucherForm onSubmit={() => {}} />);
    expect(screen.getByRole('option', { name: 'ATR' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Airbus 320' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Boeing 737 Max' })).toBeInTheDocument();
  });

  it('does not call onSubmit when fields are empty and shows inline errors', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<VoucherForm onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: /generate vouchers/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/crew name is required/i)).toBeInTheDocument();
  });

  it('submits the five values when the form is valid', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<VoucherForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/crew name/i), 'Putri');
    await user.type(screen.getByLabelText(/crew id/i), 'CRW001');
    await user.type(screen.getByLabelText(/flight number/i), 'GA102');
    await user.type(screen.getByLabelText(/flight date/i), '2026-07-01');
    await user.selectOptions(
      screen.getByLabelText(/aircraft type/i),
      'Airbus 320',
    );
    await user.click(screen.getByRole('button', { name: /generate vouchers/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      crew_name: 'Putri',
      crew_id: 'CRW001',
      flight_number: 'GA102',
      flight_date: '2026-07-01',
      aircraft_type: 'Airbus 320',
    });
  });

  it('disables all inputs and the button and shows Generating… when loading=true', () => {
    render(<VoucherForm onSubmit={() => {}} loading />);
    expect(screen.getByLabelText(/crew name/i)).toBeDisabled();
    expect(screen.getByLabelText(/crew id/i)).toBeDisabled();
    expect(screen.getByLabelText(/flight number/i)).toBeDisabled();
    expect(screen.getByLabelText(/flight date/i)).toBeDisabled();
    expect(screen.getByLabelText(/aircraft type/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run the test — expect it to fail**

```bash
cd /home/apps/astronacci/frontend
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `VoucherForm.jsx`**

Create `/home/apps/astronacci/frontend/src/components/VoucherForm.jsx`:

```jsx
import { useState } from 'react';
import { AIRCRAFT_TYPES } from '../lib/aircraft';
import { validateForm } from '../lib/validation';

const INITIAL = {
  crew_name: '',
  crew_id: '',
  flight_number: '',
  flight_date: '',
  aircraft_type: '',
};

export default function VoucherForm({ onSubmit, loading = false }) {
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState({});

  function update(field) {
    return (event) => {
      setValues((v) => ({ ...v, [field]: event.target.value }));
      setErrors((e) => ({ ...e, [field]: undefined }));
    };
  }

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
      <Field
        label="Crew Name"
        name="crew_name"
        value={values.crew_name}
        onChange={update('crew_name')}
        error={errors.crew_name}
        disabled={loading}
        autoComplete="off"
      />
      <Field
        label="Crew ID"
        name="crew_id"
        value={values.crew_id}
        onChange={update('crew_id')}
        error={errors.crew_id}
        disabled={loading}
        autoComplete="off"
      />
      <Field
        label="Flight Number"
        name="flight_number"
        value={values.flight_number}
        onChange={update('flight_number')}
        error={errors.flight_number}
        disabled={loading}
        placeholder="GA102"
        autoComplete="off"
      />
      <Field
        label="Flight Date"
        name="flight_date"
        type="date"
        value={values.flight_date}
        onChange={update('flight_date')}
        error={errors.flight_date}
        disabled={loading}
      />
      <div className="flex flex-col sm:col-span-2">
        <label htmlFor="aircraft_type" className="mb-1 text-sm font-medium text-base-content">
          Aircraft Type
        </label>
        <select
          id="aircraft_type"
          name="aircraft_type"
          value={values.aircraft_type}
          onChange={update('aircraft_type')}
          disabled={loading}
          className="select select-bordered w-full"
        >
          <option value="">Select an aircraft type</option>
          {AIRCRAFT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {errors.aircraft_type && (
          <p className="mt-1 text-sm text-error">{errors.aircraft_type}</p>
        )}
      </div>
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? 'Generating…' : 'Generate Vouchers'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, name, value, onChange, error, disabled, type = 'text', placeholder, autoComplete }) {
  return (
    <div className="flex flex-col">
      <label htmlFor={name} className="mb-1 text-sm font-medium text-base-content">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="input input-bordered w-full"
      />
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Run the test — expect it to pass**

```bash
cd /home/apps/astronacci/frontend
npm test
```

Expected: VoucherForm tests pass (6 tests).

- [ ] **Step 5: Commit**

```bash
cd /home/apps/astronacci/frontend
git add src/components/VoucherForm.jsx src/components/__tests__/VoucherForm.test.jsx
git commit -m "feat: add VoucherForm component with local validation"
```

---

## Task 8: App Integration — Wire Form, API Flow, and Result/Error UI

**Files:**
- Modify: `src/App.jsx`
- Test: `src/components/__tests__/App.test.jsx`

**Interfaces:**
- Consumes: `VoucherForm`, `SeatResults`, `ErrorBanner` (Tasks 5–7); `checkVoucher`, `generateVoucher` (Task 4).
- Produces: `App` — owns the submission state machine. Submission lifecycle:
  1. Idle (`status: 'idle'`).
  2. On `VoucherForm.onSubmit(values)`: set `status: 'loading'`, clear any prior error and seats.
  3. `await checkVoucher({ flight_number, flight_date })`. On thrown error OR `body.exists === true`: set `status: 'error'`, `errorMessage = 'Vouchers have already been generated for this flight and date.'`, return.
  4. `await generateVoucher(values)`. On 201: set `status: 'success'`, store the returned voucher. On thrown error: if `error.response.status === 409`, set duplicate error message (same verbatim copy); otherwise set a generic error message `Something went wrong. Please try again.`.
- The "Generate Vouchers" button shows loading state via `VoucherForm`'s `loading` prop whenever `status === 'loading'`.

State shape:

```js
{ status: 'idle' | 'loading' | 'success' | 'error',
  errorMessage: string,
  voucher: { id, crew_name, crew_id, flight_number, flight_date, aircraft_type, seats, created_at, updated_at } | null }
```

- [ ] **Step 1: Write the failing test**

Create `/home/apps/astronacci/frontend/src/components/__tests__/App.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

vi.mock('../../src/lib/api', () => ({
  checkVoucher: vi.fn(),
  generateVoucher: vi.fn(),
}));

import { checkVoucher, generateVoucher } from '../../src/lib/api';

function fillForm(user) {
  await user.type(screen.getByLabelText(/crew name/i), 'Putri');
  await user.type(screen.getByLabelText(/crew id/i), 'CRW001');
  await user.type(screen.getByLabelText(/flight number/i), 'GA102');
  await user.type(screen.getByLabelText(/flight date/i), '2026-07-01');
  await user.selectOptions(screen.getByLabelText(/aircraft type/i), 'ATR');
}

describe('App', () => {
  beforeEach(() => {
    checkVoucher.mockReset();
    generateVoucher.mockReset();
  });

  it('renders the page heading and form', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /voucher seat assignment/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/crew name/i)).toBeInTheDocument();
  });

  it('calls checkVoucher then generateVoucher in order on a successful submit and shows seats', async () => {
    const user = userEvent.setup();
    checkVoucher.mockResolvedValueOnce({ exists: false, message: 'no voucher' });
    generateVoucher.mockResolvedValueOnce({
      id: 7,
      crew_name: 'Putri',
      crew_id: 'CRW001',
      flight_number: 'GA102',
      flight_date: '2026-07-01',
      aircraft_type: 'ATR',
      seats: ['1A', '14C', '18F'],
      created_at: '2026-06-22T00:00:00.000000Z',
      updated_at: '2026-06-22T00:00:00.000000Z',
    });

    render(<App />);
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /generate vouchers/i }));

    expect(checkVoucher).toHaveBeenCalledWith({ flight_number: 'GA102', flight_date: '2026-07-01' });
    expect(generateVoucher).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByText('1A')).toBeInTheDocument();
      expect(screen.getByText('14C')).toBeInTheDocument();
      expect(screen.getByText('18F')).toBeInTheDocument();
    });
  });

  it('shows the duplicate banner when checkVoucher returns exists=true and does NOT call generateVoucher', async () => {
    const user = userEvent.setup();
    checkVoucher.mockResolvedValueOnce({ exists: true, message: 'exists' });

    render(<App />);
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /generate vouchers/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Vouchers have already been generated for this flight and date.'),
      ).toBeInTheDocument();
    });
    expect(generateVoucher).not.toHaveBeenCalled();
  });

  it('shows the duplicate banner when checkVoucher throws (422) and does NOT call generateVoucher', async () => {
    const user = userEvent.setup();
    const err = new Error('422');
    err.response = { status: 422, data: { message: 'invalid' } };
    checkVoucher.mockRejectedValueOnce(err);

    render(<App />);
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /generate vouchers/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Vouchers have already been generated for this flight and date.'),
      ).toBeInTheDocument();
    });
    expect(generateVoucher).not.toHaveBeenCalled();
  });

  it('shows the duplicate banner when generateVoucher throws 409', async () => {
    const user = userEvent.setup();
    checkVoucher.mockResolvedValueOnce({ exists: false, message: 'no voucher' });
    const err = new Error('409');
    err.response = { status: 409, data: { message: 'duplicate' } };
    generateVoucher.mockRejectedValueOnce(err);

    render(<App />);
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /generate vouchers/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Vouchers have already been generated for this flight and date.'),
      ).toBeInTheDocument();
    });
  });

  it('shows generic error when generateVoucher throws a non-409 error', async () => {
    const user = userEvent.setup();
    checkVoucher.mockResolvedValueOnce({ exists: false, message: 'no voucher' });
    const err = new Error('500');
    err.response = { status: 500, data: { message: 'boom' } };
    generateVoucher.mockRejectedValueOnce(err);

    render(<App />);
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /generate vouchers/i }));

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });
});
```

Note on the `vi.mock` path: the test file lives at `src/components/__tests__/App.test.jsx` and `App.jsx` lives at `src/App.jsx`. The mock path `'../../src/lib/api'` is relative to the test file — adjust if you move the test. A safer pattern is to mock the bare module specifier relative to the file being tested; see Step 3's implementation note.

- [ ] **Step 2: Run the test — expect it to fail**

```bash
cd /home/apps/astronacci/frontend
npm test
```

Expected: FAIL — App still renders the placeholder heading only; either no seats appear or the duplicate banner is missing. Likely failure messages: `Unable to find text "1A"` or `expected checkVoucher to have been called`.

- [ ] **Step 3: Implement `App.jsx`**

Overwrite `/home/apps/astronacci/frontend/src/App.jsx` with:

```jsx
import { useState } from 'react';
import VoucherForm from './components/VoucherForm';
import SeatResults from './components/SeatResults';
import ErrorBanner from './components/ErrorBanner';
import { checkVoucher, generateVoucher } from './lib/api';

const DUPLICATE_MESSAGE = 'Vouchers have already been generated for this flight and date.';
const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

export default function App() {
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [voucher, setVoucher] = useState(null);

  async function handleSubmit(values) {
    setStatus('loading');
    setErrorMessage('');
    setVoucher(null);

    try {
      const result = await checkVoucher({
        flight_number: values.flight_number,
        flight_date: values.flight_date,
      });
      if (result.exists) {
        setStatus('error');
        setErrorMessage(DUPLICATE_MESSAGE);
        return;
      }
    } catch {
      setStatus('error');
      setErrorMessage(DUPLICATE_MESSAGE);
      return;
    }

    try {
      const created = await generateVoucher(values);
      setVoucher(created);
      setStatus('success');
    } catch (err) {
      const statusFromServer = err?.response?.status;
      setStatus('error');
      setErrorMessage(statusFromServer === 409 ? DUPLICATE_MESSAGE : GENERIC_MESSAGE);
    }
  }

  return (
    <main className="min-h-screen bg-base-200 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-base-content">Voucher Seat Assignment</h1>
          <p className="mt-1 text-sm text-base-content/70">
            Enter the flight details to generate 3 random promotional seats.
          </p>
        </header>

        <section className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <VoucherForm onSubmit={handleSubmit} loading={status === 'loading'} />
          </div>
        </section>

        {status === 'error' && (
          <div className="mt-6">
            <ErrorBanner message={errorMessage} />
          </div>
        )}

        {status === 'success' && voucher && (
          <div className="mt-6">
            <SeatResults seats={voucher.seats} crewName={voucher.crew_name} />
          </div>
        )}
      </div>
    </main>
  );
}
```

Implementation notes for the test-side mock path: the test mocks `'../../src/lib/api'` — that path is resolved relative to the test file. Vite/Vitest resolves it against the test file's location (`src/components/__tests__/`), so `'../../src/lib/api'` resolves to `src/lib/api`. The app's own import `'./lib/api'` resolves to the same file at runtime. Both resolutions hit the same module ID, so Vitest's mock applies. If the path-math gives you trouble, switch the test's `vi.mock` to `vi.mock('../../lib/api', ...)` (one fewer `../`) only if your test file actually lives at `src/components/__tests__/App.test.jsx` — it does, so use the version in the test above as written. Verify by running the test.

- [ ] **Step 4: Run the test — expect it to pass**

```bash
cd /home/apps/astronacci/frontend
npm test
```

Expected: all App tests pass (6 tests), plus the rest of the suite stays green.

- [ ] **Step 5: Commit**

```bash
cd /home/apps/astronacci/frontend
git add src/App.jsx src/components/__tests__/App.test.jsx
git commit -m "feat: wire App submission state machine with check-then-generate flow"
```

---

## Task 9: Browser Smoke Test Against the Running Laravel Backend

**Files:**
- Modify: `index.html` (page title only)
- No tests added in this task — it is a manual verification gate.

**Interfaces:**
- Consumes: the full app from Tasks 1–8 plus a running Laravel backend on `http://localhost:8000`.
- Produces: confirmation (recorded as a brief note in the final commit message) that the golden-path and the duplicate-path both work end-to-end in a real browser against the real API.

- [ ] **Step 1: Update the page title**

Open `/home/apps/astronacci/frontend/index.html` and change the `<title>` tag from `Vite + React` to:

```html
<title>Voucher Seat Assignment</title>
```

- [ ] **Step 2: Verify the backend is running**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/api/check -X POST -H "Content-Type: application/json" -H "Accept: application/json" -d '{"flight_number":"GA102","flight_date":"2026-07-01"}'
```

Expected: `200` (or `422` if the backend is rejecting empty/invalid input — both prove the server is up). If `000` or connection refused: start the Laravel backend first (`cd /home/apps/astronacci/backend && php artisan serve`) and re-check before proceeding.

- [ ] **Step 3: Start the Vite dev server**

```bash
cd /home/apps/astronacci/frontend
npm run dev
```

Leave it running. Note the Local URL (typically `http://localhost:5173/`).

- [ ] **Step 4: Golden-path smoke test**

In a browser, open the Vite URL and perform these steps, noting the result of each:

1. Page heading reads **"Voucher Seat Assignment"**.
2. Click **Generate Vouchers** with all fields empty — verify inline error text appears under each of the five fields and no API call is made (check the dev-server terminal: no POST log).
3. Fill the form:
   - Crew Name: `Putri`
   - Crew ID: `CRW001`
   - Flight Number: `GA102`
   - Flight Date: any future date in `YYYY-MM-DD`
   - Aircraft Type: `ATR`
4. Click **Generate Vouchers**. While loading: button reads **"Generating…"** and all inputs are disabled.
5. On success: a green **Seats assigned** card appears with three seats labelled **Seat 1**, **Seat 2**, **Seat 3**, each rendered as a valid ATR seat (`<row><A|C|D|F>`, row 1–18).

- [ ] **Step 5: Duplicate-path smoke test**

Without restarting the dev server, re-submit the same form a second time:

1. Click **Generate Vouchers** again with the exact same `flight_number` + `flight_date`.
2. Verify the red error banner appears with the exact copy: **"Vouchers have already been generated for this flight and date."**
3. Verify the previous Seats card is no longer visible (App clears it on submit).
4. Verify the backend terminal log shows `POST /api/check ... 200` and no `POST /api/generate` after it (the second path short-circuits).

- [ ] **Step 6: Network-error smoke test (optional but recommended)**

Stop the Laravel backend (`Ctrl+C` in its terminal). Re-submit the form with a new flight number/date. Expected behaviour: red banner with the generic copy **"Something went wrong. Please try again."** Restart the backend afterward.

- [ ] **Step 7: Commit the title change and stop the dev server**

Stop the dev server with `Ctrl+C` in its terminal. Then:

```bash
cd /home/apps/astronacci/frontend
git add index.html
git commit -m "chore: set page title to Voucher Seat Assignment

Manual browser smoke test passed against http://localhost:8000:
- golden path: ATR form submits, 3 valid seats rendered
- duplicate path: second submit of same flight/date shows duplicate banner"
```

---

## Self-Review

**1. Spec coverage**

| Spec requirement | Implemented in |
|---|---|
| React (Vite) | Task 1 |
| Tailwind CSS, responsive, modern | Task 1 (Tailwind + daisyUI pipeline), Tasks 5–8 (daisyUI component classes — `alert`, `card`, `input`, `select`, `btn` — plus `sm:` grid breakpoints) |
| Axios HTTP client | Task 4 |
| CORS-friendly targeting of Laravel backend on `:8000` | Task 1 (`.env`), Task 4 (`baseURL` from env) |
| Crew Name (text, required) | Task 3 (validation) + Task 7 (input) |
| Crew ID (text, required) | Task 3 + Task 7 |
| Flight Number (text, required, placeholder `GA102`) | Task 3 + Task 7 (placeholder) |
| Flight Date (date, required, `YYYY-MM-DD` to API) | Task 3 + Task 7 (native date input already emits `YYYY-MM-DD`) |
| Aircraft Type dropdown with exactly `ATR`, `Airbus 320`, `Boeing 737 Max` | Task 2 (constant) + Task 7 (select) |
| Step 1 — duplicate check `POST /api/check` with `{ flight_number, flight_date }` | Task 4 (`checkVoucher`) + Task 8 (App calls it first) |
| Stop + red banner with exact copy when `exists: true` or validation error | Task 8 (duplicate branch sets `DUPLICATE_MESSAGE`) + Task 5 (`ErrorBanner`) |
| Step 2 — `POST /api/generate` only if Step 1 passes | Task 8 (sequential `await`s, early return on duplicate) |
| Full payload sent on `/generate` | Task 4 (`generateVoucher(payload)`) + Task 8 (`onSubmit(values)`) |
| Success display with 3 seats | Task 6 (`SeatResults`) + Task 8 (renders on `status === 'success'`) |
| Seat labels `Seat 1`, `Seat 2`, `Seat 3` (1-indexed) | Task 6 |
| Loading state | Task 7 (`loading` prop disables inputs + changes button label) + Task 8 (`status === 'loading'`) |
| Success state | Task 8 |
| Error state | Tasks 5 + 8 |

No spec requirement is left without a task.

**2. Placeholder scan**

- No "TBD", "implement later", or "TODO" markers.
- Every code step contains the actual code, including the `vi.mock` path edge-case note in Task 8.
- The intentional typo in Task 6 Step 1's third test (the `/>` instead of `)`) is called out inline and the corrected version is provided immediately below — that is a deliberate instruction, not a placeholder.
- All commands have expected outputs.

**3. Type / signature consistency**

- `AIRCRAFT_TYPES`: defined in Task 2, consumed in Task 3 (`validation.js`) and Task 7 (`VoucherForm.jsx`) — both as a named import. ✓
- `validateForm(values) → errors object`: defined in Task 3, consumed in Task 7 (`handleSubmit`) — same signature. ✓
- `checkVoucher({ flight_number, flight_date }) → { exists, message }`: defined and tested in Task 4; consumed in Task 8 with the same destructure. ✓
- `generateVoucher(payload) → voucher` where `voucher.seats` is `string[3]`: defined in Task 4 (returns `response.data.data`); consumed in Task 8 (`voucher.seats`, `voucher.crew_name`). The `seats` array shape matches Task 6's expected `seats: Array<string>` prop. ✓
- `VoucherForm` props: `onSubmit`, `loading` — defined in Task 7, consumed identically in Task 8. ✓
- `ErrorBanner` props: `message`, optional `onDismiss` — defined in Task 5, consumed as `message` only in Task 8 (matches — `onDismiss` is optional). ✓
- `SeatResults` props: `seats`, optional `crewName` — defined in Task 6, consumed identically in Task 8. ✓
- DUPLICATE_MESSAGE exact copy appears in 3 places: Task 8's `App.jsx` constant, Task 5's test fixture, Task 8's tests. All identical: `"Vouchers have already been generated for this flight and date."`. ✓

No inconsistencies.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-06-22-voucher-seat-frontend.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
