This documentation provides detailed information on how to
integrate with our API to enhance your travel booking
experience.

 API Environments

Base URL
https://api.tripfeels.com/

FINAL FULL ENDPOINT URLs (ALL)
API Name	Full Endpoint URL
GetBalance	https://api.tripfeels.com/GetBalance
AirShopping	https://api.tripfeels.com/AirShopping
MiniRule	https://api.tripfeels.com/MiniRule
FareRules	https://api.tripfeels.com/FareRules
OfferPrice*	https://api.tripfeels.com/OfferPrice
SeatAvailability	https://api.tripfeels.com/SeatAvailability
ServiceList	https://api.tripfeels.com/ServiceList
OrderSell*	https://api.tripfeels.com/OrderSell
OrderCreate	https://api.tripfeels.com/OrderCreate
OrderRetrieve	https://api.tripfeels.com/OrderRetrieve
OrderCancel	https://api.tripfeels.com/OrderCancel
OrderReshopPrice*	https://api.tripfeels.com/OrderReshopPrice
OrderChange	https://api.tripfeels.com/OrderChange

⭐ * = Mandatory repricing APIs (do NOT skip)

✅ How AUTH Works (IMPORTANT)

You DO NOT send API Key anymore.

Nginx already injects:

X-API-KEY: <your-key>


You only send Basic Auth:

Username: superadmin
Password: 123456789

✅ Example CURL Commands (READY TO USE)
Get Balance
curl -k -u superadmin https://api.tripfeels.com/GetBalance

AirShopping (POST)
curl -k -u superadmin \
  -H "Content-Type: application/json" \
  -X POST https://api.tripfeels.com/AirShopping \
  -d '{
    "pointOfSale": "BD",
    "request": {
      "originDest": [
        {
          "originDepRequest": {
            "iatA_LocationCode": "DAC",
            "date": "2026-04-15"
          },
          "destArrivalRequest": {
            "iatA_LocationCode": "CXB"
          }
        }
      ],
      "pax": [
        { "paxID": "PAX1", "ptc": "ADT" }
      ],
      "shoppingCriteria": {
        "tripType": "Oneway",
        "travelPreferences": {
          "vendorPref": [],
          "cabinCode": "Economy"
        },
        "returnUPSellInfo": true,
        "preferCombine": false
      }
    }
  }'

API Endpoints
AirShopping
● Description: Search and retrieve flight results.
● Endpoint: base_url/AirShopping
MiniRule
● Description: Get penalty details for respective flights.
● Endpoint: base_url/MiniRule
FareRules
● Description: Retrieve fare rules for respective flights.
● Endpoint: base_url/FareRules
OfferPrice
● Description: Get updates on price/booking class changes before booking.
● Endpoint: base_url/OfferPrice
SeatAvailability
● Description: Retrieve seat map information and related seat add-on
services.
● Endpoint: base_url/SeatAvailability
ServiceList
● Description: Retrieve available ancillary add-on services such as meals
and baggage for a selected flight offer.
● Endpoint: base_url/ServiceList
OrderSell
● Description: Finalize pricing confirmation before booking.
● Endpoint: base_url/OrderSell
OrderCreate
● Description: Create booking and generate the respective PNR and Order
reference.
● Endpoint: base_url/OrderCreate
OrderRetrieve
● Description: Retrieve booking details using order reference.
● Endpoint: base_url/OrderRetrieve
OrderCancel
● Description: Cancel bookings (Only applicable for OnHold and Expired
bookings).
● Endpoint: base_url/OrderCancel
3
OrderReshopPrice
● Description: Re-verify price before issuing/confirming tickets (Mandatory
before OrderChange API).
● Endpoint: base_url/OrderReshopPrice
OrderChange
● Description: Deduct payment and confirm bookings.
● Endpoint:base_url/OrderChange
GetBalance
● Description: Retrieve account balance.
● Endpoint: base_url/GetBalance



API Integration Flow
[ USER ]
   |
   v
[ GetBalance ]
   |
   v
[ AirShopping ]
   |
   v
[ OfferPrice * ]
   |--------------------|
   |                    |
   v                    v
[ FareRules ]      [ MiniRules ]
   |
   v
+-------------------------------+
|  Optional (if available)     |
|-------------------------------|
|  seatsAvailable  → SeatAvailability |
|  serviceList     → ServiceList      |
+-------------------------------+
   |
   v
[ OrderSell * ]
   |
   v
[ OrderCreate ]
   |
   v
[ OrderRetrieve ]
   |
   +--------------------+
   |                    |
   v                    v
[ OrderCancel ]   [ OrderReshopPrice * ]
                        |
                        v
                   [ OrderChange ]

═══════════════════════════════════════════════════════════════════════
  Note: Calling Repricing APIs is Mandatory. Do not break flow.
═══════════════════════════════════════════════════════════════════════

* = Repricing API endpoints

OfferPrice *  →  OrderSell *  →  OrderReshopPrice *
(Do NOT skip these APIs)


API Endpoints & Description

Air Shopping: Search and retrieve flight results. Results will expire
after 15 minutes.
● URL: base_url/AirShopping
● Method: POST
Request Fields:
● pointOfSale (string): Point of sale is the country/location code
(alpha-2) (e.g., "BD", "AE").
● request (object): Contains the details of the flight request.
○ originDest (object array): List of objects where each has origin
and destination details. These objects contain:
■ originDepRequest (object): Details of the departure location
and date.
■ iatA_LocationCode (string): Origin or Departure airport
code (e.g., "DAC").
■ date (string): Departure date (e.g., "2024-03-25").
■ destArrivalRequest (object): Details of the arrival location
and date.
■ iatA_LocationCode (string): Arrival airport code (e.g.,
"CXB").
■ date (string): Arrival date (optional for one-way
trips).
○ pax (array): List of objects for passenger details.
■ paxID (string): Unique passenger ID and the format is 'PAX'
followed by a serial number (e.g., "PAX1"). For multiple
passengers, increment the number (e.g., "PAX2", "PAX3").
■ ptc (string): Passenger type code. Use "ADT" for adults,
"CHD" for children, and "INF" for infants. For children, add
an age code (e.g., "C03" for a 3-year-old). If "CHD" is used
without an age code, it defaults to 11 years.
○ shoppingCriteria (object): This object defines the flight search
criteria, including trip type, cabin class, and preferences.
■ tripType (string): Type of trip ("Oneway", "Return",
"Circle").
■ travelPreferences (object):
■ vendorPref (string array, optional): Preferred airlines
(e.g., ["BG", "QR", "TK"] or null if no need).
■ cabinCode (string): Cabin type ("Economy",
"PremiumEconomy", "Business", "First").
■ returnUPSellInfo (boolean): Indicates whether to get branded
fares inside upSellBrandList in AirShopping API response or
not(true or false). If false passes, flights/fares will come
inside the main offers array. Branded fares offer additional
6
conveniences and services that can make travel more
comfortable and flexible.
■ preferCombine (boolean): For domestic return flights by
default you will get results of outbound and inbound
flights in two separate arrays inside a
specialReturnOfferGroup object in response. But if you
want it combined and in default format then pass true here
for return flights.

Request Samples:

