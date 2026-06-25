# ULW Loop Skill

## Goal-Based Evidence-Bound Execution

The ULW (Ultra-Lightweight Work) Loop is a structured execution protocol for complex tasks.

### Loop Commands
- `ulw loop start: <goal>` — Begin a new loop with a defined goal
- `ulw loop checkpoint` — Mark current progress as verified
- `ulw loop status` — Show loop status and progress
- `ulw loop complete` — Mark the goal as achieved
- `ulw loop abort` — Abort the current loop

### Execution Protocol

#### Step 1: Define Goal
Clear, measurable goal statement. The goal should be verifiable.

#### Step 2: Decompose
Break the goal into ordered steps, each with:
- Clear description
- Verification criteria
- Expected evidence

#### Step 3: Execute Loop
```
LOOP:
  1. Pick next unverified step
  2. Execute the step
  3. Gather evidence (test results, output, diagnostics)
  4. If evidence confirms success → mark verified, checkpoint
  5. If evidence shows failure → diagnose, fix, retry (max 3)
  6. If blocked → report and ask for input
  7. Goto 1 until all steps verified
```

#### Step 4: Complete
- All steps verified with evidence
- Final verification of the overall goal
- Summary of changes and evidence

### Evidence Types
- Test results (pass/fail with output)
- Build/compilation output
- Runtime behavior verification
- Diagnostic results (0 errors, 0 warnings)
- File diffs showing the changes
