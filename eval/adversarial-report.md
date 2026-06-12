# Adversarial Report

## Objective

Test whether the temporary workflow skill pack complements `workflow-supervisor` and remains generic across repositories, non-code workflows, documentation production, research, planning, and empty-workspace intake.

## Method

- Read all packaged skill bodies and test artifacts.
- Ran independent adversarial subagents for:
  - cross-skill complementarity and trigger precision
  - documentation-template fitness
  - smoke-test scoring against evil metrics
- Patched clear weaknesses during the loop.
- Re-ran static and skill-structure validation after patches.
- Ran a second adversarial counsel pass after adding Codex goal lifecycle behavior.

## Main Weaknesses Found

| Weakness | Severity | Resolution |
|---|---|---|
| `workflow-supervisor` could cascade too easily into many subskills. | P1 | Tightened trigger: explicit supervision language or at least two hard triggers; companion skills are optional phase tools. |
| `source-corpus` could over-trigger on ordinary repo inspection. | P1 | Added negative trigger for normal scoped implementation inspection. |
| `workflow-docs` was workflow-memory oriented but weak for documentation production. | P1 | Added documentation-production lane and templates for brief, inventory, outline, style, glossary, review, revision, publishing, and maintenance. |
| Acceptance ownership was duplicated across skills. | P2 | Added ownership boundary: work-unit drafts coarse criteria, acceptance-matrix owns evidence rows, dossier embeds/references, docs preserve. |
| Repair work could drift from verifier evidence. | P2 | Added finding/matrix-row linkage requirements and evil metric M14. |
| The pack still leaked code/repo vocabulary. | P2 | Added no-prerequisite and domain-neutral clauses across skills. |
| Smoke prompts were too explicit and easy to pass. | P2 | Added negative and overlap prompts for tiny tasks, small diff review, ordinary file inspection, false independence, over-documentation, missing boundaries, and waiver evidence. |
| Supervisor loops did not explicitly bind to Codex goals. | P1 | Added Codex goal lifecycle: get first, classify active goal state, create only when explicitly allowed, terminal update only for complete/blocked, and mirror nonterminal state in docs. |
| Active unrelated goals could be accidentally reused or overwritten. | P1 | Added active-unrelated handling: do not create/reuse/update; ask user or continue with goal binding skipped. |
| Prompt-only/empty-workspace tasks were over-blocked. | P1 | Added `allowed_next_action` with discovery, provisional draft, production change, and blocked states. |
| The pack assumed Markdown/file state too strongly. | P1 | Added state artifact medium guidance and split workflow-docs references by lane. |
| Smoke tests leaked the answer key. | P1 | Added generated `smoke-prompts-only.md` and `smoke-answer-key.md`; validator fails if prompts-only leaks expected behavior. |
| Skills could implicitly invoke before trigger precision is proven. | P1 | Added `policy.allow_implicit_invocation: false` to all skill metadata. |

## Current Verdict

Status: `package-smoke-pass`

Install posture: `temporary opt-in only`

The pack now appears complementary:

- `workflow-supervisor` is the spine and no longer assumes every companion skill must run.
- `source-corpus` grounds only when source authority or evidence is materially risky.
- `work-unit` decomposes and sequences without owning detailed acceptance evidence.
- `dossier-builder` packages one bounded handoff and references acceptance rows.
- `worker-roles` enforces role separation across code and non-code work.
- `acceptance-matrix` owns evidence, verdicts, review states, and rubber-stamp rejection.
- `loop-policy` controls retries, approval, no-progress, and parallel safety.
- `workflow-docs` now supports both workflow memory and documentation production.
- Codex goals are now treated as the supervisor's platform state container when explicitly goal/agent-loop oriented, with workflow docs as fallback state.
- All skills set `policy.allow_implicit_invocation: false` until live routing tests prove trigger precision.
- `workflow-docs` references are split into documentation-production, workflow-control, and goal/resume lanes for progressive disclosure.
- Smoke tests are split into `smoke-prompts-only.md` for fresh-thread runs and `smoke-answer-key.md` for evaluators.

## Remaining Risks

- Live forward-testing is still needed. Static validation and adversarial review are not enough to prove trigger precision in real Codex sessions.
- Trigger descriptions may still need tightening after observing actual implicit invocation behavior.
- The documentation-production lane is broader now; it may need pruning if agents over-create artifacts.
- No optional `workflow-ledger` skill exists yet. Current assumption: `DECISIONS.md`, `HANDOFF.md`, and `OUTCOME.md` are enough unless auditability becomes a primary need.
- The pack is generic, but it is still process-heavy. It should remain opt-in for supervised/open-ended work rather than defaulting on medium tasks.
- `policy.allow_implicit_invocation: false` keeps the temporary pack opt-in; production promotion should revisit this only after live routing tests.

## Validation

Commands run:

```bash
python3 eval/static_validate.py
for d in skills/*; do python3 /Users/nikolacehic/.codex/skills/.system/skill-creator/scripts/quick_validate.py "$d" || exit 1; done
python3 eval/split_smoke_suite.py
```

Result: all passed.

## Next Forward Tests

Run fresh-thread tests for:

- S19 tiny task negative
- S20 over-documentation trap
- S21 false independence
- S22 narrow repair
- S23 parallel mutation conflict
- S27 small unit test negative
- S31 source-corpus overlap negative
- S32 acceptance ownership
- S33 goal-oriented supervisor start
- S34 no-goal tiny task
- S34b explicit supervisor tiny downgrade
- S35 active goal resume
- S36 goal completion discipline
- S37-S43 implicit trigger portability tests

Promotion should wait until these are scored without automatic fails.
