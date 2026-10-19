# Smart Parking IoT — Website Project Specification

## 1. Project Overview

Build a complete, modern, responsive Smart Parking Management website for an IoT-based parking system.

The website must provide a central dashboard to monitor real-time parking occupancy, sensor readings, camera-based vehicle recognition, number-plate OCR results, vehicle entry and exit events, parking reservations, parking sessions, billing, mock payments, gate activity, and historical analytics.

This is a real full-stack integration project. The website must connect to Firebase Authentication, Cloud Firestore, and an existing FastAPI backend. Do not build only a static UI or a frontend with fake data.

The website must work on desktop computers, laptops, tablets, and mobile phones.

### Main goals

1. Display live parking slot availability and occupancy.
2. Visualize data received from ESP32 and HC-SR04 sensors.
3. Display number plates recognized by the ESP32-CAM and Plate Recognizer OCR API.
4. Monitor vehicle entry and exit events.
5. Display reservations, active parking sessions, bills, and payments.
6. Show analytics and historical trends using charts and tables.
7. Allow authenticated users to make and manage reservations.
8. Show mock-payment status and billing details.
9. Display device health, sensor connectivity, camera activity, and gate events.
10. Use Firebase as the central data store and FastAPI as the business-logic backend.

The website must present live data accurately and clearly distinguish actual sensor readings, backend-calculated values, reservations, and payment states.

---

## 2. Required Technology Stack

Use the following technologies:

- React with Vite.
- TypeScript.
- Tailwind CSS for styling.
- A consistent, reusable component system such as shadcn/ui.
- React Router for navigation.
- Firebase Authentication for user login.
- Firebase Cloud Firestore for persistent data and permitted real-time subscriptions.
- Firebase JavaScript SDK.
- FastAPI REST API for business operations.
- Recharts for charts and analytics.
- Lucide React for icons.
- React Hook Form and Zod for form validation where appropriate.
- TanStack Query or an equivalent solution for API request caching, loading states, and invalidation.

Use a maintainable component-based architecture. Avoid putting all page logic into one large component.

Use strict TypeScript where practical. Avoid unnecessary dependencies and duplicated state.

---

## 3. System Architecture

The system has four major components.

### A. React website

Responsible for:

- Authentication UI.
- Dashboard and analytics.
- Slot visualization.
- Reservations.
- Parking sessions and bills.
- Payment interface.
- Recognition event history.
- Device monitoring.
- Admin controls where authorized.

### B. Firebase Authentication

Responsible for:

- Login.
- Registration if enabled.
- Logout.
- Maintaining the authenticated user session.
- Providing Firebase ID tokens for FastAPI requests.

### C. Firebase Cloud Firestore

Responsible for storing:

- Parking slot state.
- Sensor telemetry summaries.
- Recognition events.
- Reservations.
- Parking sessions.
- Payment records.
- Device events.
- User profiles and roles, subject to security rules.

Use Firestore real-time listeners only for data the current user is authorized to read. For sensitive operational records, use the FastAPI endpoints.

### D. FastAPI backend

Responsible for:

- Number-plate recognition workflows.
- Calling Plate Recognizer.
- Entry and exit processing.
- Slot allocation.
- Reservation validation.
- Session creation.
- Billing calculations.
- Payment processing.
- Gate authorization.
- Secure device communication.

The frontend must never independently decide that a vehicle is authorized, mark a payment as successful, allocate a slot, or open a gate.

### Data flow

ESP32 sensors and ESP32-CAM → FastAPI/device communication → Firestore → website dashboard.

For actions initiated by users:

Website → FastAPI → Firestore and, when appropriate, MQTT → ESP32 controller.

The browser may subscribe directly to authorized Firestore data for real-time dashboard updates. All sensitive writes and business decisions must go through FastAPI.

---

## 4. Website Design and Visual Direction

Create a polished, professional IoT management dashboard with a modern smart-city and parking-management aesthetic.

### Design requirements

