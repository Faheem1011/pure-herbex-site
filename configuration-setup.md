Yes. I went through the entire 12-page RUN Couriers API document. The important part for your requirement is that **RUN is acting as the aggregation layer**, and Leopard is one of the third-party gateways available through RUN. The document explicitly exposes Leopard as `gateway_id: 1`, with `api_id: 28` and `booking_api_id: 17`.

The system should therefore **not integrate your website directly with Leopard**. Your site should integrate with **RUN**, tell RUN to use the Leopard gateway, and store both the RUN tracking number and the Leopard tracking number.

Below is the implementation specification I would give Antigravity.

---

# Production-Ready RUN Courier + Leopard Integration

## 1. Overall architecture

Build the courier system as a proper backend integration rather than calling RUN's API directly from the frontend.

```text
CUSTOMER
   │
   ▼
YOUR WEBSITE
   │
   │ Places Order
   ▼
YOUR BACKEND
   │
   ├── Save Order
   ├── Validate Address
   ├── Calculate COD
   └── Create Shipment
          │
          ▼
      RUN COURIERS API
          │
          │ api_vendor = "28|1"
          ▼
      LEOPARD COURIER
          │
          ▼
   Leopard Tracking Number
          │
          ▼
      RUN Response
          │
          ▼
      YOUR BACKEND
          │
          ├── RUN tracking_no
          ├── Leopard tracking_no
          ├── Courier = Leopard
          └── Shipment status/history
                 │
        ┌────────┴─────────┐
        ▼                  ▼
   ADMIN PANEL        CUSTOMER TRACKING
```

RUN provides APIs for creating, cancelling, listing and tracking orders, obtaining statuses, cities, products/services, and third-party courier/gateway information.

---

# 2. VERY IMPORTANT: Leopard selection

Do **not** use:

```json
"api_vendor": "auto"
```

if the requirement is specifically Leopard.

The RUN documentation gives these mappings:

```text
Auto:
api_id = auto
gateway_id = 0

Run Courier / Bluex:
api_id = 7
gateway_id = 0

Leopard:
api_id = 28
gateway_id = 1

Trax:
api_id = 28
gateway_id = 2

Bluex:
api_id = 28
gateway_id = 4

M&P:
api_id = 28
gateway_id = 5

TCS:
api_id = 28
gateway_id = 6
```

The API expects the value in the format:

```text
api_id|gateway_id
```

Therefore Leopard should be:

```text
28|1
```

This is explicitly supported by the RUN documentation.  

---

# 3. Credentials must NEVER be exposed to the frontend

The RUN credentials such as:

```text
client_code
auth_key
profile_id
```

must only exist on the server.

Do NOT put them in:

```text
React
Next.js client components
browser JavaScript
HTML
localStorage
cookies accessible to JS
```

Use environment variables:

```env
RUN_CLIENT_CODE=
RUN_AUTH_KEY=
RUN_PROFILE_ID=
RUN_API_BASE_URL=https://portal.runcourier.com/API
RUN_DEFAULT_SERVICE=Overnight
RUN_DEFAULT_GATEWAY=28|1
```

The sample API requires `client_code`, `auth_key`, `service_type`, `product`, `profile_id`, origin, receiver information, pieces, weight, COD amount, etc.

---

# 4. Create a dedicated courier service layer

Do NOT scatter RUN API calls throughout the website.

Create something like:

```text
/services/courier/
    runCourier.service
    runCourier.client
    runCourier.mapper
    runCourier.types
    runCourier.errors
```

The application should interact with an abstraction:

```typescript
createShipment()
cancelShipment()
getShipmentStatus()
getShipmentTrackingHistory()
getCourierServices()
getCourierCities()
getCourierGateways()
syncShipmentStatus()
```

Then RUN-specific implementation lives underneath it.

This gives you the ability to add:

```text
Leopard
Trax
TCS
M&P
Bluex
```

later without rewriting the order system.

---

# 5. Database design

This is extremely important.

Do **not** only store the courier tracking number inside the orders table.

Create a dedicated `shipments` table.

For example:

```text
shipments

id
order_id
courier_provider
courier_gateway
run_tracking_no
third_party_tracking_no
third_party_name

service_type
product
profile_id

origin_city
destination_city

receiver_name
receiver_phone
receiver_email
receiver_address

pieces
weight
cod_amount

run_order_id
invoice_url

status
status_code

created_at
updated_at
last_synced_at
```

And create:

