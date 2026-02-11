# Booking Order – Status Check & Payment Time Limit

## Status check: use OrderRetrieve only

- **OrderCreate** is for creating the order (booking flow). It is **not** used to check status.
- **OrderRetrieve** is the **only** endpoint used to check order status. The system gets the current status by calling **OrderRetrieve** with `orderReference`.

### How the frontend checks status (Vercel hobby)

- The frontend is hosted on Vercel (e.g. hobby plan). There is **no server-side cron or background job**.
- Status is checked **when the user opens the booking-order page**:
  1. The page calls **OrderRetrieve** with the `orderRef` from the URL.
  2. The API returns the current order, including **orderStatus** and **paymentTimeLimit**.
  3. The UI shows that status and payment time limit. If the backend has **extended** the booking time, the new **paymentTimeLimit** in the response is used, so the user sees the updated expiry (e.g. “Your booking will expire by …” with the extended date/time).

- If OrderRetrieve fails (e.g. network), the page falls back to **sessionStorage** (cached response) so the user can still view the last known data. Cache is updated whenever OrderRetrieve succeeds, so the next successful load will show any extended **paymentTimeLimit**.

### Possible order statuses (from backend)

The backend can return various **orderStatus** values, including but not limited to:

- **OnHold** – booking created, payment not completed; may have `paymentTimeLimit`
- **Confirmed** – paid and confirmed
- **Cancelled** – order cancelled
- **Refunded** – refund processed
- **Voided** – voided
- **Exchanged** – exchanged
- Others as defined by the flight/booking API

The UI displays whatever **orderStatus** OrderRetrieve returns. For **OnHold** we also use **paymentTimeLimit** to show “Your booking will expire by …” and to derive “Expired” when that time has passed.

---

## Payment time limit display (Electronic Ticket section)

- When **orderStatus** is **OnHold** and **paymentTimeLimit** is present, the booking-order page shows below STATUS:
  - **Before expiry:**  
    `Your booking will expire by 30 January, 02:24.`  
    If the expiry date is the next calendar day:  
    `Your booking will expire tomorrow at 02:24.`
  - **After expiry:**  
    `Your booking has expired.`  
    STATUS is shown as **Expired** (derived from `paymentTimeLimit`).

- **paymentTimeLimit** comes from the **OrderRetrieve** (or OrderCreate) response (e.g. `"2026-01-30T02:24:00"`).

---

## Summary

| Purpose           | Endpoint       | When it’s used                                      |
|------------------|----------------|-----------------------------------------------------|
| Create order     | OrderCreate    | During booking flow (e.g. review-book → ordercreate) |
| Check status     | OrderRetrieve  | On booking-order page load; “Refresh” if you add it  |

- **Status check = OrderRetrieve only.**  
- On Vercel hobby, the “system” checks status by calling OrderRetrieve when the user visits the booking-order page; no cron needed.
- **paymentTimeLimit** is always taken from the latest OrderRetrieve response. If the backend extends the booking time, the updated **paymentTimeLimit** is shown on the next visit (or after a refresh).