- Clean, modern, premium-looking interface.
- Responsive sidebar navigation on desktop.
- Collapsible sidebar or mobile navigation on smaller screens.
- Consistent spacing and typography.
- Rounded cards with restrained borders and shadows.
- Clear visual hierarchy.
- Accessible text contrast.
- Consistent status indicators.
- Attractive but restrained chart colors.
- Skeleton loaders for asynchronous content.
- Helpful empty states.
- Clear success, warning, and error notifications.
- Confirmation dialogs for destructive actions.
- Keyboard-accessible controls and forms.

Use a light theme by default, with a dark theme optional if implemented consistently.

Avoid excessive gradients, decorative animations, giant headings, and unnecessary cards. Prioritize operational information and readability.

### Suggested status colors

- Green: available, successful, paid, online.
- Red: occupied, denied, failed, offline where appropriate.
- Blue: active sessions, informational events, guidance.
- Amber: reserved, pending, warning, stale sensor readings.
- Gray: unknown, inactive, unavailable, unverified.

Do not communicate status using color alone; include text labels and accessible icons.

---

## 5. Application Routes and Pages

Implement the following pages.

### 5.1 Login page

Route: `/login`

Features:

- Email and password login using Firebase Authentication.
- Clear validation messages.
- Loading state while authenticating.
- Friendly error messages for invalid credentials.
- Logout functionality elsewhere in the app.
- Redirect authenticated users to the appropriate dashboard.
- Protect private routes.

Do not implement a second independent password authentication system in FastAPI.

### 5.2 Main dashboard

Route: `/dashboard`

This is the main operational overview of the parking system.

#### Summary cards

Display:

1. Total parking slots.
2. Currently occupied slots.
3. Currently available slots.
4. Reserved slots.
5. Active parking sessions.
6. Vehicles entered today.
7. Vehicles exited today.
8. Revenue or mock-payment total for the selected period.
9. Online devices.
10. Offline or unhealthy devices.

Each card should show a meaningful label, value, status icon, and optional comparison with the previous period if sufficient historical data exists.

Do not invent comparison percentages if historical data is unavailable.

#### Occupancy overview

Show:

- Current occupancy percentage.
- Occupied versus available spaces.
- Reserved and unavailable counts.
- Occupancy trend over time.
- Last successful sensor update.
- Data freshness indicator.

Use a formula based on clearly defined slot states. Do not count the same slot in multiple categories.

#### Live slot grid

Show the four initial slots:

- S1
- S2
- S3
- S4

Make the number of slots configurable rather than hardcoding four throughout the application.

Each slot card should display:

- Slot identifier.
- Physical occupancy.
- Allocation status.
- Reservation status.
- Latest ultrasonic distance in centimetres.
- Last sensor update time.
- Sensor freshness.
- Associated session ID if applicable.
- Assigned vehicle plate if authorized and necessary.
- Relevant warning state.

Example slot display:

S1
Status: Occupied
Distance: 24.5 cm
Sensor: Online
Last update: 4 seconds ago

S2
Status: Available
Distance: 150 cm
Sensor: Online
Last update: 3 seconds ago

These values are illustrative. Display actual values from Firestore or the backend in the running application.

Use different visual indicators for:

- Available.
- Reserved.
- Allocated but not yet occupied.
- Occupied.
- Sensor unknown or stale.
- Out of service.

A slot that has stale or missing sensor data must not be shown as confidently available.

#### Recent activity

Show a real-time or periodically refreshed activity feed for events such as:

- Vehicle detected at entry.
- Number plate recognized.
- Entry approved or denied.
- Slot assigned.
- Vehicle parked.
- Vehicle detected at exit.
- Bill generated.
- Payment completed.
- Gate command acknowledged.
- Device disconnected.
- Sensor data became stale.

Each event should display a timestamp, event type, relevant slot or plate when permitted, and status.

Include filters and a link to the full event history.

### 5.3 Parking slots page

Route: `/slots`

Provide a detailed view of every configured parking slot.

Features:

- Grid and table display modes.
- Filter by occupancy state.
- Filter by reservation state.
- Filter by sensor health.
- Search by slot identifier.
- Sort by latest update.
- Display distance measurements and freshness.
- Display the active session or reservation associated with a slot.
- Display sensor and allocation history if available.

Use the FastAPI endpoint:

`GET /api/v1/slots`

For eligible slots, use:

