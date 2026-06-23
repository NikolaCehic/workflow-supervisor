# Workflow Supervisor Optimization And Hardening Plan

Date: 2026-06-19

Controlling input: `/Users/nikolacehic/Desktop/matt-pocock-engineering-skills-optimization-research.md`

Repository: `/Users/nikolacehic/Documents/Workflow skills`

Status: Planning artifact. This file defines implementation packets; it does not itself change the workflow contract.

## Evidence Boundary

Use the Desktop research report as the source for this plan.

Do not use `/Users/nikolacehic/Documents/workflow-supervisor-gauntlet-2026-06-19/SWARM-REPORT.md` as evidence. The gauntlet folder may be useful later as raw fixture inspiration, but the swarm report is not an authoritative validation result because it does not preserve enough per-scenario execution evidence.

Current repository inspection shows these points are already true:

- The product model is profile-based: `lean_work_unit_runner`, `strict_full_workflow`, and `planning_only`.
- Lean mode keeps work units and a compact ledger instead of strict per-unit ceremony.
- Strict mode keeps source coverage, SPEC review, work units, dossiers, worker role separation, and evidence-based verification.
- Native worker lifecycle hardening is already present: worker lifecycle includes `resource_closed`, Codex native subagents require `close_agent`, and final outcome blocks on unclosed native workers.
- The remaining gaps from the research report are routing ergonomics, tracer-bullet unit shape, red-capable checks, ready-for-agent briefs, optional domain context, prototype discovery units, context-budget policy, and reproducible validation.

## Target End State

Workflow Supervisor should become easier to choose correctly and harder to misuse, while preserving the current safety contract.

The end state:

- Users can tell when not to use Workflow Supervisor.
- Explicit supervisor invocation routes to direct work, lean, strict, or planning-only behavior without accidental ceremony.
- Product implementation units default to observable vertical slices when appropriate.
- Bug fixes and risky behavior changes require red-capable evidence, not merely related checks.
- Planning-only work can emit a human-readable ready-for-agent brief without creating a full worker dossier.
- Existing `CONTEXT.md`, `CONTEXT-MAP.md`, and ADRs are read when they exist, but their absence never blocks domain-neutral work.
- Prototype or discovery units are available when a runnable answer is needed before committing to strict implementation.
- Context pressure has a documented checkpoint and handoff policy that does not replace automated worker delegation.
- Validation is repo-native and reproducible through tests, fixtures, and `npm run validate`, not through unsupported swarm summaries.

## Non-Goals

- Do not replace the existing profile-based model.
- Do not make every task use Workflow Supervisor.
- Do not reintroduce strict-only behavior.
- Do not require an issue tracker, repo, test suite, `CONTEXT.md`, or ADRs for domain-neutral work.
- Do not use manual copy/paste handoff as the primary worker transport.
- Do not weaken source-requirement coverage or acceptance evidence rules.
- Do not add a long-running daemon, queue, scheduler, dashboard, or full agent harness.
- Do not implement from the gauntlet swarm report.

## Implementation Packets

### Packet 0: Baseline Contract And Regression Harness

Purpose: lock down the current contract before changing it.

Target files:

- `tests/workflow-supervisor-lifecycle.test.mjs`
- `tests/portable-delegation.test.mjs`
- `docs/troubleshooting.md`

Work:

- Add a short test section that names current completed hardening: profile-based routing, lean ledger, strict source coverage, native worker resource close, and `.workflow/` git-ignore behavior.
- Add a troubleshooting note that unsupported external gauntlet summaries are not validation evidence unless per-scenario reports, commands, and artifacts are preserved.
- Keep the validation command as `npm run validate`.

Acceptance:

- Existing 49 tests still pass.
- New tests fail if the profile names, lean ledger, strict coverage, or native worker close rules disappear.
- No new runtime behavior is introduced.

Verification:

```bash
npm run validate
```

### Packet 1: Route-First User Experience

Purpose: make the first decision "what kind of work is this?" before asking users to think in internal profile names.

Target files:

- `README.md`
- `skills/workflow-supervisor/SKILL.md`
- `docs/skill-reference.md`
- `docs/troubleshooting.md`
- `skills/workflow-supervisor/agents/openai.yaml`
- `tests/workflow-supervisor-lifecycle.test.mjs`

Work:

- Add a "Route First" table:

  | Situation | Route |
  |---|---|
  | Small, clear edit with obvious files and acceptance | Do not use Workflow Supervisor. Execute directly. |
  | Large bounded backlog with clear unit done signals | `lean_work_unit_runner`. |
  | Broad, ambiguous, source-of-truth, delegated, security-sensitive, dirty-state, release, resume, or externally published work | `strict_full_workflow`. |
  | Sequencing, risk review, or backlog shaping only | `planning_only`. |
  | Runnable uncertainty before implementation | Create a discovery or prototype unit first. |