One-way Request:
{
  "pointOfSale": "BD",
  "request": {
    "originDest": [
      {
        "originDepRequest": {
          "iatA_LocationCode": "DAC",
          "date": "2026-04-15"
        },
        "destArrivalRequest": {
          "iatA_LocationCode": "CXB"
        }
      }
    ],
    "pax": [
      {
        "paxID": "PAX1",
        "ptc": "ADT"
      }
    ],
    "shoppingCriteria": {
      "tripType": "Oneway",
      "travelPreferences": {
        "vendorPref": [],
        "cabinCode": "Economy"
      },
      "returnUPSellInfo": true,
      "preferCombine": false
    }
  }
}

Return Request:
{
  "pointOfSale": "BD",
  "request": {
    "originDest": [
      {
        "originDepRequest": {
          "iatA_LocationCode": "DAC",
          "date": "2024-01-15"
        },
        "destArrivalRequest": {
          "iatA_LocationCode": "CXB"
        }
      },
      {
        "originDepRequest": {
          "iatA_LocationCode": "CXB",
          "date": "2024-01-20"
        },
        "destArrivalRequest": {
          "iatA_LocationCode": "DAC"
        }
      }
    ],
    "pax": [
      {
        "paxID": "PAX1",
        "ptc": "ADT"
      },
      {
        "paxID": "PAX2",
        "ptc": "C05"
      }
    ],
    "shoppingCriteria": {
      "tripType": "Return",
      "travelPreferences": {
        "vendorPref": [],
        "cabinCode": "Economy"
      },
      "returnUPSellInfo": true,
      "preferCombine": true
    }
  }
}

Multicity Request:
{
  "pointOfSale": "BD",
  "request": {
    "originDest": [
      {
        "originDepRequest": {
          "iatA_LocationCode": "DAC",
          "date": "2024-01-15"
        },
        "destArrivalRequest": {
          "iatA_LocationCode": "KUL"
        }
      },
      {
        "originDepRequest": {
          "iatA_LocationCode": "DAC",
          "date": "2024-01-20"
        },
        "destArrivalRequest": {
          "iatA_LocationCode": "DXB"
        }
      },
      {
        "originDepRequest": {
          "iatA_LocationCode": "DAC",
          "date": "2024-01-25"
        },
        "destArrivalRequest": {
          "iatA_LocationCode": "BKK"
        }
      }
    ],
    "pax": [
      {
        "paxID": "PAX1",
        "ptc": "ADT"
      },
      {
        "paxID": "PAX2",
        "ptc": "C05"
      }
    ],
    "shoppingCriteria": {
      "tripType": "Circle",
      "travelPreferences": {
        "vendorPref": [],
        "cabinCode": "Economy"
      },
      "returnUPSellInfo": true,
      "preferCombine": false
    }
  }
}

Response Fields:
Root Object
● message: string
A descriptive message about the response.
● requestedOn: timestamp (e.g., 2024-07-29T08:24:17.110Z)
The timestamp when the request was made.
● respondedOn: timestamp (e.g., 2024-07-29T08:24:17.110Z)
The timestamp when the response was sent.
● response: Object
The main response object contains detailed data.
● statusCode: string
The status code of the response.
● success: boolean
Indicates if the request was successful (true or false).
● error: Object (optional)
Contains error details if the request was not successful.
Response Object
● traceId: string
A unique identifier for tracking the request/response.
● offersGroup: Array of Offer Objects
List of offers/flights available in the response.
● specialReturn: boolean
Indicates if there is a special return offer group (true or false). If
you search for domestic return flights and if the specialReturn value is
true then offers/flights will come inside the specialReturnOfferGroup
object.
● specialReturnOfferGroup: Objects
Special return means domestic return flights (e.g., Dhaka to Cox’s
Bazar). Contains special return offers if applicable. Here offers will
come in two separate arrays of offers, OB (Outbound offers) and IB
(Inbound offers). If true is passed in ‘preferCombine’ in the request
body then results will come in default format like oneway or other
returns.
● moreOffersAvailableAirline: Array of string
We are already providing the best combinations of flights for each
airline. But if you need more flight options then this array will contain
airline codes if any more combinations or flights are available for those
airlines. If you find any airline code here then you can call another API
endpoint which is“getmoreoffers” to fetch flights for that particular
airline and add it to your existing results.
SpecialReturnOfferGroup Object
● OB: Array of Offer Objects
List of outbound offers or flights. Same object structure as Offer in
offersGroup.
● IB: Array of Offer Objects
List of inbound offers or flights. Same object structure as Offer in
offersGroup.

Offer Object
● offer: Object
Detailed offer information.
● twoOnewayIndex: string (e.g., OB)
Indicates whether the offer is for outbound (OB) or inbound (IB).
● offerId: string
Unique identifier for the offer.
● validatingCarrier: string
Carrier/Airline code validating the offer.
● refundable: boolean
Indicates if the offer is refundable.
● fareType: string
Type of fare (OnHold/Web). If fareType is OnHold, then it's possible to
book and hold a flight, if fareType is Web then only instant purchase is
allowed for this booking.
● paxSegmentList: Array of PaxSegment Objects
List of passenger segments for the offer. In other words this array
contains flight segments.
● fareDetailList: Array of FareDetail Objects
Details of fare for each passenger type.
● price: Price Object
Pricing details for the offer.
● penalty: Penalty Object
Penalty details associated with the offer.
● baggageAllowanceList: Array of BaggageAllowance Objects
Baggage allowances per segment for the offer.
● upSellBrandList: Array of UpSellBrand Objects
List of upsell brands or branded fares available with the offer. If
available then the first one is the default or lowest one. Branded fares
offer additional conveniences and services that can make travel more
comfortable and flexible.
● seatsRemaining: number
Number of seats remaining for the offer.
PaxSegment Object
● paxSegment: Object
Detailed passenger/flight segment information.
● departure: Departure Object
Departure details for the segment.
● arrival: Arrival Object
Arrival details for the segment.
● marketingCarrierInfo: MarketingCarrierInfo Object
Marketing carrier/airline details.
● operatingCarrierInfo: OperatingCarrierInfo Object
Operating carrier/airline details.
● iatA_AircraftType: AircraftType Object
Aircraft type information.
● rbd: string
RBD stands for Reservation Booking Designator, a code to indicate the
booking class or fare class within each cabin class. While cabin classes
(e.g., Economy) refer to the general type of service, RBDs provide a more
granular level of detail. Each cabin class can have multiple booking

classes (RBDs) like Y, B, M, H, etc., each representing different fare
levels, restrictions, and benefits.
● flightNumber: number
Flight number (e.g., 123).
● segmentGroup: number
Segment grouping number. Whether you search for oneway or return or multi
city, all the segments will be inside paxSegmentList even if there are
stopovers. So to group them you can use this segmentGroup number. For
example you searched for a Dhaka to London return flight. Both onward and
return journeys have 1 stop each. Then there will be 4 segments inside
paxSegmentList. But to group them or separate them journey wise group
numbers can be used. In this case the two segments of Dhaka to London
journey will have the same segmentGroup number and same for return
segments.
● returnJourney: boolean
Indicates if it's a return journey.
● airlinePNR: string
Passenger Name Record.
● technicalStopOver: Array of TechnicalStopOver Objects
Technical stopover details.
● duration: number
Flight duration in minutes.
● cabinType: string
Cabin type, e.g., Economy.
Departure Object
● iatA_LocationCode: string
Origin or departure airport code.
● terminalName: string
Terminal name for the departure.
● aircraftScheduledDateTime: timestamp
Scheduled departure date and time.
Arrival Object
● iatA_LocationCode: string
Destination or arrival airport code.
● terminalName: string
Terminal name for the arrival.
● aircraftScheduledDateTime: datetime
Scheduled arrival date and time.
MarketingCarrierInfo Object
● carrierDesigCode: string
Carrier designation code.
● marketingCarrierFlightNumber: number
Marketing carrier's flight number.
● carrierName: string
Name of the marketing carrier.
OperatingCarrierInfo Object