```text
shipment_tracking_events

id
shipment_id
tracking_no
status
status_code
event_time
source
raw_response
created_at
```

Also keep an audit table:

```text
courier_api_logs

id
shipment_id
endpoint
request_payload
response_payload
http_status
success
error_message
created_at
```

**Do not store auth keys inside API logs.**

Mask sensitive credentials before logging.

---

# 6. Order state vs shipment state

Do not mix your ecommerce order status with RUN's courier status.

For example:

### Ecommerce order

```text
Pending Payment
Paid
Processing
Ready to Ship
Shipped
Delivered
Cancelled
Returned
Refunded
```

### Courier shipment

```text
New Booked
Pick up in progress
Picked up
Parcel Received at office
Parcel in Transit to Destination
Parcel Received at Destination
Out for Delivery
Delivered
Re-attempt
Returned
Lost
Claim
```

RUN's status list includes these and other statuses such as `Refused to Accept`, `Return Confirmation`, `Lost`, `Delivery Unsuccessful`, `Returned to Shipper`, etc.

Maintain a mapping layer between the two.

Example:

```text
RUN "New Booked"
    → ecommerce "Ready to Ship"

RUN "Picked up"
    → ecommerce "Shipped"

RUN "Parcel in Transit to Destination"
    → ecommerce "Shipped"

RUN "Out for Delivery"
    → ecommerce "Out for Delivery"

RUN "Delivered"
    → ecommerce "Delivered"

RUN "Returned to Shipper"
    → ecommerce "Returned"

RUN "Lost"
    → ecommerce "Courier Issue"
```

Do not hard-code assumptions blindly. Store the original RUN status as well.

---

# 7. Automatic order workflow

When a customer places an order:

```text
1. Customer submits checkout.

2. Backend validates:
   - name
   - phone
   - address
   - city
   - products
   - quantity
   - total
   - COD amount

3. Create ecommerce order.

4. Mark order:
   "Pending Shipment"

5. If order qualifies for automatic dispatch:
   call RUN CreateOrder API.

6. Force Leopard:
   api_vendor = "28|1"

7. Receive RUN response.

8. Store:
   - RUN tracking number
   - Leopard tracking number
   - third-party courier name
   - RUN order ID
   - invoice URL

9. Mark shipment:
   "Booked"

10. Show tracking information in admin.

11. Show tracking information to customer.

12. Background worker periodically synchronizes tracking.

13. When delivered:
   update shipment.

14. Update ecommerce order.

15. Notify customer.
```

---

# 8. RUN Create Order API

Endpoint:

```text
POST
https://portal.runcourier.com/API/CreateOrder.php
```

The API accepts JSON.

The application should construct a payload approximately like:

```json
{
  "client_code": "{{RUN_CLIENT_CODE}}",
  "auth_key": "{{RUN_AUTH_KEY}}",
  "service_type": "Overnight",
  "product": "Overnight",
  "profile_id": "{{RUN_PROFILE_ID}}",

  "origin": "YOUR_ORIGIN_CITY",

  "receiver_phone": "CUSTOMER_PHONE",
  "destination": "CUSTOMER_CITY",
  "receiver_name": "CUSTOMER_NAME",
  "receiver_email": "CUSTOMER_EMAIL",
  "receiver_address": "CUSTOMER_ADDRESS",

  "pieces": 1,
  "tracking_no": "",
  "weight": 1,

  "order_date": "YYYY-MM-DD HH:mm:ss",

  "collection_amount": "ORDER_TOTAL",

  "product_description": "PRODUCT DESCRIPTION",

  "special_instruction": "",

  "order_id": "YOUR_INTERNAL_ORDER_ID",

  "api_vendor": "28|1"
}
```

The source documentation confirms the required structure and specifically explains that `api_vendor` can be `auto` or `api_id|gateway_id`.

---

# 9. The Leopard tracking-number problem

This is the part I would specifically tell Antigravity **not to screw up**.

RUN's Create Order response contains:

```json
{
  "tracking_no": 110010208,
  "thirdparty_tracking_no": null,
  "thirdparty_name": "0",
  "id": 68765,
  "invoice_link": "...",
  "message": "Order created successfully"
}
```

The documentation therefore clearly distinguishes:

```text
tracking_no
```

from:

```text
thirdparty_tracking_no
```

and:

```text
thirdparty_name
```

### Therefore your database MUST have both

```text
run_tracking_no
third_party_tracking_no
third_party_name
```

Do not overwrite one with the other.

---

# 10. Customer-facing tracking number