`GET /api/v1/slots/availability`

Do not create an allocation operation in the frontend. The backend owns allocation decisions.

If administrators can change maintenance status, implement that action only if the backend supports a corresponding authorized endpoint. Do not write operational changes directly to Firestore from the browser.

### 5.4 Reservations page

Route: `/reservations`

Features:

- List reservations belonging to the logged-in user.
- Admin view of all reservations, only if the backend explicitly permits it.
- Create a reservation.
- Select a slot.
- Select a start and end date/time.
- View reservation details.
- Cancel an eligible reservation.
- Check in using the supported backend workflow.
- Display reservation status and applicable rules.

Reservation statuses should include the states supported by the backend, such as:

- Pending.
- Confirmed.
- Checked in.
- Cancelled.
- Expired.
- Completed.

Use these endpoints:

- `POST /api/v1/reservations`
- `GET /api/v1/reservations/me`
- `POST /api/v1/reservations/{reservation_id}/cancel`
- `POST /api/v1/reservations/{reservation_id}/checkin`

Validate forms in the browser for user experience, but treat backend validation as authoritative.

Display clear errors when a slot becomes unavailable or a booking conflicts with another reservation.

### 5.5 Vehicle recognition page

Route: `/recognition`

This page is especially important because the project uses an ESP32-CAM and a cloud OCR API.

Display recognized vehicle events in a table with:

- Event ID.
- Timestamp.
- Entry or exit location.
- Recognized plate number.
- OCR confidence.
- Recognition status.
- Associated session ID.
- Entry decision or exit result.
- Error details when recognition fails.

Include filters for:

- Entry.
- Exit.
- Successful recognition.
- Failed recognition.
- Low confidence.
- Date range.
- Plate search.

Use clear labels such as:

- Plate recognized.
- No plate detected.
- Low confidence.
- Multiple candidates.
- Entry approved.
- Entry denied.
- Exit session found.
- Active session not found.

Show OCR confidence as a percentage only when the provider's score scale is known and correctly normalized. Preserve the raw score when needed.

Do not display a failed OCR result as a successful vehicle identification.

#### Recognition event details

When a user opens an event, display:

- Recognition event ID.
- Event timestamp.
- Entry or exit location.
- Recognized plate text.
- Confidence score.
- OCR result status.
- Session association.
- Backend decision.
- Safe error details.

Do not require permanent storage of camera images. The default design should retain recognition metadata and avoid retaining uploaded images unless an explicit, authorized retention policy is added.

The UI must not call Plate Recognizer directly. All OCR requests go through FastAPI.

### 5.6 Parking sessions page

Route: `/sessions`

Display parking sessions with:

- Session ID.
- Vehicle plate.
- Assigned slot.
- Entry timestamp.
- Exit timestamp, if completed.
- Current session status.
- Duration.
- Amount due.
- Payment status.
- Reservation association where applicable.

Provide:

- Search by plate or session ID.
- Filter by active, exit pending, payment pending, paid, or completed states supported by the backend.
- Date range filters.
- Session details.
- Bill details.
- Pagination.

Use the existing backend endpoints when available. Do not assume additional endpoints exist without verifying the backend implementation.

For active sessions, display elapsed time only as a UI calculation from a trusted entry timestamp. The backend remains responsible for authoritative billing.

### 5.7 Payments and billing page

Route: `/payments`

Features:

- List payment records the user is authorized to access.
- Display session ID, amount, currency, payment method, payment status, and timestamps.
- Display pending bills.
- Display successful and failed mock payments.
- Open a session bill.
- Submit a mock payment for an eligible session.
- Display payment result and confirmation state.

Use:

- `POST /api/v1/payment/exit` to submit the exit image and obtain the bill.
- `POST /api/v1/payment` to request the backend's mock-payment flow.

The website must never mark a payment as paid by directly updating Firestore or by assuming that an HTTP request succeeded.

After payment, refresh the relevant session and payment data using the backend's response or an authorized real-time data subscription.

Display a clear distinction between:

- Bill generated.
- Payment pending.
- Payment successful.
- Payment failed.
- Gate command pending.
- Gate command acknowledged.

A successful payment does not necessarily mean the physical gate opened. Display gate status separately.

