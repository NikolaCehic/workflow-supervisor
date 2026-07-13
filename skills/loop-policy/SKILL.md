---
name: loop-policy
description: Define retries, budgets, approval gates, parallel safety, delegation, escalation, continuation, and resume rules for an active supervised workflow. Use only when the user explicitly invokes $loop-policy or an active workflow-supervisor needs non-obvious execution policy for multi-agent, long-running, autonomous, human-in-loop, approval-gated, or repair-loop work. Do not use for ordinary one-shot tasks, a single failing command, routine safe retries, or decisions the current agent can make reversibly.
---

# Loop Policy

Define only the policy needed to keep an active loop safe and productive.

## Safe Defaults

Infer reversible mechanics from the task instead of asking the user to configure the agent:

```yaml
mode: sequential
execution_path: autonomous_goal unless the user or governing source requires human_in_loop checkpoints
parallel_allowed_when: read-only work or proven disjoint mutable surfaces
delegation: current-session or supported workers when materially useful
repair_review_checkpoint_per_unit: 2 failed attempts before re-evaluating evidence, scope, or approach
final_disposition: keep_local unless explicitly authorized otherwise
state_medium: inline for short work; compact ledger for long work
```

Treat “use your judgment” as permission to choose safe defaults. Ask only when a choice changes scope, cost, external visibility, credentials, production, destructive behavior, or another user-owned decision.

## Policy Dimensions

- Profile: `lean_work_unit_runner`, `strict_full_workflow`, or `planning_only`.
- Execution path: `autonomous_goal` or `human_in_loop`.
- Mode: sequential, parallel, staged parallel, or discovery-first.
- Approval: only at material human decisions or explicitly requested checkpoints.
- Delegation: role, transport capabilities, start condition, terminal report, and supported lifecycle actions.
- Repair: retry limit and required new evidence.
- Budget: time, tokens, commands, cost, context, or changed surfaces.
- Escalation: user decision, specialist worker, narrower unit, or stop.
- Completion: evidence required before done.
- Resume: minimum durable state before a pause or context boundary.
- Mutation conflict: whether units share files, artifacts, datasets, decisions, or external systems.

## Authority Gates

Require explicit authorization before publication, deploy, submission, push/merge/PR creation, credentials, paid operations, production changes, destructive actions, external messages, or scope expansion. An autonomous instruction authorizes persistence inside existing scope, not broader authority.

## Delegation Policy

Use only transports and lifecycle operations exposed by the current environment. Do not name or require platform operations that are absent from the tool contract. A completed native worker may be terminal without a separate cleanup call when lifecycle is platform-managed.

Select roles on demand:

- implementer/executor only for mutation or production
- verifier when independent evidence is material
- repair only after an actionable `FAIL` or `BLOCKED`
- documenter only for requested or necessary durable state

## Parallel Safety

Parallelize independent read-only research by default when useful. Parallelize mutation only when ownership is proven disjoint. If overlap is unclear, map ownership first or run sequentially.

## No-Progress Detection

Treat a loop as no-progress when:

- the same material input remains missing
- repairs do not address verifier findings
- verification repeats without new evidence
- scope expands to avoid completion
- checks remain unavailable and no accepted substitute exists
- context/process churn costs more than the next unit advances

On no-progress, stop the affected unit, preserve state, and ask or escalate. Do not restart unrelated completed work.

A numeric repair limit is a review checkpoint, not an arbitrary quality ceiling. Continue only when a changed hypothesis, narrowed unit, new evidence, or newly authorized approach makes progress plausible; otherwise stop the affected unit instead of burning retries.

## Context Budget And Resume

Checkpoint before context pressure threatens source fidelity or verification. Preserve objective, boundaries, sources, decisions, unit states, evidence, blockers, and exact next action in one compact ledger or handoff.

When a human answer arrives, refresh only affected coverage, units, acceptance rows, dossiers, or verification. Invalidate stale downstream artifacts; do not repeat the whole intake.

## Goal Policy

Bind a Codex goal only when explicitly requested or authorized by the environment. Inspect current goal state first, reuse a relevant active goal, avoid unrelated active goals, and update only for supported terminal outcomes. A first unit blocker is not a terminal goal blocker while meaningful resume work remains.

## Output Shape

```yaml
workflow:
profile:
execution_path: autonomous_goal | human_in_loop
mode:
safe_defaults:
material_questions:
approval_gates:
delegation_policy:
transport_capabilities:
repair_review_checkpoint_per_unit:
parallel_rules:
budgets:
context_checkpoint:
escalation_rules:
stop_gates:
completion_rule:
resume_artifact:
goal_policy:
final_disposition_policy:
```