● carrierDesigCode: string
Carrier designation code.
● carrierName: string
Name of the operating carrier.
AircraftType Object
● iatA_AircraftTypeCode: string
IATA aircraft type code.
TechnicalStopOver Object
● iatA_LocationCode: string
Airport or location code for the stopover.
● aircraftScheduledArrivalDateTime: timestamp
Scheduled arrival date and time at the stopover.
● aircraftScheduledDepartureDateTime: timestamp
Scheduled departure date and time from the stopover.
● arrivalTerminalName: string
Terminal name at stopover arrival.
● departureTerminalName: string
Terminal name at stopover departure.
FareDetail Object
● baseFare: double
Base fare amount.
● tax: number
Tax amount.
● otherFee: number
Any other fees.
● discount: number
Discount amount.
● vat: number
Value Added Tax amount.
● currency: string
Currency code.
● paxType: string
Passenger type, e.g., Adult/Child/Infants.
● paxCount: number
Number of passengers.
● subTotal: number
Subtotal amount.
Price Object
● totalPayable: TotalPayable Object
Total amount payable.
● gross: Gross Object
Gross total amount.
● discount: Discount Object
Discount details.
● totalVAT: TotalVAT Object
VAT details.
TotalPayable Object
● total: number
Total amount payable.
● currency: string
Currency code.
Gross Object
● total: number
Gross total amount.
● currency: string
Currency code.
Discount Object
● total: number
Total discount amount.
● currency: string
Currency code.
TotalVAT Object
● total: number
Total VAT amount.
● currency: string
Currency code.
Penalty Object
● refundPenaltyList: Array of RefundPenalty Objects
List of refund penalties per segment.
● exchangePenaltyList: Array of ExchangePenalty Objects
List of exchange penalties per segment.
RefundPenalty Object
● departure: string
Departure location.
● arrival: string
Arrival location.
● penaltyInfoList: Array of PenaltyInfo Objects
List of penalty information.
PenaltyInfo Object
● type: string
Type of penalty, e.g., Before or After.
● textInfoList: Array of TextInfo Objects
List of detailed penalty information per passenger type.
TextInfo Object
● paxType: string
Passenger type, e.g., Adult.
● info: Array of strings
Detailed penalty information.
ExchangePenalty Object
● Same structure as RefundPenalty Object and its child.
BaggageAllowance Object
● departure: string
Departure location.
● arrival: string
Arrival location.
● checkIn: Array of CheckIn Objects
Check-in baggage allowances per passenger type.
● cabin: Array of Cabin Objects
Cabin baggage allowances per passenger type.
CheckIn Object
● paxType: string
Passenger type, e.g., Adult.
● allowance: string
Check-in baggage allowance, e.g., 10Kg. You may get SB as a value and
that means Standard Baggage.
Cabin Object
● paxType: string
Passenger type, e.g., Adult.
● allowance: string
Cabin baggage allowance, e.g., 10Kg. You may get SB as a value and that
means Standard Baggage.
UpSellBrand Object
● offerId: string
Offer identifier.
● brandName: string
Brand name.
● refundable: boolean
Indicates if the offer is refundable.
● fareDetailList: Array of FareDetail Objects
List of fare details. Same as described above.
● price: Price Object
Pricing details. Same as described above.
● penalty: Penalty Object
Penalty details. Same as described above.
● baggageAllowanceList: Array of BaggageAllowance Objects
Baggage allowances. Same as described above.
● rbd: string
Booking class. Same as described above.
● meal: boolean
Indicates if a meal is included.
● seat: string
Seat information, if applicable.
● miles: string
Miles information, if applicable.
● refundAllowed: boolean
Indicates if a refund is allowed.
● exchangeAllowed: boolean
Indicates if exchange is allowed.
Error Object
● errorCode: string
Error code.
● errorMessage: string
Error message.

