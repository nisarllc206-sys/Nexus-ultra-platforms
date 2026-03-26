# Nexus Ultra — Setup Guide

Complete guide to setting up the Nexus Ultra AI Creator Platform from scratch.

## Prerequisites

- **Node.js** v18+ ([nodejs.org](https://nodejs.org))
- **npm** v9+
- **Git**
- **Firebase CLI**: `npm install -g firebase-tools`
- **A Firebase project** ([console.firebase.google.com](https://console.firebase.google.com))
- **A Stripe account** ([stripe.com](https://stripe.com))
- **An Anthropic account** ([console.anthropic.com](https://console.anthropic.com))

---

## 1. Clone & Install

```bash
git clone https://github.com/your-org/nexus-ultra-platforms.git
cd nexus-ultra-platforms
npm install
```

---

## 2. Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

`.env` file contents:

```env
# ── Firebase ──────────────────────────────────────────────────────────────────
FIREBASE_API_KEY=AIzaSy_YOUR_KEY_HERE
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Firebase Admin (Server-side only)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com

# ── Anthropic (Claude API) ────────────────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE

# ── Stripe ────────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
STRIPE_PRICE_PRO_MONTHLY=price_YOUR_PRICE_ID
STRIPE_PRICE_PRO_ANNUAL=price_YOUR_ANNUAL_PRICE_ID
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_YOUR_ENTERPRISE_PRICE_ID
STRIPE_PRICE_ENTERPRISE_ANNUAL=price_YOUR_ENTERPRISE_ANNUAL_ID

# ── WhatsApp Business API ─────────────────────────────────────────────────────
WHATSAPP_ACCESS_TOKEN=YOUR_WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID=YOUR_PHONE_NUMBER_ID
WHATSAPP_BUSINESS_ACCOUNT_ID=YOUR_BUSINESS_ACCOUNT_ID
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token_here
WHATSAPP_API_VERSION=v19.0

# ── Application ───────────────────────────────────────────────────────────────
APP_BASE_URL=https://your-domain.com
PORT=3000
NODE_ENV=development
SUPPORT_EMAIL=support@your-domain.com
```

---

## 3. Firebase Setup

### 3.1 Create Firebase Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add Project"** → name it → enable Google Analytics (optional)
3. Add a **Web App** → copy the config values to your `.env`

### 3.2 Enable Authentication
1. Firebase Console → **Authentication** → **Sign-in method**
2. Enable: **Email/Password** and **Google**

### 3.3 Enable Firestore
1. Firebase Console → **Firestore Database** → **Create database**
2. Choose **Production mode** → select your region
3. Update Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own documents
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Content sub-collection
      match /content/{contentId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    // Leads — write-only for authenticated users
    match /leads/{leadId} {
      allow create: if true;
      allow read, update, delete: if false;
    }
  }
}
```

### 3.4 Login to Firebase CLI
```bash
firebase login
firebase use your-project-id
```

---

## 4. Stripe Setup

### 4.1 Create Products & Prices
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. **Products** → **Add product**
3. Create:
   - **Nexus Ultra Pro** — Monthly ($29) and Annual ($23/mo billed annually)
   - **Nexus Ultra Enterprise** — Monthly ($99) and Annual ($79/mo billed annually)
4. Copy the **Price IDs** (start with `price_`) into your `.env`

### 4.2 Configure Webhooks
1. Stripe Dashboard → **Developers** → **Webhooks** → **Add endpoint**
2. Endpoint URL: `https://your-domain.com/api/payment/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the **Signing secret** (`whsec_...`) to `STRIPE_WEBHOOK_SECRET`

---

## 5. WhatsApp Business API Setup

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create a **Meta App** → Add **WhatsApp** product
3. In **WhatsApp → API Setup**:
   - Copy **Phone number ID** → `WHATSAPP_PHONE_NUMBER_ID`
   - Copy **Access Token** → `WHATSAPP_ACCESS_TOKEN`
4. Configure **Webhook**:
   - URL: `https://your-domain.com/api/whatsapp/webhook`
   - Verify token: same as `WHATSAPP_VERIFY_TOKEN` in `.env`
   - Subscribe to: `messages`

---

## 6. Run Locally

```bash
# Start the development server
npm run dev

# Open the site
open http://localhost:3000
```

For Firebase Functions with emulators:
```bash
firebase emulators:start
```

---

## 7. Run Tests

```bash
npm test
```

---

## 8. Deploy

```bash
# Deploy to Firebase Hosting + Functions
npm run deploy

# Or deploy hosting only
npm run deploy:hosting
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for all deployment options.

---

## Project Structure Quick Reference

```
public/          Static frontend (HTML, CSS, JS, data)
src/backend/     Node.js backend (Cloud Functions)
src/config/      Service configuration files
docker/          Docker & docker-compose files
docs/            Documentation
.github/         CI/CD workflows
```

## Support

- Docs: [docs/](./docs/)
- Issues: GitHub Issues
- Email: support@nexultra.app