- Teach the skill that explicit invocation still requires profile selection, but small clear work should be surfaced as "supervisor not needed" when the user has not explicitly required it.
- Keep explicit `$workflow-supervisor` behavior: if the user explicitly requests it, select the proportional profile instead of silently skipping.
- Update metadata prompt so Codex surfaces route-first behavior.

Acceptance:

- The README explains when not to use Workflow Supervisor.
- The skill text distinguishes "not invoked and unnecessary" from "explicitly invoked and must route proportionally".
- Tests assert the direct-work route, lean route, strict route, and planning-only route.

Verification:

```bash
npm run validate
```

### Packet 2: Tracer-Bullet Work Units

Purpose: make product implementation units more shippable and less horizontal.

Target files:

- `skills/work-unit/SKILL.md`
- `skills/workflow-supervisor/SKILL.md`
- `skills/workflow-docs/references/workflow-control.md`
- `docs/artifacts.md`
- `tests/workflow-supervisor-lifecycle.test.mjs`

Work:

- Add product-code guidance: when work describes user-facing behavior or an integration behavior, prefer tracer-bullet work units.
- Add unit fields:

  ```yaml
  slice_type: tracer_bullet | prefactor | migration | research | document | risk_boundary
  observable_behavior:
  demo_or_verification:
  layers_touched:
  horizontal_slice_justification:
  ```

- State that horizontal units are valid only for prefactoring, migration safety, infrastructure, documentation, research, or a dependency that cannot yet be verified as behavior.
- Update `WORK-UNITS.md` template and lean ledger guidance to include observable behavior where useful.

Acceptance:

- `work-unit` rejects vague horizontal feature phases unless justified.
- Product implementation units have an observable behavior or an explicit non-product slice type.
- Existing domain-neutral boundary types remain allowed.

Verification:

```bash
npm run validate
```

### Packet 3: Red-Capable Feedback Loops

Purpose: prevent weak PASS evidence for bugs and behavior changes.

Target files:

- `skills/acceptance-matrix/SKILL.md`
- `skills/dossier-builder/SKILL.md`
- `skills/workflow-supervisor/SKILL.md`
- `skills/workflow-docs/references/workflow-control.md`
- `docs/troubleshooting.md`
- `schemas/dossier-v1.schema.json`
- `tests/workflow-supervisor-lifecycle.test.mjs`
- `tests/delegate-cli.test.mjs`

Work:

- Add a feedback-loop shape:

  ```yaml
  feedback_loop:
    command_or_evidence:
    red_capable: yes | no | not_applicable
    exact_symptom_or_behavior:
    deterministic: yes | no
    expected_runtime:
    agent_runnable: yes | no
  ```

- Require bug-fix dossiers and risky behavior-change acceptance rows to name a red-capable loop or explain why one is impossible.
- Teach acceptance rows to distinguish:
  - "behavior was tested"
  - "related check ran"
  - "substitute evidence was accepted"
- If no correct test surface exists, record that as an architecture or verification finding, not a quiet skipped check.
- Decide whether `feedback_loop` becomes a required DossierV1 field now or an optional field with validator warnings first. Prefer optional-with-warning first to avoid breaking existing users.

Acceptance:

- Bug-fix examples require red-capable evidence.
- PASS without a behavior-catching loop is blocked or explicitly waived for bugs and risky behavior changes.
- Existing broad evidence and source-fidelity rules still apply.

Verification:

```bash
npm run validate
```

### Packet 4: Ready-For-Agent Briefs For Planning Output

Purpose: make planning-only useful without forcing machine dossiers when no worker is about to run.

Target files:

- `skills/workflow-supervisor/SKILL.md`
- `skills/workflow-docs/SKILL.md`
- `skills/workflow-docs/references/templates.md`
- `skills/workflow-docs/references/workflow-control.md`
- `docs/artifacts.md`
- `docs/skill-reference.md`
- `tests/workflow-supervisor-lifecycle.test.mjs`

Work:

- Add `.workflow/AGENT-BRIEF.md` or inline agent brief as a workflow artifact.
- Define brief fields:

  ```md
  ## Agent Brief

  Category:
  Summary:
  Current behavior:
  Desired behavior:
  Key interfaces:
  Acceptance criteria:
  Out of scope:
  Recommended checks:
  Risk notes:
  Source references:
  ```