Get More Offers: As mentioned in AirShopping response details, GetMoreOffers
API can be used to fetch more flights or combinations using airline code if
available or needed. You must check the moreOffersAvailableAirline string array
in the AirShopping API response if any airline codes are there indicating more
flights are available for that airline.
● URL: base_url/getmoreoffers
● Method: POST
Request Fields:
● traceId (string): traceId is a unique identifier per search and it will
be used for tracking/validation purposes.
● airline (string): Pass the airline code to fetch more flights if
available and indicated in the AirShopping response.
Request Sample:
{
"traceId": "dasd324-asvadf32432-afdsg24-fdasfd",
"airline": "VQ"

Response Fields:
The GetMoreOffers API response is the same as the AirShopping API response.
Please check details of the AirShopping API response and follow accordingly.
You can bind the offers array of this api responses with your existing offers.
Offer Price: The OfferPrice API is the first repricing api in the flow which
validates price or booking class changes before proceeding to booking. When a
user selects a flight or clicks on the book button in the flight results
page/screen, call this api to confirm the current price/booking class. There is
an object offerChangeInfo in this api response which will provide changes if
exist else null. If changes exist, prompt the user for approval; otherwise,
proceed with booking.
● URL: base_url/offerprice
● Method: POST
Request Fields:
● traceId (string): traceId is a unique identifier per search and it will
be used for tracking/validation purposes.
● offerId (string array): The offerId is an array of strings containing the
unique identifiers for the selected flight(s). Each flight in the search
result has a distinct offerId, which can be found in the OfferGroup array
of the AirShopping API response.
For a Domestic Return Search, if the preferCombine field in the search
request is set to false, the flights will be organized into the
specialReturnOfferGroup object, which further categorizes flights into
two arrays: OB for outbound flights and IB for inbound flights. Both the
outbound and inbound flights in these arrays include their respective
offerId, and these must be passed as elements of the offerId array in the
OfferPrice API request.

Request Sample:
{
"traceId": "BD",
"offerId": [
"string"
]
}
Response Fields:
Root Object
● message: A string providing a general description of the response.
● requestedOn: A timestamp indicating when the API request was made.
Format: ISO 8601.
● respondedOn: A timestamp indicating when the API response was sent.
Format: ISO 8601.
● response: An object containing the main data for the offerPrice API
response.
statusCode: A string indicating the HTTP status code of the response
(e.g., "200 OK").
● success: A boolean indicating whether the API request was successful
(true or false).
● error: An optional object providing error details in case of a failure.
● info: An optional array of strings providing additional informational
messages.
Response Object
● traceId: A string that uniquely identifies the API request for debugging
or tracing purposes.
● offersGroup: An array containing Offer Objects that represent flight
offers. Please check AirShopping response fields for details.
● offerAvailable: A boolean indicating whether the offer is currently
available.
● offerChangeInfo: An object detailing the type of changes allowed for the
offers.
● passportRequired: A boolean indicating whether a passport is required for
this offer.
● availableSSR: An array of strings representing available Special Service
Requests (SSRs) for the offer.
● partialPaymentInfo: An object detailing the payment-related information,
such as partial payments.
● seatsAvailable: A boolean indicating whether seat map information and
seat add-on services are available for this offer. If true, use the
/api/enterprise/SeatAvailability endpoint to retrieve seat layout and
pricing details.
● serviceListAvailable: A boolean indicating whether ancillary add-on
services (meals and baggage) are available for this offer. If true, use
the /api/enterprise/ServiceList endpoint to retrieve meal and baggage
service details.
offerAvailable
● offerAvailable: A boolean indicating whether the offer is currently
available.
OfferChangeInfo Object
● typeOfChange: A string indicating the type of change occurred for the
offer. It can have three possible values: Both, Price, and BookingClass.
When the value is Both, it indicates that both the price and the booking
class have changed. If the value is Price, it means only the price of the
offer has changed, while BookingClass signifies that the change is
limited to the booking class of the offer, without any price alteration.
To show new changes check the Offer object.
passportRequired
● passportRequired: A boolean indicating whether a passport is required for
this offer.
availableSSR Array
● availableSSR: An array of strings representing available Special Service
Requests (SSRs) for the offer. Possible values include WCHR, VIP, CIP,
VVIP, MAAS, and FQTV. Only the SSRs provided in this list should be used
to pass for booking in orderSell API. These SSRs can be displayed on the
booking screen, allowing the user to select the appropriate service. WCHR
stands for Wheelchair assistance, VIP means Very Important Person, VVIP
stands for Very Very Important Person, CIP refers to Commercially
Important Person, MAAS stands for Meet and Greet service, and FQTV is the
frequent flyer number.
PartialPaymentInfo Object
● totalPayableAmount: A number representing the total payable amount for
the offer.
● minimumPayableAmount: A number representing the minimum payable amount
required.
● dueAmount: A number representing the amount due after the initial
payment.
● currency: A string specifying the currency of the payment amounts (e.g.,
"BDT").
● dueDate: A timestamp indicating the deadline for the remaining payment.
Seat Availability: The SeatAvailability API retrieves seat map information
and related seat add-on services (such as seat type, row, and pricing) for a
selected flight offer. This API must be called after the OfferPrice API when
the seatsAvailable field in the OfferPrice response is true. The seat map data
allows users to choose preferred seats before proceeding to booking.
● URL: base_url/seatavailability
● Method: POST
Request Fields:
● traceId (string): traceId is a unique identifier per search and it will
be used for tracking/validation purposes.
● offerId (string array): The offerId is an array of strings, similar to
the OfferPrice API request, with an important distinction for domestic
return flights when the preferCombine parameter is set to false. In such
cases, the search results will include flights in two separate arrays:
one for outbound/onward and another for inbound/return. This may require
passing two offerIds in the OfferPrice request. Based on the response
from the OfferPrice API, if both the onward and return flights are
operated by the same airline, a single combined offerId will be provided,
which should be used in the OrderSell API request. When preferCombine is
true for domestic return, that time also a new offerId will be provided
as the same airlines will be combined. However, if the onward and return
flights are operated by different airlines, the OfferPrice API will
return the same separate offerIds as initially passed. To ensure accurate
validation and compliance with the booking process, it is recommended to
always use the offerId provided in the OfferPrice API response when
making the OrderSell API request.
Request Sample:
{
"traceId": "BD",
"offerId": [
"string"
]
}
Response Fields:
Root Object
● message: A string providing a general description of the response.
● requestedOn: A timestamp indicating when the API request was made.
Format: ISO 8601.
● respondedOn: A timestamp indicating when the API response was sent.
Format: ISO 8601.
● response: An object containing the main data for the SeatAvailability API
response.
● statusCode: A string indicating the HTTP status code of the response
(e.g., "200 OK").
● success: A boolean indicating whether the API request was successful
(true or false).
● error: An optional object providing error details in case of a failure.
● info: An optional array of strings providing additional informational
messages.
Response Object
● traceId: A unique identifier that tracks this specific SeatAvailability
API request.
● seatOffers: An array containing seat availability and layout data for
each flight segment in the selected offer.
seatOffers Object
● twoOnewayIndex: A string that differentiates segments in multi-leg
journeys (e.g., outbound/inbound).
● offerId: The identifier of the flight offer for which seat availability
is being retrieved.
● journeyLegs: An array containing seat map details for each flight
segment.
journeyLegs Object
● departure: Departure airport code of the flight segment.
● arrival: Arrival airport code of the flight segment.
● decks: An array containing seat arrangement details for each aircraft
deck (commonly “MainDeck”).
decks Object
● deckInfo: Specifies the deck type (e.g., “MainDeck”, “UpperDeck”).
● compartments: An array describing seat configurations and layouts within
the deck.
compartments Object
● compartmentDesignation: The compartment or cabin name (e.g., Economy,
Business, First).
● seatArrangement: The general seat layout pattern in this cabin (e.g.,
3-3, 2-4-2).
● minRowNumber / maxRowNumber: Numeric range of available rows within the
compartment.
● rowWiseSeats: An array containing row-level seat data, including seat
numbers, pricing, and features.
rowWiseSeats Object
● rowNumber: Indicates the specific row number.
● seatServices: An array containing seat-level information for that row.
seatServices Object
● serviceId: A unique identifier for the seat service. This value must be
passed in the OrderSell and OrderCreate request when confirming a booking
with a selected seat.
● amount: The price associated with the seat.
● currency: The currency code (e.g., BDT, USD).
● seatAvailability: Indicates seat status (e.g., “Available”, “None”).
● seatType: Specifies the seat type (e.g., Window, Aisle, Extra Legroom).
● seatNumber: Displays the assigned seat number (e.g., 12A).
● seatFeatures: An array describing additional seat features (e.g., “Extra
Legroom”, “Near Exit”).

Service List: The ServiceList API retrieves available ancillary add-on
services such as meals and baggage for a selected flight offer. This API should
be called after the OfferPrice API if the serviceListAvailable field in the
OfferPrice response is true.
It enables users to view and select extra baggage or meal options on the
booking page before confirming their order.
● URL: base_url/servicelist
● Method: POST
Request Fields: Same as SeatAvailability API endpoint.
Response Fields:
Root Object
● message: A string providing a general description of the response.
● requestedOn: A timestamp indicating when the API request was made.
Format: ISO 8601.
● respondedOn: A timestamp indicating when the API response was returned.
Format: ISO 8601.
● response: An object containing the main data for the ServiceList API
response.
● statusCode: A string indicating the HTTP status code of the response
(e.g., “200 OK”).
● success: A boolean indicating whether the API request was successful
(true or false).
● error: An optional object providing error details if the request failed.
● info: An optional array of strings providing additional informational
messages.
Response Object
● traceId: A unique identifier that tracks this specific ServiceList API
request.
● addonOffers: An array containing details of available ancillary add-on
services (meals and baggage) for each flight segment.
● errorInfo: An object providing error details, if any occurred during
processing.
addonOffers Object
● twoOnewayIndex: A string differentiating segments in multi-leg journeys
(e.g., outbound/inbound).

● offerId: The identifier of the flight offer for which the ancillary
services are being retrieved.
● mealAddOns: An array containing meal options for the corresponding flight
segment.
● baggageAddOns: An array containing baggage options for the corresponding
flight segment.
mealAddOns Object
● departure: Departure airport code of the flight segment.
● arrival: Arrival airport code of the flight segment.
● mealServices: An array of available meal service options for this
segment.
mealServices Object
● serviceId: Unique identifier for the meal service. This must be passed in
the OrderSell and OrderCreate request when booking with selected meals.
● amount: Price of the meal service.
● currency: Currency code of the amount (e.g., BDT, USD).
● description: Description of the meal service.
● mealName: Display name of the meal (e.g., “Vegetarian Meal,” “Seafood
Meal”).
baggageAddOns Object
● departure: Departure airport code of the flight segment.
● arrival: Arrival airport code of the flight segment.
● baggageServices: An array of available baggage add-on services for this
segment.
baggageServices Object
● serviceId: Unique identifier for the baggage service. This must be passed
in the OrderSell and OrderCreate request when booking with extra baggage.
● amount: Price of the baggage add-on.
● currency: Currency code of the amount (e.g., BDT, USD).
● description: Description of the baggage add-on (e.g., “Extra 10 KG,”
“Priority Handling”).
Order Sell: The OrderSell API is also a repricing api like OfferPrice to
validate price or booking class changes before booking (after entering all the
information in the booking screen/page and clicking on book button). If changes
exist, prompt the user for approval; otherwise, proceed with booking.
● URL: base_url/ordersell
● Method: POST

Request Fields:
● traceId (string): traceId is a unique identifier per search and it will
be used for tracking/validation purposes.
● offerId (string array): The offerId is an array of strings, similar to
the OfferPrice API request, with an important distinction for domestic
return flights when the preferCombine parameter is set to false. In such
cases, the search results will include flights in two separate arrays:
one for outbound/onward and another for inbound/return. This may require
passing two offerIds in the OfferPrice request. Based on the response
from the OfferPrice API, if both the onward and return flights are
operated by the same airline, a single combined offerId will be provided,
which should be used in the OrderSell API request. When preferCombine is
true for domestic return, that time also a new offerId will be provided
as the same airlines will be combined. However, if the onward and return
flights are operated by different airlines, the OfferPrice API will
return the same separate offerIds as initially passed. To ensure accurate
validation and compliance with the booking process, it is recommended to
always use the offerId provided in the OfferPrice API response when
making the OrderSell API request.
● contactInfo (object):
Provides the contact details for the booking.
○ phone (object):
■ phoneNumber (string): The primary phone number for contact.
Country code should not be passed here.
■ countryDialingCode (string): The dialing code of the country
(e.g., "880" for Bangladesh).
○ emailAddress (string):
The email address of the primary contact.
● paxList (array of objects):
Contains details about the passengers included in the booking.
○ ptc (string): Passenger type code (e.g., "Adult", "Child",
"Infant").
○ individual (object): Details about the individual passenger.
■ givenName (string): The first name of the passenger.
■ surname (string): The last name of the passenger.
■ gender (string): The gender of the passenger (e.g., "Male",
"Female").
■ birthdate (date): The passenger’s birthdate in the format
YYYY-MM-DD.
■ nationality (string): The nationality code (ISO 3166-1
alpha-2 format, e.g., "BD").
■ identityDoc (object): Identity document details. If
passportRequired is true in offerPrice API response then use
this object to pass passport details else ignore.
■ identityDocType (string): Type of document (e.g.,
"Passport").
■ identityDocID (string): The document/passport number.
■ expiryDate (date): Expiry date of the document/passport
in YYYY-MM-DD format.
■ associatePax (object):
Provides the associated Adult passenger information for each
Infant passenger. For example if you have 2 adults and 2
infants then provide associated adults first name and last
name for each infant. Please note that One adult can not have
two infants associated. So the number of adults and infants
should be the same if infants are added.
■ givenName (string): First name of the associated adult.
■ surname (string): Last name of the associated adult.
○ sellSSR (array of objects):
Special Service Requests (SSRs) for each passenger (Optional).
■ SSR Object:
■ ssrRemark (string): Optional remarks or notes related
to the SSR.
■ ssrCode (string): The SSR code (e.g., "WCHR").
■ loyaltyProgramAccount (object):
Frequent flyer or loyalty program details.
■ airlineDesigCode (string): The airline code for
the loyalty program.
■ accountNumber (string): The loyalty program
account number.
○ travelerAddOnService (object):
Contains optional add-on services selected by the traveler, such as
additional baggage, meals, and seat selection.
■ travelerAddOnServiceBaggage (array of objects):
■ serviceId (string): The unique service ID of the
selected baggage add-on. This value should be taken
from the baggageServices array in the /ServiceList API
response.
Each entry corresponds to a specific baggage option
chosen for the traveler (e.g., additional 10kg or
20kg).
■ travelerAddOnServiceMeal (array of objects):
■ serviceId (string): The unique service ID of the
selected meal option. This ID is found in the
mealServices array of the /ServiceList API response.
Each passenger can have one or more meal selections
depending on availability.
■ travelerAddOnServiceSeat (array of objects):
■ serviceId (string): The unique service ID representing
the selected seat. This value must be obtained from the
/SeatAvailability API response.
If multiple legs exist, separate seat IDs should be
passed for each leg based on the chosen seats.
Request Sample:
{
"TraceId": "string",
"OfferId": [
"string"
],
"request": {
"contactInfo": {
"phone": {
"phoneNumber": "1234567890",
"countryDialingCode": "880"
},
"emailAddress": "shajedul@bdfare.com"
},
"paxList": [
{
"ptc": "Adult",
"individual": {
"givenName": "Shajedul",
"surname": "Islam",
"gender": "Male",
"birthdate": "1992-01-21",
"nationality": "BD",
"identityDoc": {
"identityDocType": "Passport",
"identityDocID": "12345678",
"expiryDate": "2035-01-01"
}
},
"sellSSR": [
{
"ssrRemark": "Testing Wheelchair",
"ssrCode": "WCHR"
},
{
"ssrRemark": "Testing vvip",
"ssrCode": "VVIP"
},
{
"ssrRemark": "Testing Maas",
"ssrCode": "MAAS"
},
{
"ssrRemark": null,
"ssrCode": "FQTV",
"loyaltyProgramAccount": {
"airlineDesigCode": "BG",
"accountNumber": "1234567"
}
}
],
"travelerAddOnService": {
"travelerAddOnServiceBaggage": [
{
"serviceId": "fMvys5G0qwqdqwdqwewewewe"
}
],
"travelerAddOnServiceMeal": [
{
"serviceId": "CQ6OlGRofIt4qu16wgbnR8SrS2WebA61ID"
}
],
"travelerAddOnServiceSeat": [
{
"serviceId": "gQSvwnP0ku48treYlHihOPYvpGyV5k2IZ-"
}
]
}
},
{
"ptc": "Infant",
"individual": {
"givenName": "Qazi",
"surname": "Fariha",
"gender": "Female",
"birthdate": "2024-01-11",
"nationality": "BD",
"identityDoc": {
"identityDocType": "Passport",
"identityDocID": "12345678",
"expiryDate": "2035-01-01"
},
"associatePax": {
"givenName": "Shajedul",
"surname": "Islam"
}
}
}
]
}
}

Response Fields:
The OrderSell API response is the same as OfferPrice API response. Please check
details of OfferPrice API response and follow accordingly.
Order Create: The OrderCreate API is used for booking a flight, which refers
to holding a seat rather than completing the booking process. It is important
to note that booking a flight through this API is not the final step; you must
issue or confirm the booking later to finalize it. If the booking is
successful, the response will include key details such as the PNR (Passenger
Name Record), which serves as the unique reference for the booking, the Bdfare
Order Reference Number generated by the system, and the status, which will be
"OnHold" to indicate that the seat has been successfully held. However, if
there are any issues during the booking process with the supplier, the status
may be returned as Pending. In such cases, our operations team will manually
review and confirm the booking, provided there are no unresolved issues.
Another case is if the fare type is Web then this api will try to issue the
flight directly instead of booking as we mentioned previously, Web type flights
can not be booked. Instant purchase required for that. For instant purchase no
further api call required for confirmation.
● URL: base_url/ordercreate
● Method: POST
Request Fields:
The OrderCreate API request body is identical to the OrderSell API request
body. Please refer to the details of the OrderSell API request body for
guidance. Note that after calling the OrderSell API, if no changes are
detected, you must proceed by calling the OrderCreate API.
Response Fields:
Root Object
● Message: string
A descriptive message about the response.
● requestedOn: string (timestamp)
The timestamp when the request was made.
● respondedOn: string (timestamp)
The timestamp when the response was sent.
Example: 2024-11-28T06:38:04.385Z
● response: Object
The main response object contains detailed data about the order and
flight information.
● statusCode:
string
The status code of the response.
● success: boolean
Indicates if the request was successful.
Example: true
● error:
Object (optional)
Contains error details if the request was not successful.
Response Object
● traceId: string
A unique identifier for tracking the request/response.
Example: string
● orderReference: string
A reference identifier for the order.
Example: BDF2401123
● paymentTimeLimit: timestamp
The payment time limit for the order.
Example: 2024-02-02T15:30:00
● orderItem: Array of OrderItem Objects
List of order items, which contain flight details and other associated
information.
● paxList: Array of Passenger Objects.
● orderStatus: string
Current status of the order (e.g., OnHold, Pending, InProgress,
Confirmed, UnConfirmed).
Example: "OnHold"
● orderChangeInfo: Object
Information about changes to the order.
● partialPaymentInfo: Object
Details about the partial payment for the order.
● exchangeDetails: Object
Details about exchanged orders.
● statusCode: string
Status code indicating the result of the API call (e.g., "Success",
"Error").
Example: "Success"
● success: boolean
Indicates whether the operation was successful.
Example: true
● error: Object
Details about any errors encountered during the API call.
OrderItem Object
● validatingCarrier:
string
The carrier validates the flight.
Example: BG
● refundable:
boolean
Indicates if the order is refundable.
Example: true
● fareType:
string
The fare type of the flight.
Example: OnHold

Order Object Fields
paxSegmentList

Type: Array of PaxSegmentObject
Description: List of passenger segments in the flight.

fareDetailList

Type: Array of FareDetailObject
Description: List of fare details for the order.

price

Type: PriceObject
Description: Price details for the order.

penalty

Type: PenaltyObject
Description: Penalty details for refunds or exchanges.

baggageAllowanceList

Type: Array of BaggageAllowanceObject
Description: List of baggage allowances for the order.

PaxSegmentObject
departure

Type: DepartureObject
Description: Details of the departure location and time.

arrival

Type: ArrivalObject
Description: Details of the arrival location and time.

marketingCarrierInfo

Type: MarketingCarrierInfoObject
Description: Details of the marketing carrier.

operatingCarrierInfo

Type: OperatingCarrierInfoObject
Description: Details of the operating carrier.

iatA_AircraftType

Type: AircraftTypeObject
Description: Details of the aircraft type.

rbd

Type: string
Description: Booking class code.
Example: L

flightNumber

Type: number
Description: Flight number.
Example: 123

segmentGroup

Type: number
Description: Segment group number.
Example: 0

returnJourney

Type: boolean
Description: Indicates whether this segment is part of a return journey.
Example: true

airlinePNR

Type: string
Description: Airline’s Passenger Name Record (PNR).
Example: ABCDEF

● technicalStopOver:
Array of TechnicalStopOver Objects
List of technical stopovers for the flight.
● duration:
number
The duration of the flight segment in minutes.
Example: 120
● cabinType:
string
The type of cabin (e.g., Economy).
Example: Economy
Departure Object
● iatA_LocationCode:
string
Airport code for the departure location.
Example: DAC
● terminalName:
string
Terminal name for the departure.
Example: A
● aircraftScheduledDateTime:
timestamp
Scheduled departure time.
Example: 2024-11-28T06:38:04.385Z
Arrival Object
● iatA_LocationCode:
string
Airport code for the arrival location.
Example: DAC
● terminalName:
string
Terminal name for the arrival.
Example: A
● aircraftScheduledDateTime:
timestamp
Scheduled arrival time.
Example: 2024-11-28T06:38:04.385Z
MarketingCarrierInfo Object
● carrierDesigCode:
string
Carrier designator code.
Example: BS
● marketingCarrierFlightNumber:
number
The flight number of the marketing carrier.
Example: 123
● carrierName:
string
The name of the marketing carrier.
Example: US Bangla
OperatingCarrierInfo Object
● carrierDesigCode:
string
Carrier designator code.
Example: BS
● carrierName:
string
The name of the operating carrier.
Example: US Bangla
AircraftType Object
● iatA_AircraftTypeCode:
string
The code of the aircraft type.
Example: A320
TechnicalStopOver Object
● iatA_LocationCode:
string
Airport code for the stopover location.
Example: DAC
● aircraftScheduledArrivalDateTime:
timestamp
Scheduled arrival time for the stopover.
Example: 2024-02-15T13:01:00
● aircraftScheduledDepartureDateTime:
timestamp
Scheduled departure time for the stopover.
Example: 2024-02-15T14:01:00
● arrivalTerminalName:
string
Terminal name for the arrival during stopover.
Example: 1
● departureTerminalName:
string
Terminal name for the departure during stopover.
Example: 1
FareDetail Object
● baseFare:
number
The base fare of the flight.
Example: 5000
● tax:
number
The tax applied on the fare.
Example: 2000
● otherFee:
number
Other fees associated with the fare.
Example: 0
● discount:
number
The discount applied to the fare.
Example: 500
● vat:
number
The VAT applied to the fare.
Example: 0
● currency:
string
The currency in which the fare is quoted.
Example: BDT
● paxType:
string
The type of passenger (e.g., Adult).
Example: ADT
● paxCount:
number
The number of passengers for this fare type.
Example: 2
● subTotal:
number
The subtotal before applying discounts or taxes.
Example: 12000
Price Object
● totalPayable:
TotalPayable Object
The total amount to be paid for the order.
● gross
Gross Object
The gross fare without any discount.
● discount:
Discount Object
The discount applied to the total fare.
● totalVAT:
TotalVAT Object
The total VAT applied to the fare.
TotalPayable Object
● total:
number
The total amount payable.
Example: 12000
● currency:
string
The currency for the total payable amount.
Example: BDT
Gross Object
● total:
number
The gross fare.
Example: 12000
● currency:
string
The currency for the gross fare.
Example: BDT
Discount Object
● total:
number
The total discount.
Example: 12000
● currency:
string
The currency for the discount.
Example: BDT
TotalVAT Object
● total:
number
The total VAT.
Example: 12000
● currency:
string
The currency for the VAT amount.
Example: BDT
Penalty Object
● refundPenaltyList:
Array of RefundPenalty Objects
List of refund penalties.
● exchangePenaltyList:
Array of ExchangePenalty Objects
List of exchange penalties.
RefundPenalty Object
● departure:
string
The departure location for the penalty.
Example: DAC
● arrival:
string
The arrival location for the penalty.
Example: DXB
● penaltyInfoList:
Array of PenaltyInfo Objects
List of penalty information.
PenaltyInfo Object
● type:
string
The type of penalty.
Example: Before or after
● textInfoList:
Array of TextInfo Objects
List of text information describing the penalty.
TextInfo Object
● paxType:
string
The type of passenger for the penalty.
Example: Adult
● info:
Array of strings
Detailed information about the penalty.
Example: ["string"]
ExchangePenalty Object
● Same structure as RefundPenalty Object.
BaggageAllowance Object
● departure:
string
The departure location for the baggage allowance.
Example: DAC
● arrival:
string
The arrival location for the baggage allowance.
Example: DXB
● checkIn:
Array of CheckIn Objects
List of check-in baggage allowances.
● cabin:
Array of Cabin Objects
List of cabin baggage allowances.
CheckIn Object
● paxType:
string
The type of passenger for the check-in allowance.
Example: Adult
● allowance:
string
The baggage allowance for check-in.
Example: 10Kg
Cabin Object
● paxType:
string
The type of passenger for the cabin allowance.
Example: Adult
● allowance:
string
The baggage allowance for the cabin.
Example: 5Kg
● upSellBrandList:
Array of UpSellBrand Objects
List of upsell brand options available for the flight.
PaxList Object
● ptc:
string
Passenger Type Code (e.g., "Adult", "Child", "Infant").
Example: "Adult"
● individual:
Object
Detailed information about the passenger.
● orderSSR:
Array of OrderSSR Objects
Special service requests for the passenger.
● travelerAddOns:
Array of objects
Lists ancillary services (add-ons) confirmed during booking. This section
displays the optional extras selected by each passenger, such as seats,
meals, or baggage purchased during the order creation process.
Individual Object:
● title: string
Title of the passenger.
Example: "Mr"
● givenName: string
Passenger's first name.
Example: "John"
● surname: string
Passenger's last name.
Example: "Wick"
● gender: string
Gender of the passenger.
Example: "Male"
● birthdate: string (ISO 8601 date format)
Passenger's date of birth.
Example: "1978-12-21"
● nationality: string
Nationality of the passenger.
Example: "BD"
● identityDoc: Object
Details of the passenger's identity document.
● associatePax: Object
Passenger association details (for linked travelers).
● ticketDocument: Array of TicketDocument Objects
List of tickets associated with the passenger.
IdentityDoc Object:
● identityDocType: string
Type of identity document (e.g., Passport).
Example: "Passport"
● identityDocID: string
Document identification number.
Example: "PP123456"
● issuingCountryCode: string
Country code of the issuing country.
Example: "BD"
● expiryDate: string (ISO 8601 date format)
Expiry date of the document.
Example: "2025-12-31"
AssociatePax Object:
● givenName: string
Associated passenger's first name.
Example: "John"
● surname: string
Associated passenger's last name.
Example: "Wick"
TicketDocument Object:
● ticketDocNbr: string
Ticket document number.
Example: "17452876502/11651659816"
OrderSSR Object:
● ssrCode: string
Special Service Request code (e.g., WCHR for wheelchair).
Example: "WCHR"
● ssrRemark: string
Remarks related to the SSR.
Example: ""
● ssrStatus: string
Status of the SSR.
Example: "HK”
TravelerAddOns Object
● addOnType (string): Specifies the type of add-on selected by the
passenger. Possible values include: None, Baggage, Meal, TravelServices,
Seat, Insurance.
● departure (string): The IATA code of the departure airport for which the
add-on applies (e.g., “DAC”).
● arrival (string): The IATA code of the arrival airport for which the
add-on applies (e.g., “DXB”).
● description (string): A human-readable description of the add-on service.
For example, “Extra Baggage 20Kg” or “Vegetarian Meal.”
● mealName (string): Specifies the selected meal name if the add-on type is
Meal (e.g., “Chicken Curry Meal”).
● seatNumber (string): Displays the reserved seat number if the add-on type
is Seat (e.g., “12A”).
ContactDetail Object
● phoneNumber: string
Contact phone number.
Example: "880-1234567"
● emailAddress: string
Contact email address.
Example: "xyz@abc.com"
PartialPaymentInfo Object
● totalPayableAmount: number
Total payable amount for the order.
Example: 25000
● minimumPayableAmount: number
Minimum payment required.
Example: 12000
● paidAmount: number
Amount already paid.
Example: 12000
● dueAmount: number
Remaining due amount.
Example: 13000
● currency: string
Currency of the payment.
Example: "BDT"
● dueDate: string (ISO 8601 date format)
Due date for the remaining payment.
Example: "2024-02-23T14:20:00"
ExchangeDetails Object
● orderReference: Array of strings
List of order references related to the exchange.
Example: ["string"]
Error Object:
● errorCode: string
Code representing the specific error.
Example: "string"
● errorMessage: string
A descriptive message for the error.
Example: "string"
Order Reshop Price: The OrderReshopPrice API is also a repricing api like
OfferPrice and OrderSell to validate price or booking class changes before
calling OrderChange API for issuing/confirming (after booking). If changes
exist, prompt the user for approval; otherwise, proceed with issuing.
● URL: base_url/orderreshopprice
● Method: POST
Request Fields:
● orderReference (string): orderReference is a unique identifier per
booking generated by bdfare while booking. Pass the reference number here
to call OrderReshopPrice api endpoint.
Response Fields:
The OrderReshopPrice API response is the same as OrderCreate API response.
Please check details of OrderCreate API response and follow accordingly. Make
sure to check orderChangeInfo object for any changes in price or booking class.
Order Change: The OrderChange API allows you to confirm or issue a booked
flight. Upon successful confirmation, the response will return an order status
of Confirmed. However, if there are any issues during the confirmation process
with the supplier, the status may be returned as InProgress. In such cases, our
operations team will manually review and issue the flight, provided there are
no unresolved issues. You may get Unknown or Unconfirmed while trying to issue
a flight because of several reasons from suppliers.
● URL: base_url/orderchange
● Method: POST
Request Fields:
● orderReference (string): orderReference is a unique identifier per
booking generated by bdfare while booking. Pass the reference number here
to call OrderChange api endpoint.
● issueTicketViaPartialPayment(boolean): Pass true if you want to issue the
flight by paying us partially. Pass false for full payment. To know about
the partial payment amount for a flight you can check OrderRetrieve API.
If you are eligible to pay partially for a flight you will get partial
payment info details in OrderRetrieve API response. If null then not
eligible.
Response Fields:
The OrderChange API response is the same as OrderCreate or OrderReshopPrice API
response but here on this api response you will get ticket numbers for each
passenger if the order status is Confirmed. Please check details of OrderCreate
or OrderReshopPrice API response and follow accordingly.
Order Retrieve: The OrderRetrieve API provides comprehensive details of a
booking, regardless of its status booked, issued, or failed. Once a booking
attempt is made and a bdfare order reference number is generated, you can
retrieve the booking details at any time using this reference number.
● URL: base_url/orderretrieve
● Method: POST
Request Fields:
● orderReference (string): orderReference is a unique identifier per
booking generated by bdfare while booking. Pass the reference number here
to call OrderRetrieve api endpoint.
Response Fields:
The OrderRetrieve API response is identical to the OrderCreate or
OrderReshopPrice API response. However, in this API response, you will also
receive ticket numbers for each passenger if the order status is 'Confirmed'.
For detailed field information, please refer to the response details of the
OrderCreate or OrderReshopPrice API.
Order Cancel: The OrderCancel API enables you to cancel a booking. A booking
can only be canceled if its status is 'OnHold'.
● URL: base_url/ordercancel
● Method: POST
Request Fields:
● orderReference (string): orderReference is a unique identifier per
booking generated by bdfare while booking. Pass the reference number here
to call OrderCancel api endpoint.
Response Fields:
The OrderCancel API response is identical to the OrderCreate, OrderReshopPrice,
or OrderRetrieve API responses. For a successful cancellation, you only need to
check the orderStatus, which should appear as Cancelled. If any issues occur,
the error object will provide the necessary details.

Bdfare Enterprise API FAQ

Q1. What is Special Return (Domestic Return)?
A domestic return is a round trip between two airports within the same country.
We call it a special return when we provide onward and return flights in two separate arrays, so
users can freely select different airlines for each leg—or the same airline for both.
● If you pass preferCombine = true in the AirShopping API request body:
○ Flights will not come separately.
○ Results will be combined airline-wise and appear inside the offersGroup object, like
other trip types.
● If you pass preferCombine = false:
○ Flights will be returned in two separate arrays:
■ OB → outbound flights
■ IB → inbound flights
○ These are provided inside the specialReturnOfferGroup.


Q2. What are the Repricing APIs?
When a passenger searches flights via AirShopping, they receive a list of offers. However, fares may
change as time passes.
Therefore, at each step until issuing/confirming a ticket, you should use repricing APIs to check for
fare or booking-class changes.
✅ Repricing API 1 – OfferPrice (before booking page)
● When the passenger clicks Book Now on the flight result page/screen:
○ Call the OfferPrice API to check for any changes.
● Check the OfferChangeInfo field in the response:
○ Possible values:
■ Both
■ Price
■ BookingClass
■ or the object OfferChangeInfo may be null If no changes.
● If there’s a change, display a prompt asking the user if they’d like to continue despite the
changes.
✅ Repricing API 2 – OrderSell (after entering passenger details)
● Before pressing Book Now on the booking screen (after entering all passenger details):
○ Call the OrderSell API to check again for changes.
● Check OfferChangeInfo and prompt the passenger if necessary.
Keep in mind: even if there are no changes, you must call the next API endpoint (the
booking API).

✅ Repricing API 3 – OrderReshopPrice (after booking, before issuing/confirming flight)
● Sometimes a passenger books a flight (i.e. puts it on hold), but the fare or booking class can
still change until the flight is confirmed or issued.
● If the user chooses to confirm or issue the ticket later (e.g. the next day), fares might have
changed during the hold period.
● Call OrderReshopPrice before final confirmation to check for changes, just like the previous
repricing APIs.
● Prompt the user if any changes are found.

Q3. What is Instant Purchase?
Not all flights can be booked and held. Some flights require instant purchase.
The AirShopping response includes the FareType field for each flight (offer), indicating:
● OnHold → You can book and hold the flight. Payment and ticket issuance can happen later.
Here, “booking” means placing the flight on hold (not yet issued).
● Web → Instant purchase only. You must pay immediately, and the flight is issued/confirmed.
Q4. What are the Order Statuses?
The OrderStatus field tracks the status of a flight order. Possible values include:
● OnHold → A seat has been successfully reserved, but the price or booking class may still
change.
● Pending → Status while attempting to book.
○ If there are issues during booking, this status appears.
○ Our operations team checks such cases and updates the status:
■ To OnHold if successful (within 2-10 minutes).
■ To Unconfirmed if not successful.

● In Progress → Similar to Pending, but this occurs while trying to confirm/issue a ticket.
○ Our team investigates and updates the status:
■ To Confirmed if successful.
■ Or to Unconfirmed if issues remain.
● Unconfirmed / Unknown → Problems during booking or issuing, e.g. supplier issues,
duplicate passengers, etc.
● Confirmed → Flight is issued, purchased, and confirmed.
● Canceled → The user can cancel a booking if the flight is still on hold.
● Expired → All bookings have a time limit. Flights must be issued before expiry, or they
become expired.
Note: An auto-scheduler cancels bookings one minute before expiry. API clients should
implement their own expiry checker as well, because a penalty may be applied in some
cases if a booking expires.
Q5. What is SellSSR and how can it be used while booking?
SSR means Special Service Requests.
● For each flight in your results, if SSRs are available, you’ll find a list in the OfferPrice API
response.
● You can show this list to users so they can select services if needed.
● If you don’t wish to provide this feature, you can simply ignore SSRs.
● Important: You cannot randomly request any SSR. Only those provided for that specific flight
can be used.
✅ Available SSR Codes:
● WCHR → Wheelchair Assistance
● VIP → Very Important Person
● VVIP → Very Very Important Person
● CIP → Commercially Important Person
● MAAS → Meet and Greet Service

● FQTV → Frequent Flyer
How to send SSR data:
You must pass SSR details in OrderSell and OrderCreate API requests.
✅ Example 1 – Wheelchair Request:
"sellSSR": [
{
"ssrRemark": "Testing Wheelchair",
"ssrCode": "WCHR"
}
]
✅ Example 2 – Frequent Flyer / Loyalty Program:
"sellSSR": [
{
"ssrRemark": null,
"ssrCode": "FQTV",
"loyaltyProgramAccount": {
"airlineDesigCode": "BG",
"accountNumber": "1234567"
}
}
]
Q6. Where are the Cancellation, Date Change Rules?
These rules are found in the MiniRule, OfferPrice and further API response.
Q7. What is an API Certificate Test Case?
API certificate test cases are used to verify your system integration and API behavior.
● Total test cases: 9 (Test Case 9 is optional for B2C integrations).
● For each case:
○ Execute all APIs in the flow.
○ Save request and response payloads with clear names, e.g.:
■ AirShopping_request.json
■ AirShopping_response.json
Once development is complete, submit these test cases to us for verification.
Q8. What are Multicity and OpenJaw in Test Cases?
● Multicity → Trip type set to circle in the AirShopping request.
OpenJaw → Example:
Outbound: DAC → JED
Return: MED → DAC
● In this case, the passenger travels between JED and MED via other means.