Your customer-facing UI should prioritize the **original Leopard tracking number**.

Logic:

```typescript
const customerTrackingNumber =
    shipment.third_party_tracking_no ||
    shipment.run_tracking_no;
```

But don't simply rename the RUN number as Leopard.

Display:

```text
Courier: Leopard Courier

Tracking Number:
123456789

Status:
Parcel in Transit
```

If Leopard's original tracking number has not yet been returned:

```text
Courier: Leopard Courier

RUN Shipment Reference:
110010208

Leopard tracking number:
Pending courier confirmation
```

Once `third_party_tracking_no` becomes available, automatically replace the temporary reference with the real Leopard number.

---

# 11. IMPORTANT limitation in the supplied API documentation

The document **does not provide a dedicated Leopard tracking API endpoint**.

It provides RUN's:

### Current Status

```text
POST
https://portal.runcourier.com/API/CurrentStatus.php
```

with:

```json
{
  "tracking_no": "24020900029"
}
```

### Tracking History

```text
POST
https://portal.runcourier.com/API/TrackOrder.php
```

with:

```json
{
  "tracking_no": "24020900029"
}
```

Therefore **do not invent a Leopard API endpoint**.

The implementation should initially obtain the Leopard number through RUN's third-party booking response/data.

If RUN returns:

```json
"thirdparty_tracking_no": "LEOPARD123456"
```

store it.

If RUN initially returns:

```json
"thirdparty_tracking_no": null
```

the backend should periodically re-check the shipment through the available RUN APIs rather than assuming the RUN tracking number is the Leopard number.

---

# 12. Automatic tracking synchronization

Because the supplied documentation does not describe webhooks, implement a background polling system.

For example:

```text
Every 5 minutes:
    find active shipments
    where:
        status not Delivered
        AND status not Returned
        AND status not Cancelled

    synchronize each shipment
```

For each shipment:

```text
RUN CurrentStatus
        ↓
compare status
        ↓
if changed:
    update shipment
    create tracking event
    update order
    notify customer
```

Then periodically retrieve:

```text
TrackOrder.php
```

to maintain the complete tracking timeline.

---

# 13. Never let tracking sync break checkout

The architecture should be asynchronous.

Bad:

```text
Customer Checkout
      ↓
Create RUN shipment
      ↓
RUN takes 15 seconds
      ↓
Checkout waits
```

Better:

```text
Customer Checkout
      ↓
Order created
      ↓
Shipment Job queued
      ↓
Customer gets successful order confirmation
      ↓
Background worker calls RUN
```

This prevents RUN downtime/slow responses from breaking your ecommerce checkout.

---

# 14. Shipment creation job

Create a queue/job:

```text
CreateCourierShipmentJob
```

Workflow:

```text
Order ID
   ↓
Check shipment already exists?
   ↓
YES → stop / return existing shipment

NO
   ↓
Validate order
   ↓
Create RUN shipment
   ↓
api_vendor = 28|1
   ↓
Receive response
   ↓
Store RUN tracking
   ↓
Store Leopard tracking
   ↓
Store raw response
   ↓
Update shipment status
```

This must be **idempotent**.

If the job runs twice, it must NOT create two courier shipments.

---

# 15. Idempotency protection

Before creating a shipment:

```sql
SELECT *
FROM shipments
WHERE order_id = ?
AND courier_provider = 'RUN'
AND cancelled_at IS NULL;
```

If one exists:

```text
DO NOT create another shipment.
```

This protects against:

* user refreshing checkout
* server retry
* queue retry
* timeout after successful RUN booking
* deployment restart

---

# 16. API retry system

Implement controlled retries.

For example:

```text
Attempt 1
   ↓
failure
   ↓
wait 10 seconds
   ↓
Attempt 2
   ↓
failure
   ↓
wait 30 seconds
   ↓
Attempt 3
```

Do NOT blindly retry a Create Order request after an unknown timeout.

Why?

Because RUN may have successfully created the parcel even though your server never received the response.

In that situation:

```text
UNKNOWN RESULT
```

should trigger reconciliation rather than blindly creating another order.

---

# 17. Admin dashboard

Build a proper courier management section.

### Dashboard

Display:

```text
Total Orders
Pending Shipment
Booked
Picked Up
In Transit
Out for Delivery
Delivered
Re-attempt
Returned
Cancelled
Courier Issues
```

Also:

```text
RUN API Health
Last Successful Sync
Failed API Requests
Pending Shipment Jobs
```

---

# 18. Orders table

Add columns:

