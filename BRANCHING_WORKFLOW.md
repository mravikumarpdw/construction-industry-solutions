# Branching Workflow & Checklist

This repository uses a **two long-lived branch** model. Everyone who clones or
pulls this repo — and anyone working with Claude Code — must follow the rules
below.

## Long-lived branches

| Branch     | Purpose                                              | Protected |
|------------|------------------------------------------------------|-----------|
| `main`     | Production / release-ready code only.                | Yes       |
| `develop`  | Integration branch. Default target for all work.     | Yes       |

- **Never commit directly to `main` or `develop`.**
- All work happens on short-lived **feature branches** cut from `develop`.
- Feature branches merge back into `develop` (via Pull Request).
- `develop` is promoted to `main` only for a release (via Pull Request).

## Golden rule

> Always branch from `develop`, always merge back into `develop`.

---

## Feature workflow checklist

Follow these steps for **every** piece of work. Copy this checklist into your PR
description if useful.

- [ ] **1. Sync develop**
  ```bash
  git checkout develop
  git pull origin develop
  ```

- [ ] **2. Create a feature branch from develop**
  Naming: `feature/<short-description>`, `fix/<short-description>`,
  or `chore/<short-description>`.
  ```bash
  git checkout -b feature/my-change develop
  ```

- [ ] **3. Do the work** — commit in small, logical steps with clear messages.

- [ ] **4. Keep the branch up to date** (before opening a PR)
  ```bash
  git fetch origin
  git rebase origin/develop     # or: git merge origin/develop
  ```

- [ ] **5. Push the feature branch**
  ```bash
  git push -u origin feature/my-change
  ```

- [ ] **6. Open a Pull Request into `develop`** (never into `main`).

- [ ] **7. After review + approval, merge into `develop`.**
  Delete the feature branch after merge.

- [ ] **8. Release:** open a separate PR from `develop` into `main` when the
  integrated work is ready to ship.

---

## Branch naming conventions

| Prefix       | Use for                                  | Example                         |
|--------------|------------------------------------------|---------------------------------|
| `feature/`   | New functionality                        | `feature/invoice-export`        |
| `fix/`       | Bug fixes                                | `fix/login-redirect`            |
| `chore/`     | Tooling, deps, config, docs              | `chore/update-eslint`           |
| `hotfix/`    | Urgent production fix (branch from `main`, merge to BOTH `main` and `develop`) | `hotfix/payment-crash` |

---

## Do / Don't

**Do**
- Branch from `develop`.
- Keep feature branches small and focused.
- Pull/rebase `develop` before opening a PR.
- Write descriptive commit messages.

**Don't**
- Commit directly to `main` or `develop`.
- Open feature PRs into `main` (only release/hotfix PRs go to `main`).
- Force-push shared branches (`main`, `develop`).

---

## Note on branch protection ("same privileges")

`develop` is intended to carry the **same protection rules as `main`** (require
PR + review, no direct pushes, no force-push). These rules are enforced on
GitHub under **Settings → Branches → Branch protection rules** and must be
configured there by a repo admin — Git alone cannot enforce them. Mirror
`main`'s ruleset onto `develop`.
