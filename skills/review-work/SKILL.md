# Review Work Skill

## Code Review Protocol

### 1. Understand the Change
- Read the PR description / change summary
- Understand the motivation (why was this change made?)
- Check the scope (is it focused or too broad?)

### 2. Review Code Quality
- **Correctness** — Does the code do what it claims?
- **Edge cases** — Are boundary conditions handled?
- **Error handling** — Are errors caught and handled properly?
- **Security** — Any injection, auth, or data exposure risks?
- **Performance** — Any obvious performance issues?
- **Readability** — Is the code clear and well-structured?

### 3. Review Tests
- Are there tests for the new/changed behavior?
- Do tests cover edge cases and error paths?
- Are test names descriptive?
- Do tests actually verify the right things?

### 4. Review Integration
- Does this change affect other parts of the system?
- Are API contracts maintained?
- Are database migrations safe and reversible?
- Is backward compatibility maintained?

### 5. Provide Feedback
- Be specific — point to exact lines/files
- Explain *why* something is an issue, not just *what*
- Suggest alternatives when possible
- Distinguish between blockers and suggestions
- Acknowledge good work
