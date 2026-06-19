# Skill Reference

## `workflow-supervisor`

Coordinate explicit supervised or agent-loop workflows with profile-based overhead. It starts by selecting `lean_work_unit_runner`, `strict_full_workflow`, or `planning_only`, then completes the intake needed for that profile before implementation, goal binding, worker delegation, or final disposition. The user must answer required intake items; the supervisor must not infer path, mode, delegation, final disposition, or boundaries from vague keywords. Lean mode is for large already-bounded work-unit backlogs: it keeps a compact ledger with unit id, source reference, scope, done signal, check, status, touched surfaces, and blockers, then executes one ready unit at a time with targeted checks and escalation gates. Strict mode creates a source-requirement coverage ledger and SPEC review gate before work units so controlling-source deliverables, roadmap phases, and exit criteria are either implemented, explicitly deferred, blocked, or marked non-material. In human-in-loop mode, the human can ask questions, request revisions, block, defer, or approve before execution. In autonomous goal mode, human clarification pauses resume from recorded workflow state after the answer updates only affected downstream artifacts. Strict mode can orchestrate named workers from dossiers through the portable delegate command or an approved native adapter. Native threads and subagents require a recorded native resource id plus a close result, such as `close_agent` for Codex subagents, before a worker is `closed`. Loading the skill itself does not spawn workers. It binds Codex goals only after complete intake and when the user or environment authorizes goal-oriented work, checks active goal state first, avoids unrelated active-goal collisions, and treats terminal blocked goals as history when resuming through workflow docs.

## `source-corpus`

Rank and reconcile sources when authority, freshness, contradictions, access rights, or evidence gaps change the safe next action. It supports `allowed_next_action`: discovery, provisional draft, production change, or blocked.

## `work-unit`

Split broad work into bounded units with objective, scope, dependencies, readiness, done criteria, verification, sequencing, and parallel-safety notes. It prevents broad roadmap or source-of-truth requests from collapsing into one giant unit unless all current-scope material requirements can be implemented and verified in that unit.

## `dossier-builder`

Create a delegation contract for one already-bounded work unit. Use it for another agent, automated worker run, future session, or formal worker prompt, not ordinary same-session direct work. Dossiers can include deterministic worker names, delegation transports, start conditions, worker prompts, checkpoints, and report schemas.

## `worker-roles`

Define role contracts and solo-mode phase separation. It prevents role bleed: verifiers editing implementation, implementers self-approving, repair authors inventing scope, and documenters turning unresolved questions into facts.

## `acceptance-matrix`

Create formal evidence-mapped acceptance rows for high-risk, supervised, ambiguous, resumable, or delegated workflows. Rows must preserve source requirement strength, including named systems, quantities, live integration language, and exit criteria; weaker proxy checks require explicit user waiver or scope narrowing.

## `loop-policy`

Define execution path, execution mode, worker delegation, approval gates, repair limits, parallel safety, no-progress rules, human-decision resume rules, and Codex goal tool policy.

## `workflow-docs`

Create durable workflow-state or documentation-production artifacts. Markdown artifacts default to `<workspace>/.workflow/` unless the user or project convention says otherwise. It includes `SPEC.md` for human-readable interpretation, Q&A, and approval before work units, plus `GOAL-STATE.md` and resume fields for blocked-goal history and human-decision continuation. It also supports inline briefs, tickets, design annotations, runbooks, decision logs, and other usable state media.
