# Opay-Style Features API Documentation

This document outlines all the new endpoints and features implemented for the Opay-style VTU platform.

## Table of Contents

1. [KYC (Know Your Customer) Endpoints](#kyc-endpoints)
2. [Banners Endpoints](#banners-endpoints)
3. [VTU Product Endpoints](#vtu-product-endpoints)
4. [Transaction PIN Endpoints](#transaction-pin-endpoints)
5. [Card Management Endpoints](#card-management-endpoints)
6. [Wallet Funding Endpoints](#wallet-funding-endpoints)
7. [File Upload Endpoint](#file-upload-endpoint)

---

## KYC Endpoints

### Submit KYC
**POST** `/api/kyc/submit`

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "personal": {
    "fullName": "John Doe",
    "dateOfBirth": "1990-01-01",
    "address": "123 Main St, Lagos",
    "idNumber": "12345678901",
    "nationality": "Nigeria",
    "phoneNumber": "08012345678",
    "state": "Lagos",
    "city": "Ikeja"
  },
  "documents": [
    {
      "type": "id_front",
      "url": "/uploads/abc123.jpg",
      "filename": "id_front.jpg"
    },
    {
      "type": "id_back",
      "url": "/uploads/def456.jpg",
      "filename": "id_back.jpg"
    },
    {
      "type": "selfie",
      "url": "/uploads/ghi789.jpg",
      "filename": "selfie.jpg"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "KYC submitted successfully and is under review",
  "data": {
    "status": "pending",
    "submittedAt": "2025-10-19T10:00:00.000Z"
  }
}
```

---

### Get KYC Status
**GET** `/api/kyc/status`

**Authentication:** Required (JWT)

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "pending",
    "submittedAt": "2025-10-19T10:00:00.000Z",
    "reviewedAt": null,
    "rejectionReason": null,
    "personal": {
      "fullName": "John Doe",
      "dateOfBirth": "1990-01-01",
      ...
    }
  }
}
```

---

### List Pending KYC (Admin)
**GET** `/api/kyc/admin/list?status=pending&page=1&limit=20`

**Authentication:** Admin only

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

---

### Approve KYC (Admin)
**POST** `/api/kyc/admin/:userId/approve`

**Request Body:**
```json
{
  "notes": "All documents verified"
}
```

---

### Reject KYC (Admin)
**POST** `/api/kyc/admin/:userId/reject`

**Request Body:**
```json
{
  "reason": "ID document unclear",
  "notes": "Please resubmit with clearer image"
}
```

---

## Banners Endpoints

### Get Active Banners
**GET** `/api/banners?section=home`

**Authentication:** Not required

**Query Parameters:**
- `section` (optional): Filter by section (home, airtime, data, electricity, cable, wallet)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Special Promo",
      "mediaType": "image",
      "mediaUrl": "https://example.com/banner.jpg",
      "targetUrl": "https://example.com/promo",
      "targetSection": ["home", "airtime"],
      "weight": 10,
      "isActive": true
    }
  ]
}
```

---

### Create Banner (Admin)
**POST** `/api/banners/admin`

**Authentication:** Admin only

**Request Body:**
```json
{
  "title": "New Promo",
  "description": "Get 10% off",
  "mediaType": "image",
  "mediaUrl": "https://example.com/promo.jpg",
  "targetUrl": "https://example.com/offer",
  "targetSection": ["home", "airtime"],
  "weight": 5,
  "activeFrom": "2025-10-19T00:00:00.000Z",
  "activeTo": "2025-10-31T23:59:59.000Z",
  "isActive": true
}
```

---

### Update Banner (Admin)
**PUT** `/api/banners/admin/:bannerId`

---

### Delete Banner (Admin)
**DELETE** `/api/banners/admin/:bannerId`

---

## VTU Product Endpoints

### Get Products
**GET** `/api/vtu/products?type=airtime&network=MTN&category=general`

**Query Parameters:**
- `type`: airtime, data, electricity, cable
- `network`: MTN, GLO, AIRTEL, 9MOBILE
- `category`: general, bundle, etc.
- `search`: Search term
- `popular`: true/false

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [...],
    "grouped": {
      "general": [...],
      "bundle": [...]
    },
    "total": 50
  }
}
```

---

### Detect Phone Network
**POST** `/api/vtu/phone/detect`

**Request Body:**
```json
{
  "phone": "08012345678"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "network": "MTN",
    "normalized": "+2348012345678",
    "local": "08012345678",
    "valid": true
  }
}
```

---

### Create Product (Admin)
**POST** `/api/vtu/admin/products`

**Request Body:**
```json
{
  "title": "MTN 100 Airtime",
  "type": "airtime",
  "network": "MTN",
  "category": "general",
  "denomination": 100,
  "price": 98,
  "vendorCode": "VTU_MTN_100",
  "vendor": "vtpass",
  "description": "MTN ₦100 Airtime",
  "validity": "Instant",
  "commission": 2,
  "isActive": true,
  "isPopular": false,
  "displayOrder": 0
}
```

---

## Transaction PIN Endpoints

### Setup PIN
**POST** `/api/pin/setup`

**Authentication:** Required

**Request Body:**
```json
{
  "pin": "1234",
  "confirmPin": "1234"
}
```

---

### Verify PIN
**POST** `/api/pin/verify`

**Request Body:**
```json
{
  "pin": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "message": "PIN verified successfully"
}
```

---

### Change PIN
**POST** `/api/pin/change`

**Request Body:**
```json
{
  "currentPin": "1234",
  "newPin": "5678",
  "confirmNewPin": "5678"
}
```

---

### Get PIN Status
**GET** `/api/pin/status`

**Response:**
```json
{
  "success": true,
  "data": {
    "isPinSet": true,
    "lastChanged": "2025-10-19T10:00:00.000Z",
    "biometricEnabled": false,
    "isLocked": false
  }
}
```

---

### Toggle Biometric
**POST** `/api/pin/biometric/toggle`

**Request Body:**
```json
{
  "enabled": true
}
```

---

## Card Management Endpoints

### Get User Cards
**GET** `/api/cards`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "cardId": "...",
      "last4": "4242",
      "brand": "visa",
      "expiryMonth": "12",
      "expiryYear": "2025",
      "cardholderName": "JOHN DOE",
      "isDefault": true,
      "createdAt": "2025-10-19T10:00:00.000Z"
    }
  ]
}
```

---

### Save Card
**POST** `/api/cards`

**Request Body:**
```json
{
  "cardToken": "card_token_from_monnify",
  "last4": "4242",
  "brand": "visa",
  "expiryMonth": "12",
  "expiryYear": "2025",
  "cardholderName": "JOHN DOE",
  "bin": "424242",
  "monnifyCardReference": "ref_123",
  "isDefault": false
}
```

---

### Delete Card
**DELETE** `/api/cards/:cardId`

**Authentication:** Required + Transaction PIN

**Request Body:**
```json
{
  "transactionPin": "1234"
}
```

---

### Set Default Card
**PUT** `/api/cards/:cardId/default`

---

### Get Card Token (For Charging)
**GET** `/api/cards/:cardId/token`

**Authentication:** Required + Transaction PIN

**Request Body:**
```json
{
  "transactionPin": "1234"
}
```

---

## Wallet Funding Endpoints

### Initialize Wallet Funding
**POST** `/api/wallet/funding/initialize`

**Authentication:** Required

**Request Body:**
```json
{
  "amount": 5000,
  "saveCard": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment initialization successful",
  "data": {
    "transactionId": "...",
    "paymentReference": "WF-1729334400000-abc12345",
    "monnifyReference": "MNFY|...",
    "checkoutUrl": "https://sandbox.monnify.com/checkout/...",
    "amount": 5000
  }
}
```

---

### Verify Wallet Funding
**POST** `/api/wallet/funding/verify`

**Request Body:**
```json
{
  "paymentReference": "WF-1729334400000-abc12345"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "status": "completed",
    "amount": 5000,
    "newBalance": 15000,
    "transactionId": "..."
  }
}
```

---

### Monnify Webhook
**POST** `/api/wallet/funding/webhook`

**Authentication:** Verified via Monnify signature

**Note:** This endpoint is called by Monnify to notify successful payments.

---

### Save Card After Payment
**POST** `/api/wallet/funding/save-card`

**Request Body:**
```json
{
  "paymentReference": "WF-1729334400000-abc12345",
  "cardDetails": {
    "cardToken": "token_from_monnify",
    "last4": "4242",
    "brand": "visa",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cardholderName": "JOHN DOE",
    "bin": "424242"
  }
}
```

---

## File Upload Endpoint

### Upload File
**POST** `/api/uploads`

**Authentication:** Required

**Request Body:**
```json
{
  "file": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "filename": "id_front.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "url": "/uploads/abc123def456.jpg",
    "filename": "abc123def456.jpg",
    "originalFilename": "id_front.jpg",
    "size": 245678,
    "uploadedAt": "2025-10-19T10:00:00.000Z"
  }
}
```

**File Constraints:**
- Maximum size: 5MB
- Allowed types: .jpg, .jpeg, .png, .pdf, .gif
- Files are stored in `backend/uploads/` directory
- Accessible via `/uploads/{filename}`

---

## Security Features

1. **JWT Authentication:** Most endpoints require valid JWT tokens
2. **Admin Protection:** Admin routes protected with `isAdmin` middleware
3. **PIN Protection:** Sensitive operations require transaction PIN verification
4. **Rate Limiting:** Auth endpoints limited to 10 requests per 15 minutes
5. **PIN Lockout:** 3 failed PIN attempts locks account for 15 minutes
6. **Webhook Verification:** Monnify webhooks verified with HMAC-SHA512 signature
7. **PCI Compliance:** No PAN or CVV stored; only card tokens and metadata

---

## Database Models

### User Extensions
- `kyc` object with status tracking
- `transactionPin` object with hashing and lockout
- `biometricEnabled` flag
- `savedCards` array of Card references

### New Models
- **Card:** Tokenized card storage
- **Banner:** Promotional banner management
- **VTUProduct:** VTU product catalog

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

Common HTTP status codes:
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

---

## Next Steps for Implementation

1. **Frontend Integration:** Connect React Native screens to these endpoints
2. **Monnify SDK:** Integrate Monnify payment SDK in mobile app
3. **Push Notifications:** Add real-time notifications for KYC status changes
4. **Analytics:** Track banner impressions and clicks
5. **Testing:** End-to-end testing of all workflows
