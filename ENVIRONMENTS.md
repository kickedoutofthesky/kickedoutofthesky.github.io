# Environment Guide: Local → Preview → Production

This document provides a high-level overview of how code flows through different environments, from your local machine to production.

## The Three Environments

### 🏠 Local Development

- **When:** `npm run dev`
- **Frontend:** `http://localhost:3000`
- **Backend:** `http://localhost:3001`
- **Stripe:** Test mode (`sk_test_...`)
- **Printful:** Draft orders (`is_draft_order: true` in code)
- **Real Money:** ❌ No
- **Real Orders:** ❌ No
- **Use Case:** Building features, testing locally
- **See:** [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)

### 🌐 Preview/Staging

- **When:** Push to any non-main branch or PR
- **Frontend:** `https://your-branch.vercel.app`
- **Backend:** `https://your-branch.vercel.app/api`
- **Stripe:** Test mode (`sk_test_...`, separate webhook)
- **Printful:** Draft orders (`is_draft_order: true` in code)
- **Real Money:** ❌ No
- **Real Orders:** ❌ No
- **Use Case:** Code review, QA testing, team collaboration
- **See:** [PREVIEW_ENVIRONMENT.md](PREVIEW_ENVIRONMENT.md)

### 🚀 Production

- **When:** Merge to main branch
- **Frontend:** `https://kickedoutofthesky.com`
- **Backend:** `https://kickedoutofthesky-store.vercel.app/api`
- **Stripe:** Live mode (`sk_live_...`, real payments)
- **Printful:** Live orders (`is_draft_order: false` in code)
- **Real Money:** ✅ Yes
- **Real Orders:** ✅ Yes
- **Use Case:** Serving real customers, processed real payments
- **See:** [PRODUCTION_ENVIRONMENT.md](PRODUCTION_ENVIRONMENT.md)

## workflow: Code → Review → Deploy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          YOUR WORKFLOW                                  │
└─────────────────────────────────────────────────────────────────────────┘

1️⃣  LOCAL DEVELOPMENT
   ├─ git checkout -b feature/new-thing
   ├─ npm run dev
   ├─ Test locally on http://localhost:3000
   ├─ npm run test (verify tests pass)
   └─ npm run lint (verify code quality)

         │
         │ Code works locally
         ▼

2️⃣  PUSH TO PREVIEW
   ├─ git add .
   ├─ git commit -m "feat: add new feature"
   ├─ git push origin feature/new-thing
   │  (Vercel auto-deploys to feature-new-thing.vercel.app)
   ├─ Test in preview environment
   ├─ Verify checkout flow end-to-end
   └─ Get code review

         │
         │ Feature works in preview
         │ Code reviewed & approved
         ▼

3️⃣  MERGE TO PRODUCTION
   ├─ Open PR on GitHub
   ├─ Team reviews changes
   ├─ Merge to main branch
   │  (Vercel auto-deploys to production)
   │  (GitHub Pages updates kickedoutofthesky.com)
   └─ Monitor for issues

         │
         │ Real customers can now use feature
         ▼

4️⃣  PRODUCTION LIVE
   └─ Real payments processed
   └─ Real orders sent to Printful
   └─ Teams support customers
```

## Environment Variable Progression

Your code stays the same. The variables change:

```javascript
// This exact code runs everywhere:
const apiUrl = window.__API_URL__ || "https://kickedoutofthesky-store.vercel.app";
fetch(`${apiUrl}/api/create-checkout-session`, ...);
```

| Variable             | Local                   | Preview                         | Production                                       |
| -------------------- | ----------------------- | ------------------------------- | ------------------------------------------------ |
| `window.__API_URL__` | `http://localhost:3001` | `https://branch.vercel.app/api` | `https://kickedoutofthesky-store.vercel.app/api` |
| `STRIPE_SECRET_KEY`  | `sk_test_...`           | `sk_test_...`                   | `sk_live_...`                                    |
| `PRINTFUL_API_KEY`   | test key                | test key                        | production key                                   |

## Deployment Triggers

### Local → Preview

```bash
git push origin feature/your-feature
```

Vercel automatically detects push and deploys.

### Preview → Production

```bash
# On GitHub UI:
1. Open PR to main
2. Get approval
3. Click "Merge pull request"
4. Vercel automatically deploys to production
```

## When to Use Each Environment

### Use Local When:

- ✅ Building new features
- ✅ Debugging issues
- ✅ Running tests locally
- ✅ Experimenting with code
- ✅ Don't need real payment processing

### Use Preview When:

- ✅ Sharing work with team
- ✅ Testing before production
- ✅ Code review
- ✅ QA testing
- ✅ Verifying full flow (with test card)

### Use Production When:

- ✅ Feature is complete & tested
- ✅ Code is reviewed & approved
- ✅ Ready for real customers
- ✅ Need to serve requests to kickedoutofthesky.com

## Environment Variables Setup

### Phase 1: Local Setup (First Time)

```bash
# Create .env.local (not committed, in .gitignore)
cp .env.local.template .env.local

# Fill in your test keys:
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
PRINTFUL_API_KEY=test_key
BACKEND_URL=http://localhost:3001
```

### Phase 2: Preview Setup (First Time)

```
Vercel Dashboard → Settings → Environment Variables

Add variables WITH "Preview" ✅ checked:
STRIPE_SECRET_KEY = sk_test_...
STRIPE_WEBHOOK_SECRET = whsec_test_...
PRINTFUL_API_KEY = test_key
BACKEND_URL = (auto-populated as https://branch.vercel.app/api)
```

