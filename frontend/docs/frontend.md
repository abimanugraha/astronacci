# Agent Prompt: React Frontend Development Task

## 1. Context & Goal
You are an expert Frontend Developer. Your task is to build a single-page React application for an Airline Voucher Seat Assignment system. This application will talk to a Laravel Backend API to check and generate 3 random promotional seats for flight crews.

## 2. Tech Stack & Setup
- React (Vite preferred, or Create React Repos)
- Styling: Tailwind CSS (Clean, responsive, modern UI)
- HTTP Client: Axios or Fetch API
- Configuration: Ensure CORS compatibility by targeting the Laravel backend port (typically http://localhost:8000).

## 3. UI Requirements (Form Design)
Create a centralized, clean dashboard containing a form with the following fields and validations:
- **Crew Name** (Text Input): Required.
- **Crew ID** (Text Input): Required.
- **Flight Number** (Text Input): Required (Example placeholder: "GA102").
- **Flight Date** (Date Input): Required. Format submitted to API must be compliant with `YYYY-MM-DD` (displayed to user as needed).
- **Aircraft Type** (Dropdown Select): Required. Options: `ATR`, `Airbus 320`, `Boeing 737 Max`.

## 4. API Integration Flow ("Generate Vouchers" Action)
When the user clicks the **"Generate Vouchers"** button, execute this strict asynchronous flow:

1. **Step 1: Duplicate Check**
   - Send a `POST` request to `http://localhost:8000/api/check`.
   - Payload: `{ "flight_number": "...", "flight_date": "..." }`.
   - If the API returns `{ "exists": true }` (or standard validation error), STOP the process and display a prominent red error banner: *"Vouchers have already been generated for this flight and date."*

2. **Step 2: Assignment Generation**
   - If Step 1 passes (`exists: false`), immediately send a `POST` request to `http://localhost:8000/api/generate`.
   - Payload: Complete form fields (`crew_name`, `crew_id`, `flight_number`, `flight_date`, `aircraft_type`).
   - On Success (201 Created): Display a visual success component (e.g., Cards or Modal) showing the **3 randomly generated seats** beautifully (e.g., "Seat 1: 1A", "Seat 2: 14C", "Seat 3: 18F").

## 5. Deliverables Expected
- `App.jsx` / `App.tsx` main logic.
- Form components with states handling loading, success, and error displays.
- Visual state rendering the 3 assigned seats when returned from the API.