```text
Order #
Customer
Order Amount
Payment
Order Status
Courier
RUN Tracking
Leopard Tracking
Courier Status
Created
Updated
Actions
```

Example:

```text
#10234
Ahmed
Rs. 2,500
COD
Shipped
Leopard
RUN: 110010208
LEO: 123456789
In Transit
```

---

# 19. Order detail page

Show a dedicated shipment card:

```text
COURIER SHIPMENT

Courier
Leopard

Tracking Number
123456789

RUN Reference
110010208

Shipment Status
In Transit

Booked
14 Aug 2026 13:30

Last Updated
14 Aug 2026 15:05
```

Then:

```text
TRACKING TIMELINE

✓ Order Booked
✓ Picked Up
✓ Parcel Received at Office
✓ In Transit
○ Destination Office
○ Out for Delivery
○ Delivered
```

---

# 20. Manual controls

Admin must be able to:

```text
Create Shipment
Retry Shipment
Cancel Shipment
Refresh Tracking
View Tracking History
View API Response
View Invoice
Change Courier
```

But dangerous operations need confirmation.

For example:

```text
Cancel Shipment?

This will attempt to cancel the courier shipment.
Order: #10234
Tracking: 110010208
Courier: Leopard

[Cancel Shipment] [Close]
```

RUN provides a Cancel Order endpoint:

```text
GET
https://portal.runcourier.com/API/CancelOrder.php
```

with `auth_key` and `tracking_no`.

---

# 21. Cities

Do not allow arbitrary city strings if RUN expects its own city list.

RUN exposes:

```text
GET
https://portal.runcourier.com/API/GetCitiesList.php
```

and returns city IDs/names.

Create a scheduled sync:

```text
RUN cities
     ↓
your database
     ↓
checkout/admin dropdown
```

Store:

```text
run_city_id
run_city_name
```

Customer-facing checkout can still have your nicer city selector, but internally map it to RUN's city.

---

# 22. Product/service synchronization

RUN also exposes:

```text
ProductAndService.php
```

which returns products, services, profiles and cities.

Create an admin configuration page:

```text
Courier Configuration

Provider:
RUN Courier

Gateway:
Leopard

API Vendor:
28

Gateway ID:
1

Service:
Overnight

Profile:
[configured profile]

Origin:
[configured origin]
```

Don't hard-code everything into the frontend.

---

# 23. Gateway management

Since RUN supports multiple gateways, design the database like:

```text
courier_gateways

id
provider
run_api_id
run_gateway_id
name
enabled
is_default
```

Populate from RUN:

```text
Leopard → 28 / 1
Trax    → 28 / 2
Bluex   → 28 / 4
M&P     → 28 / 5
TCS     → 28 / 6
```

The API documentation explicitly exposes these gateway mappings.

This means later you can add:

```text
Courier: Leopard
Courier: TCS
Courier: Trax
```

without rebuilding the entire shipment system.

---

# 24. Customer tracking page

Create:

```text
/track-order
```

Customer can enter:

```text
Order Number
+
Phone Number
```

or:

```text
Tracking Number
```

I recommend requiring **order number + phone/email** when tracking by order number, so people cannot access another customer's information.

Display:

```text
YOUR ORDER

Order #10234

Courier
Leopard

Tracking Number
123456789

Current Status
Out for Delivery
```

Then the timeline.

---

# 25. Customer tracking should use the original Leopard number

This is one of the most important UI rules.

Do **not** show:

```text
RUN Tracking: 110010208
```

as the main tracking number if:

```text
thirdparty_tracking_no = 123456789
```

Instead:

```text
Leopard Tracking Number
123456789
```

You can optionally put:

```text
RUN Shipment Reference: 110010208
```

under an expandable "Technical details" section.

The customer should primarily see the number that corresponds to the actual courier carrying the parcel.

---

# 26. Invoice

RUN returns:

```text
invoice_link
```

after successful booking.

Store it:

```text
invoice_url
```

and give admins:

```text
View Invoice
Print Invoice
```

Do not unnecessarily expose internal RUN invoice URLs to customers unless you actually want them to access them.

---

# 27. Tracking history

Use:

```text
TrackOrder.php
```

for historical tracking events.

Store each event locally.

Example:

```text
tracking_events

---------------------------------
New Booked
14 Aug 13:25

Pick up in progress
14 Aug 14:10

Picked up
14 Aug 16:42

Parcel Received at office
14 Aug 19:15
---------------------------------
```

