# Nexus Ultra Platforms — Deployment Security

## Pre-Deployment Checklist

- [ ] All secrets stored in GitHub Secrets / GCP Secret Manager (not in code)
- [ ] `NODE_ENV=production` set in deployment environment
- [ ] Firebase Security Rules deployed (`firebase deploy --only firestore:rules,database`)
- [ ] Cloud Armor policy applied to load balancer backend
- [ ] Cloudflare proxying enabled with Full (strict) SSL mode
- [ ] `cert-manager` ClusterIssuer verified as ready
- [ ] Redis password set and network access restricted
- [ ] Snyk + OWASP ZAP CI scans passing before merge to `main`

## Firebase Deployment

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Realtime Database rules
firebase deploy --only database

# Full deploy (hosting + functions + rules)
firebase deploy --token "$FIREBASE_TOKEN"
```

## Kubernetes / cert-manager

```bash
# Apply TLS certificate configuration
kubectl apply -f kubernetes/cert-manager.yaml

# Check certificate status
kubectl describe certificate nexus-tls
```

## Environment Variables

Copy `.env.example` to `.env` and populate all values before running locally.
In production, inject secrets via your CI/CD platform — never store `.env` in the
repository.

## Rollback Procedure

1. Identify the last good deployment tag in GitHub Releases.
2. Revert the Firebase Functions deployment:
   ```bash
   firebase functions:delete <functionName>
   firebase deploy --only functions --token "$FIREBASE_TOKEN"
   ```
3. Revert Firestore rules to the previous version from git history.
4. Notify the team via Slack.
