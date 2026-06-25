# Git Master Skill

## Commit Practices
- Write clear, descriptive commit messages
- Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- Each commit should be a single logical change
- Keep commits small and focused
- Never commit broken code to main/master

## Branching
- Feature branches from main: `feat/description`
- Bug fix branches: `fix/description`
- Keep branches short-lived (merge frequently)
- Rebase feature branches on main before merging

## Workflow
1. `git status` — Check current state before starting
2. `git diff` — Review changes before committing
3. `git add -p` — Stage changes interactively (don't blindly add all)
4. `git commit` — Write a clear message
5. `git log --oneline -10` — Verify commit history

## Safety
- Never force push to shared branches
- Use `git stash` to save work-in-progress
- Review diffs before committing
- Use `.gitignore` properly (never commit secrets, node_modules, etc.)
- When in doubt, create a backup branch

## Advanced
- `git bisect` for finding bug introductions
- `git rebase -i` for cleaning up local history
- `git cherry-pick` for selective changes
- `git reflog` for recovering lost commits