The RUN API's tracking-history endpoint returns tracking number, status and timestamp.

---

# 28. API error handling

Every RUN request needs:

```text
timeout
HTTP error handling
JSON parsing validation
API response validation
retry logic
logging
```

Never assume:

```json
{
  "tracking_no": "..."
}
```

will always be returned.

Validate:

```typescript
if (!response.tracking_no) {
    // booking did not complete successfully
}
```

Also handle:

```text
HTTP 500
HTTP 400
timeout
connection failure
invalid JSON
missing tracking number
RUN error message
unexpected response structure
```

---

# 29. Raw API response storage

For debugging, store the response.

Example:

```text
courier_api_logs

endpoint:
CreateOrder.php

request:
{
   ...
}

response:
{
   ...
}

status:
200

created_at:
...
```

But sanitize:

```text
auth_key
passwords
tokens
```

before storing/displaying logs.

Admin can then click:

```text
View API Log
```

to diagnose problems without needing server access.

---

# 30. Automatic status synchronization

Suggested intervals:

```text
New Booked:
every 5 minutes

Picked Up / Transit:
every 10 minutes

Out for Delivery:
every 3-5 minutes

Delivered:
stop synchronization

Returned:
stop normal synchronization
```

Use a queue rather than one massive cron request.

---

# 31. Status reconciliation

When RUN reports:

```text
Delivered
```

do:

```text
shipment.status = delivered

order.status = delivered

tracking event = Delivered

delivered_at = timestamp
```

When:

```text
Returned to Shipper
```

do:

```text
shipment.status = returned

order.status = returned
```

Do not automatically issue refunds unless your business rules explicitly require that.

---

# 32. Webhooks

The supplied RUN document **does not document webhook support**.

Therefore:

```text
DO NOT build the system assuming RUN webhooks exist.
```

Use polling initially.

However, architect the system so a webhook can later be added:

```text
Courier Event
     ↓
processShipmentEvent()
     ↓
same internal status-processing function
```

Then:

```text
Polling
   ───────┐
          ▼
   processShipmentEvent()
          ▲
          │
Webhook ──┘
```

This avoids rebuilding the tracking system later.

---

# 33. Security

Implement:

```text
HTTPS only
environment variables
server-side API calls
request validation
rate limiting
authentication
authorization
CSRF protection where applicable
input sanitization
SQL injection protection
XSS protection
secure admin sessions
audit logging
```

Never expose:

```text
RUN_AUTH_KEY
```

to customers.

---

# 34. Admin permissions

If your website has multiple administrators, create permissions:

```text
orders.view
orders.edit
shipments.view
shipments.create
shipments.cancel
shipments.retry
shipments.sync
courier.settings
courier.logs
```

A normal order-management employee should not necessarily have access to:

```text
RUN credentials
courier configuration
raw API logs
```

---

# 35. Courier configuration UI

Create:

```text
Admin
→ Settings
→ Shipping
→ RUN Couriers
```

with:

```text
RUN Enabled               ON

Client Code               ********

Auth Key                  ********

Default Service           Overnight

Default Courier           Leopard

API Vendor                28

Gateway ID                1

API Vendor Value          28|1

Origin                    Lahore

Auto Create Shipment      ON

Auto Sync Tracking        ON
```

Include:

```text
[Test Connection]
```

which checks the RUN APIs without creating a shipment.

---

# 36. Production deployment

Antigravity should separate:

```text
Development
Staging
Production
```

Environment variables should differ between environments.

Example:

```text
.env.local
.env.staging
.env.production
```

Never commit credentials to Git.

Add:

```text
.env*
```

to `.gitignore`.

---

# 37. Monitoring

Production dashboard should monitor:

```text
RUN API availability
Create Order failures
Tracking sync failures
Cancelled shipment failures
Queue failures
Orders waiting for shipment
Orders missing Leopard tracking number
```

Especially create an alert for:

```text
Shipment successfully created in RUN
BUT
third_party_tracking_no is NULL
```

That is directly relevant to your Leopard requirement.

---

# 38. The Leopard tracking reconciliation process

I would specifically implement this:

```text
CREATE RUN SHIPMENT
        │
        ▼
Does response contain
thirdparty_tracking_no?
        │
    ┌───┴────┐
    │        │
   YES       NO
    │        │
    ▼        ▼
Save LEO    Save RUN tracking
tracking    as temporary reference
    │        │
    │        ▼
    │    Queue reconciliation
    │        │
    │        ▼
    │    Query RUN shipment
    │        │
    │        ▼
    │    Leopard tracking found?
    │       / \
    │     YES  NO
    │      │    │
    │      ▼    ▼
    │    Save   Retry later
    │
    ▼
Customer sees Leopard number
```