### 5.8 Analytics page

Route: `/analytics`

Build a useful historical analysis dashboard using Recharts.

Include the following visualizations when sufficient data exists.

#### Occupancy trend

Line or area chart showing occupied slots over time.

#### Occupancy distribution

Donut chart showing available, occupied, reserved, and unavailable counts without double-counting slots.

#### Vehicle traffic

Bar chart showing entry and exit counts by hour, day, or selected date range.

#### Revenue analysis

Line or bar chart showing recorded successful mock payments over time.

Clearly label the metric as mock-payment revenue in demonstration mode.

Do not treat pending payments or failed payments as revenue.

#### Slot utilization

Bar chart comparing slot usage over the selected period.

#### Recognition analytics

Display:

- Total recognition attempts.
- Successful recognitions.
- Failed recognitions.
- Low-confidence events.
- Recognition success rate.
- Entry versus exit recognition volume.

Calculate the success rate from actual event counts. Handle the zero-event case without dividing by zero.

#### Device and sensor analytics

Display:

- Device availability over time where recorded.
- Sensor freshness.
- Distance trends for each slot where sufficient history exists.
- Missing or stale sensor data.
- Device disconnection events.

Do not generate historical charts from only the latest sensor reading. If historical telemetry is not stored, show an appropriate empty state and explain that historical data collection is required.

#### Date range selection

Support useful ranges such as:

- Today.
- Last 7 days.
- Last 30 days.
- Custom range.

Ensure all chart labels, aggregation rules, timezone handling, and time boundaries are consistent.

Use backend aggregation endpoints if they exist. Do not download unlimited Firestore records into the browser to calculate every historical metric.

### 5.9 Devices and IoT monitoring page

Route: `/devices`

Display the known devices in the parking system, including:

- Main ESP32 controller.
- ESP32-CAM entry camera.
- Exit camera if configured.
- Gate controller.
- Individual slot sensors where device data permits.

For each device, display:

- Device ID.
- Device type.
- Last heartbeat.
- Online, offline, or unknown status.
- Last reported event.
- Sensor status where applicable.
- Firmware version if reported.
- Last command and acknowledgement status if available.

Use a configurable stale-device threshold. Do not claim a device is online if its heartbeat is old.

Display gate state separately from gate command state.

For example:

Command: Open exit gate
Command status: Published
Device acknowledgement: Received
Physical state: Open, if the device reports this state

Never claim the physical gate opened merely because FastAPI published an MQTT command.

Do not expose device credentials or MQTT secrets in the browser.

### 5.10 Settings and profile page

Route: `/settings`

Include:

- User profile.
- Display preferences.
- Timezone preference if needed.
- Currency display preference where appropriate.
- Theme selection if supported.
- Account logout.

Only show administrative settings if the authenticated user has an authorized administrator role.

Do not allow users to change their own administrator role through the frontend.

---

## 6. Firebase Connection and Configuration

Create a dedicated Firebase module.

Suggested file:

`src/lib/firebase.ts`

Initialize Firebase once using environment variables.

