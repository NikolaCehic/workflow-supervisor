# Skill Reference

## `workflow-supervisor`

Coordinate explicit supervised or agent-loop workflows. It always starts with a complete intake gate before planning, implementation, goal binding, worker delegation, or final disposition. The user must answer every intake item; the supervisor must not infer or skip steps from keywords. After complete intake, it selects either autonomous goal execution or human-in-the-loop execution, then orchestrates named workers from dossiers through the portable delegate command or an approved native adapter. Loading the skill itself does not spawn workers. It binds Codex goals only after complete intake and when the user or environment authorizes goal-oriented work, checks active goal state first, and avoids unrelated active-goal collisions.

## `source-corpus`

Rank and reconcile sources when authority, freshness, contradictions, access rights, or evidence gaps change the safe next action. It supports `allowed_next_action`: discovery, provisional draft, production change, or blocked.

## `work-unit`

Split broad work into bounded units with objective, scope, dependencies, readiness, done criteria, verification, sequencing, and parallel-safety notes.

## `dossier-builder`

Create a delegation contract for one already-bounded work unit. Use it for another agent, automated worker run, future session, or formal worker prompt, not ordinary same-session direct work. Dossiers can include deterministic worker names, delegation transports, start conditions, worker prompts, checkpoints, and report schemas.

## `worker-roles`

Define role contracts and solo-mode phase separation. It prevents role bleed: verifiers editing implementation, implementers self-approving, repair authors inventing scope, and documenters turning unresolved questions into facts.

## `acceptance-matrix`

Create formal evidence-mapped acceptance rows for high-risk, supervised, ambiguous, resumable, or delegated workflows.

## `loop-policy`

Define execution path, execution mode, worker delegation, approval gates, repair limits, parallel safety, no-progress rules, and Codex goal tool policy.

## `workflow-docs`

Create durable workflow-state or documentation-production artifacts. Markdown artifacts default to `<workspace>/.workflow/` unless the user or project convention says otherwise. It also supports inline briefs, tickets, design annotations, runbooks, decision logs, and other usable state media.