This is much safer than assuming the first response will always contain the Leopard tracking number.

---

# 39. Critical distinction

Your database should eventually look like:

```text
Order #10234

Courier:
Leopard

RUN Reference:
110010208

Leopard Tracking:
123456789

RUN Order ID:
68765

Courier Status:
Out for Delivery

Customer Status:
Out for Delivery
```

Not:

```text
Tracking:
110010208
Courier:
Leopard
```

because that could incorrectly present the RUN internal tracking number as a Leopard tracking number.

---

# 40. Testing requirements before production

Antigravity should create a staging/test mode and test:

### Booking

* [ ] Create COD order
* [ ] Create prepaid order if applicable
* [ ] Create order with valid city
* [ ] Create order with invalid city
* [ ] Multiple pieces
* [ ] Different weights
* [ ] Different order amounts
* [ ] Empty email
* [ ] Pakistani phone formats
* [ ] Long address
* [ ] Special characters

### Leopard

* [ ] Verify `28|1`
* [ ] Verify RUN creates shipment through Leopard
* [ ] Verify `thirdparty_name`
* [ ] Verify `thirdparty_tracking_no`
* [ ] Verify original Leopard tracking is stored

### Tracking

* [ ] New Booked
* [ ] Picked Up
* [ ] In Transit
* [ ] Out for Delivery
* [ ] Delivered
* [ ] Re-attempt
* [ ] Returned
* [ ] Lost

RUN's official status list includes these shipment states, so the implementation should be tested against the actual values returned by RUN rather than inventing its own courier statuses.

### Failure scenarios

* [ ] RUN timeout
* [ ] RUN 500
* [ ] Invalid credentials
* [ ] Duplicate shipment job
* [ ] Response missing tracking number
* [ ] Leopard tracking initially null
* [ ] Tracking API unavailable
* [ ] Customer refreshes checkout
* [ ] Admin retries booking
* [ ] Server restarts during shipment creation

---

# 41. Definition of "production ready"

Do not consider this implementation finished merely because:

```text
"I can click Create Order and RUN creates a parcel."
```

It should only be considered complete when:

```text
✓ Customer places order
✓ Order saved locally
✓ Shipment automatically created
✓ Leopard selected explicitly
✓ RUN tracking stored
✓ Leopard tracking stored
✓ Original Leopard tracking shown to customer
✓ Customer can track order
✓ Admin can track order
✓ Tracking automatically synchronizes
✓ Tracking history stored
✓ Admin can manually refresh
✓ Admin can cancel
✓ Admin can retry failed shipment
✓ Duplicate shipment protection exists
✓ API errors are handled
✓ API logs exist
✓ Credentials are secure
✓ Courier statuses mapped
✓ RUN cities synchronized
✓ Courier gateway configurable
✓ Background jobs exist
✓ Monitoring exists
✓ Staging tests pass
✓ Production environment separated
```

---

## One thing I would NOT let Antigravity assume

The document proves that **Leopard is gateway `1` under API `28`**, and it proves that RUN's booking response has a field called `thirdparty_tracking_no`.  

But the document **does not guarantee that `thirdparty_tracking_no` is populated immediately**, nor does it provide a separate Leopard API for retrieving it.

So the implementation should explicitly support:

```text
RUN tracking number ≠ Leopard tracking number
```

and treat:

```text
thirdparty_tracking_no
```

as the authoritative Leopard number when available.

That is the safest way to solve the exact problem you described without inventing functionality that isn't in the supplied API documentation.

### Recommended implementation sequence

Have Antigravity build it in this order:

**Phase 1:** Database + courier abstraction
**Phase 2:** RUN authentication/configuration
**Phase 3:** Cities/services/gateway synchronization
**Phase 4:** RUN Create Order with `28|1` Leopard gateway
**Phase 5:** Store RUN + Leopard tracking separately
**Phase 6:** Background shipment queue/retry system
**Phase 7:** Current status + tracking history synchronization
**Phase 8:** Admin shipment management
**Phase 9:** Customer tracking page
**Phase 10:** Cancellation/retry/manual controls
**Phase 11:** Logging, monitoring, security and audit trail
**Phase 12:** Staging tests → production deployment

This structure will give you a **proper shipping subsystem**, rather than a one-off API call bolted onto checkout.
