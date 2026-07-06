# CLAUDE.md

Guidance for Claude Code (and any AI assistant) working in this repository.

## MANDATORY: Branching workflow

Before making **any** code change, read and follow
[`BRANCHING_WORKFLOW.md`](./BRANCHING_WORKFLOW.md).

Key rules — never violate these:

1. **Never commit directly to `main` or `develop`.** Both are protected,
   long-lived branches.
2. **Always create a feature branch from `develop`** before starting work:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/<short-description> develop
   ```
3. Use branch prefixes: `feature/`, `fix/`, `chore/`, `hotfix/`.
4. **Open Pull Requests into `develop`**, never into `main`.
   (Only release and `hotfix/` PRs target `main`.)
5. Do **not** force-push `main` or `develop`.

If the user asks to "just commit" while on `main` or `develop`, pause and
create a feature branch first, then explain why.

## Where things live

- `BRANCHING_WORKFLOW.md` — full branching rules and the per-task checklist.