### Phase 3: Production Setup (First Time)

```
Vercel Dashboard → Settings → Environment Variables

Add variables WITH ONLY "Production" ✅ checked:
STRIPE_SECRET_KEY = sk_live_...
STRIPE_WEBHOOK_SECRET = whsec_live_...
PRINTFUL_API_KEY = production_key_...
FRONTEND_URL = https://kickedoutofthesky.com
```

⚠️ **CRITICAL:** Triple-check production values before saving!

## Key Differences

### Authentication

- **Local:** `.env.local` file (never committed)
- **Preview:** Vercel UI environment variables (Preview checked)
- **Production:** Vercel UI environment variables (Production checked)

### Stripe Setup

- **Local:** Stripe CLI forwards webhooks → localhost:3001
- **Preview:** Stripe dashboard webhook → https://branch.vercel.app/api/webhook
- **Production:** Stripe live webhook → https://kickedoutofthesky-store.vercel.app/api/webhook

### Deployment

- **Local:** Your machine (manual `npm run dev`)
- **Preview:** Automatic (push to non-main branch)
- **Production:** Automatic (merge to main)

## Safety Guardrails

✅ **What Prevents Accidents:**

1. **Local/Preview use TEST Stripe keys** - Can't charge real cards
2. **Production requires EXPLICIT merge to main** - Not automatic
3. **Environment variables separated by scope** - Prod vars never in Preview
4. **`.env.local` in `.gitignore`** - Can't accidentally commit secrets
5. **Code is identical everywhere** - No environment-specific logic

## Common Tasks

### Task: Add a new feature

```bash
1. git checkout -b feature/my-feature
2. Make changes
3. npm run dev (test locally)
4. git push origin feature/my-feature
5. Test on preview URL
6. Open PR
7. Get approved
8. Merge to main
9. Production auto-deploys
```

### Task: Fix a bug in production

```bash
1. git checkout -b fix/bug-name
2. Reproduce bug locally: npm run dev
3. Fix the bug
4. npm run test (verify fix)
5. git push origin fix/bug-name
6. Test fix in preview environment
7. Open PR
8. Get approved
9. Merge to main
10. Deployed to production
```

### Task: Update environment variable

```bash
⚠️ IMPORTANT: Depends on which environment

If LOCAL:
1. Edit .env.local (never commit this!)
2. Restart npm run dev
3. Test locally

If PREVIEW:
1. Go to Vercel → Settings → Environment Variables
2. Edit variable
3. Check "Preview" ✅ box
4. Save
5. Vercel auto-redeploys preview deployments

If PRODUCTION:
1. Go to Vercel → Settings → Environment Variables
2. Edit variable
3. Check ONLY "Production" ✅ box
4. Save
5. Vercel auto-redeploys production
6. LIVE UPDATE (affects customers!)
```

## Monitoring by Environment

### Local Monitoring

- Check browser console for errors
- Check terminal output from `npm run dev`
- Run tests: `npm run test`

### Preview Monitoring

- Vercel Dashboard → Deployments
- Check function logs
- Test full checkout flow
- Verify webhook delivery in Stripe

### Production Monitoring

- Vercel Dashboard → Analytics
- Stripe Dashboard → Recent customers
- Printful Orders dashboard
- Website uptime monitoring
- Customer support channel

## Troubleshooting by Environment

### "It works locally but not in preview"

→ Check Preview environment variables in Vercel

### "It works in preview but not production"

→ Check Production environment variables (especially Stripe keys)

### "Checkout works but webhook not received"

→ Check Stripe webhook URL matches your environment
→ Check webhook signing secret in env vars

### "Orders appear in Printful but with wrong details"

→ Check PRINTFUL_API_KEY is correct environment (test vs live)
→ Check order transformation code in backend

## Deployment Safety Checklist

Before each environment push:

### Before Preview (feature branch)

- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] Tested locally on http://localhost:3000
- [ ] No `.env.local` secrets in code
- [ ] Code reviewed by you

### Before Production (merge to main)

- [ ] All Preview tests passed
- [ ] Code approved by team member
- [ ] Verified in Preview environment
- [ ] Test card payment processed
- [ ] Printful test order created
- [ ] Pre-production checklist completed (see PRODUCTION_ENVIRONMENT.md)

## Architecture Diagram

```
                    SAME CODE
                    FOR ALL
                   ENVIRONMENTS
                        │
           ┌────────────┼────────────┐
           │            │            │
           ▼            ▼            ▼
        LOCAL        PREVIEW      PRODUCTION

  npm run dev    Push to branch   Merge to main
      │              │                │
      ▼              ▼                ▼
  :3000        branch.vercel.app   kickedoutofthesky.com
  :3001        branch.vercel.app
               /api
      │              │                │
      ├─ Test keys   ├─ Test keys    ├─ LIVE keys
      ├─ Test mode   ├─ Test mode    ├─ LIVE mode
      └─ You only    └─ Team + QA    └─ Real customers
```

## Next Steps

1. **Start Local:** Follow [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)
2. **Test Feature:** Push to preview branch
3. **Follow Preview Guide:** [PREVIEW_ENVIRONMENT.md](PREVIEW_ENVIRONMENT.md)
4. **Go Live:** Follow [PRODUCTION_ENVIRONMENT.md](PRODUCTION_ENVIRONMENT.md)

---

**Remember:** Your code never changes between environments. Only the configuration does.
