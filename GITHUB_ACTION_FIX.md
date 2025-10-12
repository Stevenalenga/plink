# GitHub Action Setup Guide

## The Issue

Your GitHub Action workflow is failing because it requires two secrets that haven't been configured yet:
- `CRON_SECRET` - Authentication token for the cleanup endpoint
- `APP_URL` - Your deployed application URL

## Quick Fix Options

### Option A: Configure GitHub Secrets (Keep GitHub Action)

1. **Generate CRON_SECRET** (if you haven't already):
   ```bash
   openssl rand -base64 32
   ```

2. **Add secrets to GitHub**:
   - Go to: `https://github.com/stevenalenga/plink/settings/secrets/actions`
   - Click "New repository secret"
   - Add two secrets:
     - **Name**: `CRON_SECRET`
       **Value**: (paste the generated secret)
     - **Name**: `APP_URL`
       **Value**: `https://your-app.vercel.app` (without trailing slash)

3. **Push again**:
   ```bash
   git push
   ```

### Option B: Remove GitHub Action (Use Only Vercel Cron)

Since you already have Vercel Cron configured in `vercel.json`, you might not need the GitHub Action.

**Delete the workflow file**:
```bash
rm .github/workflows/cleanup-expired-locations.yml
git add .
git commit -m "Remove redundant GitHub Action (using Vercel Cron instead)"
git push
```

## Recommended Approach

**I recommend Option B** (remove GitHub Action) because:
- ✅ Vercel Cron is already configured and will work automatically
- ✅ No need to manage secrets in multiple places
- ✅ Simpler deployment process
- ✅ Vercel Cron has better integration with your app

The GitHub Action was likely created for platforms that don't have built-in cron support, but since you're on Vercel, it's redundant.

## If You Keep GitHub Action

If you decide to keep both (for redundancy), make sure:
1. Both use the same `CRON_SECRET`
2. Set the GitHub Action secret values
3. Consider running them at different times to avoid conflicts:
   - Vercel Cron: Every hour (`0 * * * *`)
   - GitHub Action: Every 2 hours (`0 */2 * * *`)

## Alternative: Disable GitHub Action Temporarily

Add this to the top of `.github/workflows/cleanup-expired-locations.yml`:

```yaml
name: Cleanup Expired Public Locations

on:
  # Disabled - using Vercel Cron instead
  # schedule:
  #   - cron: '0 * * * *'
  
  # Only allow manual trigger
  workflow_dispatch:
```

This way you keep the file but it won't run automatically (only manually via GitHub Actions UI).
