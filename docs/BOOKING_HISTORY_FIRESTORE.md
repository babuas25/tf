# Booking History – Firestore & OrderRetrieve

## What’s implemented

- **Firestore collection `bookings`**  
  One document per booking, with **document ID = Ref No (orderReference)** so upserts are idempotent.

- **Stored fields** (aligned with the table columns):
  - Create Date, Status, PNR's, Name, Fly Date, Airline, Fare, Issued, Passenger Type, Route, Created By, Ref No  
  - Plus `updatedAt` (last sync time).

- **When data is written**
  1. **After a successful OrderCreate** (review-book flow)  
     The app calls `POST /api/bookings` with the full `orderResponse` and saves the booking to Firestore.  
     `createdBy` is currently sent as `"Guest"` (see below if you want to use a logged-in user).

  2. **When a user clicks Ref No** on the superadmin Booking History page  
     The app calls `POST /api/bookings` with `{ orderReference }`.  
     The server calls **OrderRetrieve**, then updates the same Firestore document with the latest status, fare, expiry, etc., and then the user is sent to the booking-order page.

- **Reading data**  
  The superadmin bookings page loads the list via **GET /api/bookings**, which reads from Firestore and returns all bookings (ordered by `createDate` desc). Filtering by status is done in the UI.

## What you need to provide

1. **Firebase / Firestore**  
   You already have Firebase Admin set up (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` in server env).  
   No extra config is required for the bookings collection.

2. **“Created By”**  
   Right now every booking saved from the review-book flow uses `createdBy: "Guest"`.  
   If you want to store the actual user (e.g. superadmin name or email):
   - When you have a session or auth context on the review-book (or ordercreate) flow, pass that user identifier into the place we call `POST /api/bookings` (e.g. from `session?.user?.name` or `session?.user?.email`).
   - Then send it in the body as `createdBy: currentUserName` (or whatever you decide).  
   The API already accepts optional `createdBy` in the POST body.

3. **Firestore index (if needed)**  
   List query uses: `orderBy('createDate', 'desc')`, `limit(200)`.  
   If Firestore asks for a composite index, create it in the Firebase Console for collection `bookings`, field `createDate` descending.

## API summary

| Method | URL             | Body | Purpose |
|--------|-----------------|------|--------|
| GET    | `/api/bookings` | –    | List all bookings from Firestore for the table. |
| POST   | `/api/bookings` | `{ orderResponse, createdBy? }` | Save after OrderCreate (e.g. from review-book). |
| POST   | `/api/bookings` | `{ orderReference }` | Sync one booking from OrderRetrieve and update Firestore, then use Ref No e.g. to open booking-order. |

Ref No click: the app triggers a sync (POST with `orderReference`), then navigates to `/booking-order?orderRef=...`.
