# Nexus Ultra — Deployment Guide

Nexus Ultra can be deployed to multiple platforms. Choose the one that best fits your needs.

---

## Option 1: Firebase Hosting (Recommended)

Firebase Hosting provides global CDN, SSL, and seamless integration with Firebase Functions.

### Prerequisites
- Firebase CLI: `npm install -g firebase-tools`
- Firebase project created (see [SETUP.md](SETUP.md))

### Deploy

```bash
# Login to Firebase
firebase login
firebase use your-project-id

# Set environment variables for Functions
firebase functions:config:set \
  anthropic.api_key="sk-ant-YOUR_KEY" \
  stripe.secret_key="sk_test_YOUR_KEY" \
  stripe.webhook_secret="whsec_YOUR_SECRET" \
  whatsapp.access_token="YOUR_TOKEN" \
  whatsapp.phone_number_id="YOUR_ID"

# Deploy everything
npm run deploy
# Or individually:
npm run deploy:hosting
npm run deploy:functions
```

### Custom Domain
1. Firebase Console → Hosting → **Add custom domain**
2. Follow DNS verification instructions
3. SSL certificate is provisioned automatically

---

## Option 2: Vercel

Ideal for static frontends with serverless function support.

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add ANTHROPIC_API_KEY
vercel env add STRIPE_SECRET_KEY
# ... (add all variables from .env)

# Production deployment
vercel --prod
```

Create `vercel.json` for routing:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/src/backend/server.js" },
    { "source": "/(.*)", "destination": "/public/$1" }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

---

## Option 3: Docker

For self-hosted or cloud VM deployments (AWS EC2, DigitalOcean, etc.).

### Build & Run

```bash
# Build the Docker image
docker build -f docker/Dockerfile -t nexus-ultra .

# Run with environment file
docker run -d \
  --name nexus-ultra \
  -p 80:80 \
  --env-file .env \
  nexus-ultra

# Or use docker-compose (includes Redis)
cd docker
docker-compose up -d
```

### Deploy to Docker Registry

```bash
# Tag image
docker tag nexus-ultra your-registry/nexus-ultra:latest

# Push
docker push your-registry/nexus-ultra:latest
```

### Health Check

```bash
curl http://localhost/health
# Returns: OK
```

---

## Option 4: AWS

### AWS Amplify (Easiest)

1. Go to [console.aws.amazon.com/amplify](https://console.aws.amazon.com/amplify)
2. **Host web app** → Connect your GitHub repository
3. Configure build settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - echo "Static site — no build step required"
  artifacts:
    baseDirectory: public
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

4. Add environment variables in Amplify Console → **Environment variables**

### AWS S3 + CloudFront

```bash
# Create S3 bucket
aws s3 mb s3://nexus-ultra-hosting --region us-east-1

# Enable static website hosting
aws s3 website s3://nexus-ultra-hosting \
  --index-document index.html \
  --error-document index.html

# Upload public files
aws s3 sync public/ s3://nexus-ultra-hosting \
  --delete \
  --cache-control "max-age=86400"

# Set JS/CSS to long-cache
aws s3 sync public/css/ s3://nexus-ultra-hosting/css/ \
  --cache-control "max-age=31536000, immutable"

aws s3 sync public/js/ s3://nexus-ultra-hosting/js/ \
  --cache-control "max-age=31536000, immutable"
```

---

## Environment Variables Reference

All environment variables that must be set for production:

| Variable | Required | Description |
|----------|----------|-------------|
| `FIREBASE_API_KEY` | ✅ | Firebase Web API Key |
| `FIREBASE_PROJECT_ID` | ✅ | Firebase Project ID |
| `FIREBASE_AUTH_DOMAIN` | ✅ | Firebase Auth Domain |
| `ANTHROPIC_API_KEY` | ✅ | Anthropic Claude API Key |
| `STRIPE_SECRET_KEY` | ✅ | Stripe Secret Key |
| `STRIPE_PUBLIC_KEY` | ✅ | Stripe Publishable Key |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Stripe Webhook Signing Secret |
| `STRIPE_PRICE_PRO_MONTHLY` | ✅ | Stripe Price ID for Pro monthly |
| `WHATSAPP_ACCESS_TOKEN` | ⚪ | WhatsApp Business API token |
| `WHATSAPP_PHONE_NUMBER_ID` | ⚪ | WhatsApp phone number ID |
| `APP_BASE_URL` | ✅ | Your domain (e.g., https://nexultra.app) |

---

## CI/CD with GitHub Actions

The repository includes a full CI/CD pipeline at `.github/workflows/deploy.yml`.

### Required GitHub Secrets

Configure these in **Settings → Secrets → Actions**:

```
FIREBASE_TOKEN               # firebase login:ci
FIREBASE_PROJECT_ID
FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID
ANTHROPIC_API_KEY
STRIPE_SECRET_KEY
STRIPE_PUBLIC_KEY
STRIPE_WEBHOOK_SECRET
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_VERIFY_TOKEN
APP_BASE_URL
DOCKER_REGISTRY              # Optional: for Docker deploys
DOCKER_USERNAME              # Optional
DOCKER_PASSWORD              # Optional
```

### Get Firebase CI Token

```bash
firebase login:ci
# Copy the token and save as FIREBASE_TOKEN secret
```

Deployments trigger automatically on push to `main`.

---

## Post-Deployment Checklist

- [ ] Test landing page loads correctly
- [ ] Test sign up / login flow
- [ ] Test content generation (enter a prompt and click Generate)
- [ ] Test tools directory search and filtering
- [ ] Test Stripe checkout with test card `4242 4242 4242 4242`
- [ ] Test Firebase auth (Google login)
- [ ] Verify SSL certificate is active
- [ ] Set up monitoring/alerts
- [ ] Configure custom domain
