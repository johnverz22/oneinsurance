# Staging Swap Guide

## Current State
Staging server (`https://ifrc.intel-soln.com.ph`) is currently deploying from:
**`feature/health-insurance`** — health insurance is VISIBLE on staging

---

## How to Restore Staging Back to Main

### Step 1 — Edit the workflow file
Open `.github/workflows/main.yml` and change:
```yaml
on:
  push:
    branches:
      - feature/health-insurance
```
back to:
```yaml
on:
  push:
    branches:
      - main
```

### Step 2 — Commit and push to feature/health-insurance
```bash
git add .github/workflows/main.yml
git commit -m "chore: restore workflow to main branch"
git push origin feature/health-insurance
```

### Step 3 — Trigger a redeploy of main
The workflow now watches `main` again, but nothing will deploy until main gets a push.
Go to GitHub → Actions → "Deploy OneInsurance App" → click "Run workflow" → select `main` → Run.

That's it. Staging is back to main.

---

## Your Question: Do I need to merge to see changes on staging?

NO. While the workflow is pointed at `feature/health-insurance`:

- You make changes
- You commit and push to `feature/health-insurance`
- GitHub Actions auto-deploys to staging automatically
- No merging needed

```bash
git add .
git commit -m "fix: your change description"
git push origin feature/health-insurance
```

Staging updates within ~2-3 minutes after the push.

---

## Summary

| Situation | Workflow branch | Who sees what |
|-----------|----------------|---------------|
| Normal / production | `main` | Staging = travel insurance only |
| QA health insurance | `feature/health-insurance` | Staging = health insurance visible |
