# Aircraft Seat Map Design

**Date:** 2026-06-22
**Status:** Approved (pending spec review)
**Goal:** Add a visual seat map to `SeatResults` that shows every seat of the selected aircraft type with the 3 voucher-winning seats highlighted.

## Context

The Laravel backend's `SeatGeneratorService` draws 3 random valid seats per voucher. The matrix per spec:

- **ATR:** rows 1–18, letters A, C, D, F per row (B and E do NOT exist).
- **Airbus 320:** rows 1–32, letters A, B, C, D, E, F.
- **Boeing 737 Max:** rows 1–32, letters A, B, C, D, E, F.

The current frontend `SeatResults` shows the 3 won seats as text in a daisyUI `stats` block. The user wants a visual seat map added below the stats so the user can see where the won seats sit inside the full aircraft layout.

## Decisions (locked during brainstorming)

1. **Integration:** Add seat map BELOW the existing stats inside `SeatResults`. Stats stay; map augments.
2. **Density:** Render every row (ATR: 18, Airbus/Boeing: 32). Scrollable, not compacted.

## Architecture

### New pure helper — `src/lib/seatLayout.js`

Single source of truth for the three aircraft layouts. Frozen object so consumers can't mutate.

```js
export const SEAT_LAYOUTS = Object.freeze({
  'ATR': Object.freeze({ rows: 18, left: ['A', 'C'], right: ['D', 'F'] }),
  'Airbus 320': Object.freeze({ rows: 32, left: ['A', 'B', 'C'], right: ['D', 'E', 'F'] }),
  'Boeing 737 Max': Object.freeze({ rows: 32, left: ['A', 'B', 'C'], right: ['D', 'E', 'F'] }),
});
```

- `left` = window-left seats (left side of aisle), in display order from window → aisle.
- `right` = window-right seats (right side of aisle), in display order from aisle → window.
- ATR explicitly omits B and E — those letters do not exist on that aircraft.

### New presentational component — `src/components/SeatMap.jsx`

Props (all required):
- `aircraftType: string` — must be a key of `SEAT_LAYOUTS`
- `wonSeats: string[]` — array of 1–3 seat strings like `['1A', '14C', '18F']`

Behaviour:
- Reads `SEAT_LAYOUTS[aircraftType]`. If undefined → render nothing (silent no-op; caller is expected to only invoke when the aircraft type is valid).
- Renders a vertically-stacked list of rows. Each row is a flex container: `[row-number] [left seats] [aisle gap] [right seats] [row-number]`.
- Each seat is a square element with the seat letter as its text. Mark won seats with `bg-success text-success-content border-success` plus a small filled-circle indicator and `aria-label="<seat> (voucher)"`. Non-won seats get `aria-label="<seat>"`.
- Container has `aria-label="Seat map for {aircraftType}"` so screen readers announce context.
- Aisle: `w-4` margin gap, no element rendered.

### Extended existing component — `src/components/SeatResults.jsx`

- New optional prop: `aircraftType?: string`.
- When `aircraftType` is provided AND is a known layout key AND `seats.length > 0`, render `<SeatMap aircraftType={aircraftType} wonSeats={seats} />` below the existing stats block, plus a one-line legend ("● = voucher won") under the map.
- When `aircraftType` is missing or unknown, skip the map (existing behaviour — backward compatible).

### Wiring — `src/App.jsx`

Change the existing render call from:
```jsx
<SeatResults seats={voucher.seats} crewName={voucher.crew_name} />
```
to:
```jsx
<SeatResults
  seats={voucher.seats}
  crewName={voucher.crew_name}
  aircraftType={voucher.aircraft_type}
/>
```

`aircraft_type` is already in the API response payload (see backend plan Task 5 `VoucherResource`).

## Data flow

```
API → App (voucher.aircraft_type, voucher.seats) → SeatResults → SeatMap
                                                                      ↓
                                                              reads SEAT_LAYOUTS[aircraftType]
                                                                      ↓
                                                              renders N rows × M seats,
                                                              highlights won seats
```

No state. No effects. Pure render with props + frozen constant.

## Visual treatment

| Element | Class | Notes |
|---|---|---|
| Map container | `div` with `aria-label` | Stack of rows, `gap-1` |
| Row | `flex items-center gap-2` | row-num, left seats, aisle gap, right seats, row-num |
| Row number | `w-6 text-right text-neutral/50 font-mono text-xs` | Muted, monospace |
| Seat (default) | `btn btn-sm btn-ghost border border-base-300 font-mono` | Static, not clickable |
| Seat (won) | `btn btn-sm border-success bg-success text-success-content font-mono` | + dot indicator inside |
| Aisle | implicit `gap` between left/right groups | No rendered element |
| Legend | `text-xs text-base-content/60 mt-3` | "● = voucher won" |

Responsive: on small screens the map fills the card width; the seat squares shrink to `btn-xs` so 6-across still fits.

## Tests

### `src/lib/__tests__/seatLayout.test.js`

- `SEAT_LAYOUTS.ATR` has `rows: 18`, `left: ['A','C']`, `right: ['D','F']`.
- `SEAT_LAYOUTS['Airbus 320']` and `['Boeing 737 Max']` both have `rows: 32`, `left: ['A','B','C']`, `right: ['D','E','F']`.
- ATR layout contains neither 'B' nor 'E' anywhere.
- `SEAT_LAYOUTS` and each nested layout object are frozen.

### `src/components/__tests__/SeatMap.test.jsx`

- Renders the correct total seat count for each aircraft type:
  - ATR: 18 × 4 = 72 seats
  - Airbus 320: 32 × 6 = 192 seats
  - Boeing 737 Max: 32 × 6 = 192 seats
- For ATR, querying for any seat starting with 'B' or 'E' returns nothing (those letters are absent).
- Marks each entry in `wonSeats` with `aria-label` containing "voucher".
- Non-won seats do NOT have "voucher" in their aria-label.
- Container has `aria-label="Seat map for ATR"` (and similarly for other types).
- When `aircraftType` is unknown (e.g. `"Concorde"`), renders nothing (no crash).

### Updated `src/components/__tests__/SeatResults.test.jsx`

Existing 5 tests continue to pass. Add 2 new tests:
- When `aircraftType="ATR"` and `seats=['1A','14C','18F']`, the map renders and each won seat's aria-label appears.
- When `aircraftType` is omitted, the map is not rendered (backward compat).

### Updated `src/components/__tests__/App.test.jsx`

Existing 6 tests need their mock voucher payload to include `aircraft_type: 'ATR'` (it already does — verify). The success-path test should additionally assert that the seat map renders.

## Out of scope (YAGNI)

- Clicking a seat to do something (selection, info popover, etc.) — purely visual.
- Showing multiple aircraft types side-by-side — only the submitted type.
- Tooltip / hover detail beyond the visible letter and dot.
- Animations or transitions.
- Showing whether a seat is occupied by another voucher (we only know our 3).
- Real-time seat updates — the map renders once per voucher response.