Required Vite environment variables:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_API_BASE_URL`

Include an `.env.example` with placeholders.

Do not commit real credentials to source control.

Firebase web configuration is not equivalent to an Admin SDK service-account credential. Never put Firebase Admin private keys or Plate Recognizer API tokens in Vite environment variables.

### Firebase Authentication

Implement:

- Login.
- Authentication state persistence.
- Logout.
- Protected routes.
- Loading state while authentication is initialized.
- User profile retrieval.
- Proper handling of expired or invalid sessions.

Send Firebase ID tokens to FastAPI in the following header:

`Authorization: Bearer <Firebase-ID-Token>`

The frontend must not assume that a logged-in user automatically has admin permissions.

### Firestore connection

Use a single initialized Firestore instance.

Implement reusable hooks or data services for permitted live data, such as:

- Parking slot summaries.
- Current slot state.
- Authorized device-status information if rules permit it.

Use Firestore listeners selectively. Unsubscribe when components unmount.

For sensitive records, prefer FastAPI endpoints unless Firestore rules explicitly permit the user's read access.

The browser must not directly write authoritative session, payment, allocation, recognition or gate state.

### Firestore security rules

Document the required rules and ensure they follow least privilege.

Rules must prevent ordinary clients from:

- Marking a payment successful.
- Changing a bill amount.
- Creating arbitrary parking sessions.
- Assigning a slot to a vehicle.
- Overwriting sensor readings.
- Authorizing a gate.
- Escalating their role to admin.
- Reading other users' private reservation or payment data.

Use FastAPI with the Firebase Admin SDK for trusted writes. Remember that the Admin SDK bypasses Firestore Security Rules, so the backend must perform its own authentication and authorization checks.

---

## 7. FastAPI Integration

Use the existing backend rather than inventing unrelated API routes.

Configure a central API client, for example:

`src/lib/api-client.ts`

It must:

- Read the API base URL from environment configuration.
- Attach the Firebase ID token when required.
- Handle JSON and multipart requests.
- Parse structured API errors.
- Handle network failures.
- Handle unauthorized and forbidden responses.
- Handle loading and retry states appropriately.
- Avoid logging sensitive request data.
- Avoid retrying non-idempotent operations blindly.

### Required endpoint integration

#### Payment

- `POST /api/v1/payment/entry`
- `POST /api/v1/payment/exit`
- `POST /api/v1/payment`

#### Reservations

- `POST /api/v1/reservations`
- `GET /api/v1/reservations/me`
- `POST /api/v1/reservations/{reservation_id}/cancel`
- `POST /api/v1/reservations/{reservation_id}/checkin`

#### Recognition

- `POST /api/v1/recognition/entry`
- `POST /api/v1/recognition/exit`

#### Dashboard

- `GET /api/v1/slots`
- `GET /api/v1/slots/availability`
- `GET /api/v1/dashboard/summary`

Use the exact API response schemas implemented by FastAPI. If a response field differs, adapt the frontend to the actual schema rather than fabricating backend values.

### Image upload behavior

The camera normally uploads images directly to FastAPI. The website should not need access to the camera's private network IP address.

For manual testing or an authorized operator workflow, the recognition page may offer an image-upload form that submits a selected image to the appropriate recognition endpoint.

Use `FormData` for multipart uploads. Do not manually set the multipart `Content-Type` header when the browser needs to supply the boundary.

Show the result returned by FastAPI, including recognized plate, confidence, event ID and decision.

Do not call the OCR provider directly from React.

### Payment workflow

The payment interface must:

1. Display the bill returned by FastAPI.
2. Allow the user to initiate the supported mock payment.
3. Submit the session ID to `POST /api/v1/payment`.
4. Display the backend's actual payment response.
5. Refresh payment/session information.
6. Show gate-command status separately if the backend exposes it.

Do not send a client-calculated amount as authoritative payment data.

### Error handling

Handle structured API errors such as:

- No plate detected.
- Low OCR confidence.
- No active parking session.
- No available slot.
- Reservation conflict.
- Reservation expired.
- Payment already completed.
- Unauthorized request.
- Device offline.
- OCR provider unavailable.
- Network timeout.

Present user-friendly messages without exposing internal stack traces or secrets.

---

## 8. Firestore Data and UI Mapping

Design reusable types and adapters for the actual Firestore documents and FastAPI response models.

The UI should be able to display the following logical entities.

### Parking slots

Fields may include:

- `slotCode`
- `sensorOccupied`
- `distanceCm`
- `sensorUpdatedAt`
- `status`
- `reservationId`
- `activeSessionId`
- `updatedAt`

Distinguish physical occupancy from allocation and reservation state.

### Recognition events

Fields may include:

- `eventId`
- `plateNumber`
- `confidence`
- `location`
- `resultStatus`
- `createdAt`
- `sessionId`

Display only fields available in the real response or authorized document.

### Parking sessions

Fields may include:

- `sessionId`
- `plateNumber`
- `slotId`
- `entryAt`
- `exitAt`
- `status`
- `amountDue`
- `paymentStatus`

### Reservations

Fields may include:

- `reservationId`
- `userId`
- `slotId`
- `startAt`
- `endAt`
- `status`

### Payments

Fields may include:

- `paymentId`
- `sessionId`
- `amount`
- `currency`
- `method`
- `status`
- `createdAt`
- `paidAt`

### Device events

Fields may include:

- `deviceId`
- `eventType`
- `value`
- `createdAt`
- `status`

Handle missing optional fields and legacy documents gracefully. Never silently replace missing live data with invented operational values.

---

## 9. Real-Time Updates and Performance

The dashboard should update when new sensor readings, recognition events, reservations, sessions or payments are recorded.

Use Firestore listeners for explicitly authorized live collections and refresh FastAPI queries after mutations.

Avoid polling every second for all records.

Requirements:

- Unsubscribe from Firestore listeners when no longer needed.
- Avoid duplicate listeners.
- Use pagination for large event tables.
- Use server-side filtering and aggregation where available.
- Avoid downloading entire collections for analytics.
- Debounce search input.
- Cache appropriate read queries.
- Invalidate affected queries after successful mutations.
- Handle offline and reconnecting states.
- Display when the latest sensor data was received.
- Avoid showing stale cached data as current without a freshness indicator.

For example, when the ESP32 updates S2 occupancy in Firestore, the slot card, occupancy summary and relevant dashboard charts should refresh without requiring a page reload.

If the application uses a FastAPI endpoint instead of a Firestore listener for a given dataset, ensure its refresh behavior is documented and consistent.

---

## 10. Charts, Aggregation and Data Accuracy

Implement reusable chart components with typed input data.

Use real timestamps and meaningful labels.

Charts should include:

- Tooltips.
- Legends when useful.
- Responsive sizing.
- Empty states.
- Loading states.
- Accessible labels.
- Correct number and currency formatting.

Do not use sample arrays in production dashboard calculations.

If there is not enough historical data, show a clear message such as:

"Historical sensor data will appear after the system has collected readings over time."

If demo data is required for development, place it behind an explicit demo mode and clearly label it. Never mix demo records with live operational records without clear separation.

Calculate metrics carefully:

- Occupancy percentage = physically occupied slots divided by eligible configured slots, according to the documented policy.
- Recognition success rate = successful recognition events divided by all eligible recognition attempts.
- Payment revenue = successful payment records in the selected period.
- Entry/exit traffic = recorded entry/exit events within the chosen time range.
- Device uptime = calculated only when sufficient heartbeat history exists.

Handle missing data, zero denominators, invalid timestamps and timezone boundaries.

---

## 11. Security and Privacy

Implement the frontend with these security principles:

- Protect private routes.
- Send ID tokens only over HTTPS in production.
- Do not expose API secrets.
- Do not include Firebase Admin credentials in the browser bundle.
- Do not expose the Plate Recognizer API token.
- Do not store passwords in Firestore.
- Do not trust frontend roles without backend authorization.
- Do not let users access another user's private records.
- Do not log full authentication tokens.
- Do not store uploaded images unnecessarily.
- Do not display sensitive plate or payment details to unauthorized users.
- Avoid rendering untrusted OCR text as HTML.
- Handle sign-out and expired authentication cleanly.

Document the necessary backend CORS configuration and ensure production CORS uses the intended frontend origins.

---

## 12. User Experience and Accessibility

Every page must handle these states:

- Initial loading.
- Background refresh.
- Empty data.
- Successful operation.
- Validation error.
- Network failure.
- Unauthorized access.
- Stale data.
- Offline device.
- Partial data availability.

Use toast notifications for short-lived confirmations and inline messages for form errors.

Use confirmation dialogs before cancellation or other destructive actions.

Make all interactive elements keyboard accessible. Include focus indicators and appropriate labels.

Tables should be responsive and provide a usable mobile alternative.

Use relative time labels for recent events while retaining exact timestamps in details or tooltips.

Format timestamps consistently using a documented timezone policy.

---

## 13. Recommended Frontend Folder Structure

Create a maintainable structure similar to:

src/
- app/
  - App.tsx
  - router.tsx
  - providers.tsx
- components/
  - layout/
  - navigation/
  - cards/
  - charts/
  - tables/
  - forms/
  - status/
  - feedback/
- features/
  - auth/
  - dashboard/
  - slots/
  - reservations/
  - recognition/
  - sessions/
  - payments/
  - analytics/
  - devices/
  - settings/
- hooks/
- lib/
  - firebase.ts
  - api-client.ts
  - auth.ts
  - formatters.ts
  - validators.ts
- services/
  - slots.service.ts
  - reservations.service.ts
  - recognition.service.ts
  - payments.service.ts
  - dashboard.service.ts
- types/
  - api.ts
  - firestore.ts
  - domain.ts
- styles/
- main.tsx

Adapt this structure if necessary, but maintain clear boundaries between UI components, data access, API integration and domain types.

---

## 14. Configuration Files and Documentation

Create:

- `project.md` — this complete project specification.
- `.env.example` — frontend configuration placeholders.
- `.gitignore` — exclude environment files, secrets, build output and local dependencies.
- `README.md` — installation, configuration, development and deployment instructions.

Do not overwrite existing project files blindly. Inspect the repository before making changes.

The README must explain:

1. Prerequisites.
2. Dependency installation.
3. Firebase project configuration.
4. Firebase Authentication setup.
5. Firestore setup and security rules.
6. FastAPI backend URL configuration.
7. Environment variables.
8. Development commands.
9. Production build.
10. Common integration errors.
11. How to test the frontend against the real backend.
12. How to enable or disable demo data.

---

## 15. Testing Requirements

Implement tests for important frontend behavior.

At minimum, verify:

- Login and protected-route behavior.
- Firebase authentication state.
- Loading, empty and error states.
- Slot display and freshness indicators.
- Reservation creation and cancellation.
- OCR success and failure displays.
- Bill display and mock-payment interaction.
- Correct handling of API errors.
- No direct client-side updates to authoritative payment or session state.
- Charts handle empty or missing historical data.
- Responsive navigation and core mobile layouts.
- No accidental exposure of secrets in frontend configuration or built assets.

Mock Firebase and FastAPI in automated tests. Do not require production credentials for ordinary tests.

Run the linter, type checker and tests where available. Fix errors before reporting completion.

---

## 16. Implementation Workflow

Follow this order.

### Phase 1: Inspect and plan

Inspect the existing repository, available FastAPI endpoints and actual response schemas. Identify any differences between the intended API contract and the implemented backend.

### Phase 2: Foundation

Configure React, TypeScript, routing, styling, Firebase initialization, authentication and the shared API client.

### Phase 3: Core dashboard

Build the responsive layout, summary cards, live slot grid, occupancy visualization and recent activity feed.

### Phase 4: Operational pages

Implement slots, recognition events, sessions, reservations, payments and device monitoring.

### Phase 5: Analytics

Build historical charts using actual available data and clearly explain when historical data is missing.

### Phase 6: Security and reliability

Verify authentication, authorization assumptions, Firestore rules, loading/error states, data freshness and API error handling.

### Phase 7: Testing and polish

Test on desktop and mobile sizes. Run linting, type checks and tests. Fix broken imports, missing routes, inconsistent types and failed integrations.

### Phase 8: Documentation

Complete the README with exact setup and run commands.

---

## 17. Final Acceptance Criteria

The project is complete only when:

1. The website runs locally using documented commands.
2. Firebase Authentication works with the configured Firebase project.
3. Protected routes enforce authentication.
4. The dashboard displays actual authorized slot data.
5. Slot availability reflects sensor freshness and the backend's state model.
6. OCR events from FastAPI are displayed correctly.
7. Reservations use the specified FastAPI endpoints.
8. Bills and mock payments use backend responses.
9. Payment success is never simulated solely in the browser.
10. Gate status is not falsely inferred from payment success.
11. Charts use actual historical data or show a clear empty state.
12. The UI handles loading, failures, stale readings and offline devices.
13. The application is responsive and accessible.
14. There are no hardcoded production secrets.
15. Type checks, linting and relevant tests pass.
16. All setup steps are documented.

Build a complete, cohesive website rather than isolated mockup screens. Prioritize correctness of data flow, clarity of the live parking status, security of operational actions, and a polished user experience.

When finished, summarize the implemented pages, Firebase integration, FastAPI endpoints used, required environment variables, test results and any backend capabilities still needed for full functionality.