- Clarify brief versus dossier:
  - Brief: human-readable issue, PR repair, backlog handoff, or planning-only output.
  - Dossier: machine-checkable worker execution contract.
- State that a brief must be converted into a `DossierV1` before portable delegation.

Acceptance:

- `planning_only` can end with a ready-for-agent brief.
- Briefs are behavioral and avoid stale line-number instructions.
- Dossiers remain mandatory for delegated worker execution.

Verification:

```bash
npm run validate
```

### Packet 5: Optional Domain Context And ADR Awareness

Purpose: improve codebase work without creating a new prerequisite.

Target files:

- `skills/source-corpus/SKILL.md`
- `skills/workflow-supervisor/SKILL.md`
- `skills/workflow-docs/references/workflow-control.md`
- `docs/troubleshooting.md`
- `tests/workflow-supervisor-lifecycle.test.mjs`

Work:

- Add optional source classes:
  - `Domain context`: `CONTEXT.md`, mapped context docs, glossary files.
  - `Decision history`: ADRs, decision records, accepted architecture notes.
- For codebase work:
  - If `CONTEXT.md` or `CONTEXT-MAP.md` exists, read relevant context before naming units, acceptance rows, or briefs.
  - If `docs/adr/` exists, read relevant ADRs before proposing structural changes.
  - If neither exists, record `domain_context: absent` and continue unless terminology ambiguity blocks the task.
- Add guidance for offering a new glossary or ADR only when it prevents future confusion and is not just process overhead.

Acceptance:

- Existing domain docs are used when present.
- Missing domain docs do not block normal work.
- The source corpus output can record domain context presence, absence, or blocker status.

Verification:

```bash
npm run validate
```

### Packet 6: Prototype And Discovery Units

Purpose: give strict mode a bounded way to answer uncertainty before committing to implementation units.

Target files:

- `skills/workflow-supervisor/SKILL.md`
- `skills/work-unit/SKILL.md`
- `skills/workflow-docs/references/workflow-control.md`
- `docs/troubleshooting.md`
- `tests/workflow-supervisor-lifecycle.test.mjs`

Work:

- Add `prototype` or `discovery` unit type for questions that require runnable evidence.
- Required fields:

  ```yaml
  question:
  prototype_kind: logic | ui | integration | performance | other
  command_to_run:
  expected_observation:
  decision_record_target:
  delete_or_absorb_rule:
  production_surfaces_forbidden:
  ```

- Make clear that prototype output informs SPEC, brief, ADR, or work-unit split. It is not production implementation.
- Add stop gate: prototype cannot count as final PASS until it is deleted, absorbed, or captured as a decision.

Acceptance:

- Strict workflows can create discovery/prototype units before final implementation units.
- Prototype units have a cleanup or absorption rule.
- Prototype work cannot bypass final acceptance rows.

Verification:

```bash
npm run validate
```

### Packet 7: Context-Budget And Handoff Policy

Purpose: make long workflows resumable without using manual handoff as worker delegation.

Target files:

- `skills/loop-policy/SKILL.md`
- `skills/workflow-supervisor/SKILL.md`
- `skills/workflow-docs/SKILL.md`
- `skills/workflow-docs/references/goal-resume.md`
- `skills/workflow-docs/references/workflow-control.md`
- `docs/troubleshooting.md`
- `tests/workflow-supervisor-lifecycle.test.mjs`

Work:

- Add context-budget policy:
  - Keep source interpretation, SPEC, and work-unit split in one context when feasible.
  - Checkpoint before context pressure can degrade reasoning.
  - Use `.workflow/HANDOFF.md` for decisions, source coverage, unit status, checks, blockers, and next action.
  - Start fresh execution contexts per independent unit only through supported worker delegation or explicit user-approved continuation.
  - Manual handoff docs are resume artifacts, not primary worker transport.

- Add lean-mode rule: if memory, process count, or context churn threatens throughput, checkpoint the ledger and pause, batch-close, or escalate only the affected unit.

Acceptance:

- Context pressure is a named checkpoint trigger.
- Handoff artifacts preserve enough state for a fresh agent.
- Manual handoff remains forbidden as primary worker delegation.

Verification:

```bash
npm run validate
```

### Packet 8: Architecture Planning Output

Purpose: support codebase-health work without making architecture review a default phase.

Target files:

- `skills/workflow-supervisor/SKILL.md`
- `skills/workflow-docs/references/workflow-control.md`
- `docs/skill-reference.md`
- `docs/troubleshooting.md`
- `tests/workflow-supervisor-lifecycle.test.mjs`

Work:

