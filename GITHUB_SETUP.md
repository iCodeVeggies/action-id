# GitHub Setup Guide

## Step 1: Initialize Git Repository

Open a terminal in the project directory and run:

```bash
cd /Users/sly/Programming/ActionID
git init
```

## Step 2: Verify .gitignore

Make sure `.gitignore` includes sensitive files (already configured):
- `.env` files
- `node_modules/`
- `dist/` and build outputs
- Docker volumes

## Step 3: Add Files to Git

```bash
# Stage all files
git add .

# Check what will be committed (make sure .env is NOT listed)
git status

# If .env shows up, remove it:
# git reset HEAD .env
```

## Step 4: Create Initial Commit

```bash
git commit -m "Initial commit: ActionID authentication app with Docker setup"
```

## Step 5: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository:
   - **Repository name**: `actionid-authentication` (or your preferred name)
   - **Description**: "Secure biometric authentication app with ActionID SDK"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)

## Step 6: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/actionid-authentication.git

# Or if using SSH:
# git remote add origin git@github.com:YOUR_USERNAME/actionid-authentication.git

# Verify remote was added
git remote -v
```

## Step 7: Push to GitHub

```bash
# Push to main branch
git branch -M main
git push -u origin main
```

## Step 8: Verify on GitHub

1. Go to your repository on GitHub
2. Verify all files are there
3. Make sure `.env` is NOT visible (it should be ignored)

## Important Notes

### Files That Should NOT Be Committed:
- ✅ `.env` - Contains sensitive credentials (already in .gitignore)
- ✅ `node_modules/` - Dependencies (already in .gitignore)
- ✅ `frontend/dist/` - Build outputs (already in .gitignore)
- ✅ Docker volumes and local overrides

### Files That SHOULD Be Committed:
- ✅ All source code (`.ts`, `.tsx`, `.sql` files)
- ✅ Configuration files (`package.json`, `tsconfig.json`, `Dockerfile`, etc.)
- ✅ Documentation (`.md` files)
- ✅ `.env.example` - Template for environment variables
- ✅ SDK files (if you want to include them)

### Optional: Exclude SDK Folder

If you don't want to commit the SDK folder (since it's large), add this to `.gitignore`:

```
# SDK folder (large files)
SDK/
```

Then remove it from tracking:
```bash
git rm -r --cached SDK/
git commit -m "Remove SDK folder from tracking"
```

## Troubleshooting

### If you get "permission denied" errors:
- Make sure you have write permissions to the directory
- Try running: `sudo chown -R $(whoami) /Users/sly/Programming/ActionID`

### If .env gets committed accidentally:
```bash
# Remove from git tracking (but keep local file)
git rm --cached .env
git commit -m "Remove .env from tracking"

# If already pushed, you'll need to:
# 1. Change all secrets in .env
# 2. Consider using GitHub's secret scanning or rotating credentials
```

### If you need to update .gitignore after committing:
```bash
# Edit .gitignore, then:
git rm -r --cached .
git add .
git commit -m "Update .gitignore"
```

## Next Steps After Pushing

1. **Add a README badge** (optional):
   ```markdown
   ![Docker](https://img.shields.io/badge/Docker-Ready-blue)
   ![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
   ```

2. **Add topics/tags** on GitHub:
   - `react`
   - `typescript`
   - `docker`
   - `biometric-authentication`
   - `actionid`

3. **Consider adding**:
   - License file (MIT, Apache, etc.)
   - Contributing guidelines
   - Issue templates
   - GitHub Actions for CI/CD

## Quick Reference Commands

```bash
# Check status
git status

# See what files are tracked
git ls-files

# View commit history
git log --oneline

# Push updates
git add .
git commit -m "Your commit message"
git push

# Create a new branch
git checkout -b feature/your-feature-name
```
