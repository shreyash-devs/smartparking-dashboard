## Mandatory Architecture Rule: IoT → FastAPI → Firebase → Website

### 1. Required data flow

The system must follow this exact architecture:

**ESP32 sensors / ESP32-CAM → FastAPI → Firebase Cloud Firestore → React website**

The website must not communicate directly with the ESP32, ESP32-CAM, HC-SR04 sensors, IR sensors, or MQTT broker.

### 2. IoT devices and FastAPI

The ESP32 controller sends sensor readings and device events to authenticated FastAPI endpoints over HTTP/HTTPS.

The ESP32-CAM uploads entry and exit images to FastAPI. FastAPI calls the Plate Recognizer OCR API, processes the recognition result, and stores the relevant event and session data in Firestore.

FastAPI is responsible for:
- Receiving and validating sensor telemetry.
- Updating slot occupancy and sensor freshness.
- Processing camera images and OCR results.
- Managing reservations and slot allocation.
- Creating parking sessions.
- Calculating bills and processing mock payments.
- Publishing authorized MQTT commands to ESP32 controllers.
- Persisting application state and relevant event history in Firestore.

Only FastAPI and trusted backend processes may perform authoritative operational writes to Firestore.

### 3. Firebase Firestore

Firestore is the central persistent data store for the application.

It stores the latest slot state, sensor readings and timestamps, recognition events, reservations, parking sessions, payment records, device health, and relevant event history.

FastAPI validates and processes incoming IoT data before writing it to Firestore.

### 4. React website and Firebase

The website must retrieve authorized dashboard data directly from Firebase Cloud Firestore using the Firebase JavaScript SDK.

Use Firestore real-time listeners (`onSnapshot`) for permitted collections where live updates are useful. The dashboard should update automatically when FastAPI writes new sensor readings, slot status changes, recognition events, sessions, or payment status to Firestore.

The website must not poll the ESP32 or call sensor endpoints directly.

The website may call FastAPI for user actions and business operations, including:
- Creating and cancelling reservations.
- Checking in to reservations.
- Uploading a test image when an authorized manual recognition workflow is supported.
- Requesting an exit bill.
- Initiating mock payment.
- Performing other explicitly defined business operations.

The website must not directly write authoritative payment status, sensor readings, slot allocations, parking sessions, or gate authorization to Firestore.

### 5. Authentication and Firestore security

Use Firebase Authentication for website users.

Apply Firestore Security Rules that permit only the required authenticated reads. Users may access their own private reservation, session, and payment data; broader operational dashboard data may be available only to appropriately authorized users.

The FastAPI backend uses the Firebase Admin SDK with trusted server credentials. Because the Admin SDK bypasses Firestore Security Rules, FastAPI must independently enforce authentication, ownership, authorization, validation, and business rules.

Never expose service-account credentials, Plate Recognizer tokens, or privileged backend credentials in the website.

### 6. Live dashboard behavior

When a sensor detects a change:
1. The ESP32 sends its telemetry to FastAPI.
2. FastAPI validates the payload and updates Firestore.
3. Firestore publishes the change to authorized listeners.
4. The website updates the affected slot card, occupancy summary, and relevant live displays.

When the ESP32-CAM recognizes a vehicle through the backend workflow:
1. The camera uploads the image to FastAPI.
2. FastAPI calls Plate Recognizer.
3. FastAPI records the recognition result and relevant session changes in Firestore.
4. The website displays the new event and updated session or slot information.

If Firestore data is stale, unavailable, or missing, the website must show an appropriate loading, stale-data, or error state rather than inventing current sensor values.

### 7. MQTT boundary

MQTT is used for backend-to-device commands and device acknowledgements. The React website does not connect to MQTT.

For example, after FastAPI verifies a successful payment, it publishes an authorized exit-gate command. The ESP32 executes the command and reports the result. FastAPI can then persist the command and acknowledgement state in Firestore for display on the website.

### 8. Final architecture acceptance criteria

The implementation is correct only if:
- No frontend code connects to an ESP32 IP address.
- No frontend code connects directly to an MQTT broker.
- Sensor telemetry reaches Firestore through FastAPI.
- Camera images reach FastAPI before OCR processing.
- Firestore listeners update the website when permitted data changes.
- All sensitive business operations are validated by FastAPI.
- The website never treats a payment record alone as proof that a physical gate has opened.


Your final architecture is:
ESP32 + ESP32-CAM
Sensors, camera images and device events

FastAPI
Validation, OCR, business logic and trusted database writes

Firebase Firestore
Central database and real-time updates

React website
Reads authorized live data from Firestore; calls FastAPI for business actions