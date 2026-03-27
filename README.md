# Nexus Ultra Platforms (SaaS) — AI Creator Website System with Nexus Modal AI

Nexus Ultra Platforms is a SaaS website builder for creators and businesses. It includes an AI-powered toolkit ("Nexus Modal AI") to generate content, assist with site creation, and automate marketing workflows.

## Key Features

- AI tools directory (free tools listing + categories)
- Auto content generator (blogs, landing copy, product descriptions)
- Theme customization (colors, fonts, layouts)
- User dashboard (sites, pages, analytics, settings)
- Payments (subscriptions / upgrades)
- WhatsApp automation (notifications + campaigns)

## Tech Stack (proposed)

| Layer | Technology |
|---|---|
| Frontend | Flutter Web |
| Backend | Firebase (Auth, Firestore, Storage, Cloud Functions) |
| Payments | Stripe (optional: Razorpay) |
| Automations | Cloud Scheduler + Cloud Tasks + Functions |

## Project Structure (recommended)

```
/apps/web       — Flutter Web app (UI + dashboard)
/functions      — Firebase Cloud Functions (API, webhooks, jobs)
/firebase       — Firestore rules + indexes
/docs           — architecture, flows, endpoints
```

## Quick Start (Local)

### Prerequisites

- Flutter SDK (stable)
- Firebase project (Firestore + Auth enabled)
- Node.js (for Cloud Functions)

### Setup

1. Clone the repo
2. Create a Firebase project
3. Configure env:
   - `firebase_options.dart` (FlutterFire)
   - Functions env/secrets for API keys
4. Run:
   - `flutter run -d chrome`
   - `firebase emulators:start` (optional)

## Deployment

- Web: Firebase Hosting
- Backend: Cloud Functions
- DB: Firestore (with security rules + indexes)
- Jobs: Cloud Scheduler + Cloud Tasks

### 1) Create Firebase project

1. Go to Firebase Console → Create project
2. Enable:
   - Authentication (Email/Password + Google optional)
   - Firestore Database
   - Storage (if you host images/themes/assets)
3. Install Firebase CLI:
   - `npm i -g firebase-tools`
   - `firebase login`
   - `firebase use --add`

### 2) Deploy Web (Firebase Hosting)

1. Build the web app:
   - `flutter build web --release`
2. Initialize hosting (first time only):
   - `firebase init hosting`
   - Set public directory to: `build/web`
   - Configure as SPA: **Yes** (recommended for Flutter web routing)
3. Deploy:
   - `firebase deploy --only hosting`

### 3) Deploy Backend (Cloud Functions)

1. Initialize Functions (first time only):
   - `firebase init functions`
2. Add secrets/config (recommended: Secret Manager via Firebase):
   - examples: AI API keys, Stripe secret, WhatsApp token
3. Deploy:
   - `firebase deploy --only functions`

### 4) Firestore Rules + Indexes

1. Put rules in `firestore.rules` and indexes in `firestore.indexes.json`
2. Deploy:
   - `firebase deploy --only firestore:rules,firestore:indexes`

### 5) Jobs (Cloud Scheduler + Cloud Tasks)

Use this for:
- scheduled content generation
- queued social/WhatsApp sends
- subscription cleanup, analytics rollups

Typical setup:

1. Create a Cloud Tasks queue (GCP Console → Cloud Tasks)
2. Cloud Function "worker" endpoint processes tasks
3. Create Scheduler jobs to enqueue tasks periodically

Deploy changes with:
- `firebase deploy --only functions`

## Roadmap (MVP → SaaS)

- [ ] Auth + onboarding (Firebase Auth)
- [ ] Dashboard: sites/pages management
- [ ] Theme editor + publish flow
- [ ] AI tools directory (CRUD + search)
- [ ] Content generator (Functions + provider API)
- [ ] Payments (Stripe subscriptions + webhooks)
- [ ] WhatsApp automation (Cloud API + templates)
- [ ] Admin panel + analytics

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

See [LICENSE](LICENSE) for details.