- Add a planning-only architecture recommendation shape:

  ```yaml
  candidate:
  affected_modules_or_artifacts:
  current_friction:
  proposed_interface:
  test_surface:
  expected_leverage:
  expected_locality:
  recommendation_strength: strong | worth_exploring | speculative
  needs_user_decision:
  ```

- Use architecture vocabulary only when architecture is the task.
- State that implementation of an architecture candidate requires normal intake, units, and verification.

Acceptance:

- Architecture review stays `planning_only` until the user selects a candidate.
- Implementation does not start from an architecture recommendation without the normal workflow gates.

Verification:

```bash
npm run validate
```

### Packet 9: Reproducible Hardening Fixtures

Purpose: replace unsupported swarm-report confidence with repo-native evidence.

Target files:

- `tests/workflow-supervisor-lifecycle.test.mjs`
- `tests/fixtures/`
- `docs/troubleshooting.md`
- Optional new doc: `docs/evaluation.md`

Work:

- Do not import the gauntlet report.
- Create deterministic fixture cases inside the repo for the behaviors the old gauntlet tried to evaluate:
  - vague request stops at intake
  - lean bounded ticket uses compact ledger
  - lean 50+ unit backlog remains ledger-driven
  - hidden source requirements cannot become residual risk in PASS
  - dirty worktree boundaries are preserved
  - contradictory sources block
  - failing verifier requires repair and re-verification
  - unavailable test runner requires substitute evidence or BLOCKED
  - stale handoff invalidates downstream artifacts
  - publish/deploy stays gated by explicit authorization
- Make these tests inspect skill text, templates, schemas, or CLI behavior where feasible. Avoid fake narrative verdicts.
- For live worker delegation, rely on `delegate-doctor --probe --require-pass` as an environment certification command, not as a normal unit test.

Acceptance:

- Reproducible tests cover the production failure classes.
- The test suite does not depend on external swarm output.
- Documentation explains how to run live adapter probes separately from deterministic tests.

Verification:

```bash
npm run validate
workflow-supervisor delegate-doctor --agent all --probe --require-pass
```

The second command is an environment gate. It may be skipped in CI unless Codex and Claude Code CLIs are installed and authenticated.

## Suggested Delivery Order

1. Packet 0: Baseline Contract And Regression Harness
2. Packet 1: Route-First User Experience
3. Packet 2: Tracer-Bullet Work Units
4. Packet 3: Red-Capable Feedback Loops
5. Packet 4: Ready-For-Agent Briefs For Planning Output
6. Packet 5: Optional Domain Context And ADR Awareness
7. Packet 6: Prototype And Discovery Units
8. Packet 7: Context-Budget And Handoff Policy
9. Packet 8: Architecture Planning Output
10. Packet 9: Reproducible Hardening Fixtures

This order deliberately moves from user-facing routing to work-unit quality to verification quality, then to optional planning outputs and evaluation hardening.

## Release Gates

Before publishing a version containing these changes:

```bash
npm run validate
npm pack --dry-run
npm exec --yes workflow-supervisor@latest -- --help
```

If releasing from the local package rather than checking latest published behavior, also run:

```bash
node ./bin/workflow-skills.mjs validate
node --test tests/*.test.mjs
```

For environments that claim real portable delegation support:

```bash
workflow-supervisor delegate-doctor --agent all --probe --require-pass
```

Do not claim live worker delegation is certified unless that command passes in the target environment.

## Completion Criteria For The Whole Hardening Program

The program is complete only when:

- Route-first behavior is documented, encoded in the supervisor skill, and covered by tests.
- Work-unit output supports tracer-bullet shape and rejects unjustified horizontal feature slices.
- Acceptance and dossier guidance can distinguish red-capable evidence from weak related checks.
- `planning_only` can emit ready-for-agent briefs without creating execution dossiers.
- Existing domain context and ADRs are consumed when present, and absence is non-blocking.
- Prototype/discovery units exist as bounded evidence-gathering units with cleanup rules.
- Context-budget and handoff policy is explicit and does not replace delegated workers.
- Architecture planning output exists without becoming a default implementation phase.
- Deterministic repo-native tests cover the failure classes previously represented only by external gauntlet narratives.
- `npm run validate` passes.

## Open Decisions

These choices should be made before implementation:

1. Should `feedback_loop` become a required `DossierV1` field immediately, or start as optional with validation warnings?
2. Should ready-for-agent briefs be only workflow-doc templates, or should the CLI eventually get `emit-brief`?
3. Should architecture planning be a section in `workflow-supervisor`, or a separate future companion skill?
4. Which CI environments should run `delegate-doctor --probe`, given it depends on installed and authenticated external CLIs?
