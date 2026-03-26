# Nexus Ultra — API Reference

Complete documentation for all backend API endpoints.

**Base URL:** `https://your-domain.com/api`

**Authentication:** Include Firebase ID token in `Authorization: Bearer <token>` header (optional for some endpoints).

---

## Content Generation

### POST /api/generate

Generate AI content using Claude.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <firebase-id-token>  (optional)
```

**Request Body:**
```json
{
  "prompt":      "Write a blog post about AI tools for creators",
  "contentType": "blog",
  "model":       "claude-3-5-sonnet-20241022",
  "tone":        "professional",
  "stream":      false,
  "maxTokens":   2048
}
```

**Fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `prompt` | string | ✅ | — | The generation prompt (max 10,000 chars) |
| `contentType` | string | ❌ | `"blog"` | Type: `blog`, `social`, `email`, `product`, `youtube`, `thread` |
| `model` | string | ❌ | `"claude-3-5-sonnet-20241022"` | AI model to use |
| `tone` | string | ❌ | `"professional"` | Writing tone |
| `stream` | boolean | ❌ | `false` | Enable SSE streaming |
| `maxTokens` | number | ❌ | `2048` | Max output tokens (up to 4096) |

**Response (stream: false):**
```json
{
  "content":     "# AI Tools for Creators in 2025\n\nArtificial intelligence...",
  "model":       "claude-3-5-sonnet-20241022",
  "contentType": "blog",
  "usage": {
    "input_tokens":  150,
    "output_tokens": 892
  }
}
```

**Response (stream: true):**  
Server-Sent Events stream:
```
data: {"delta": {"text": "# AI Tools"}}
data: {"delta": {"text": " for Creators"}}
data: [DONE]
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid prompt or model |
| 429 | USAGE_LIMIT_EXCEEDED | Monthly generation limit reached |
| 429 | RATE_LIMIT | Too many requests (100/hour per IP) |
| 500 | INTERNAL_ERROR | AI service error |

---

## Payment

### POST /api/payment/create-checkout-session

Create a Stripe checkout session for subscription.

**Request Body:**
```json
{
  "priceId":       "price_pro_monthly",
  "planId":        "pro",
  "userId":        "firebase-uid",
  "email":         "user@example.com",
  "billingPeriod": "monthly"
}
```

**Response:**
```json
{
  "id":  "cs_test_...",
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

---

### POST /api/payment/create-portal-session

Create a Stripe billing portal session for managing subscriptions.

**Request Body:**
```json
{
  "userId": "firebase-uid"
}
```

**Response:**
```json
{
  "url": "https://billing.stripe.com/session/..."
}
```

---

### POST /api/payment/webhook

Stripe webhook endpoint. **Do not call directly** — Stripe sends events here automatically.

**Headers:**
```
stripe-signature: t=...,v1=...
```

**Handled Events:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

## WhatsApp

### GET /api/whatsapp/webhook

WhatsApp webhook verification endpoint. Meta sends a GET request to verify the webhook.

**Query Parameters:**
```
hub.mode         = "subscribe"
hub.verify_token = "your_verify_token"
hub.challenge    = "challenge_string"
```

**Response:** Returns `hub.challenge` string on success.

---

### POST /api/whatsapp/webhook

Receives incoming WhatsApp messages. **Called by Meta/WhatsApp** — not for direct client use.

---

### POST /api/whatsapp/send-template

Send a WhatsApp template message to a user.

**Request Body:**
```json
{
  "to":           "+1234567890",
  "templateName": "welcome_message",
  "language":     "en_US",
  "parameters":   ["John", "https://nexultra.app"]
}
```

**Response:**
```json
{
  "messageId": "wamid.HBgLMTIzNDU2...",
  "status":    "sent"
}
```

---

### POST /api/whatsapp/leads

Capture a lead and optionally send a welcome WhatsApp message.

**Request Body:**
```json
{
  "name":     "John Doe",
  "phone":    "+1234567890",
  "email":    "john@example.com",
  "interest": "content-generation",
  "source":   "https://nexultra.app"
}
```

**Response:**
```json
{
  "success": true,
  "leadId":  "firestore-document-id"
}
```

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/generate` | 100 requests | 1 hour (per IP) |
| `/api/payment/*` | 50 requests | 1 hour |
| `/api/whatsapp/leads` | 10 requests | 1 hour |

---

## Error Response Format

All API errors follow this format:

```json
{
  "error":   "Human-readable error message",
  "code":    "MACHINE_READABLE_CODE",
  "details": {}
}
```

---

## Supported AI Models

| Model ID | Name | Speed | Quality |
|----------|------|-------|---------|
| `claude-3-5-sonnet-20241022` | Claude 3.5 Sonnet | Fast | ⭐⭐⭐⭐⭐ |
| `claude-3-haiku-20240307` | Claude 3 Haiku | Very Fast | ⭐⭐⭐⭐ |
| `claude-3-opus-20240229` | Claude 3 Opus | Slower | ⭐⭐⭐⭐⭐ |
