---
name: workflow-supervisor
description: Coordinate supervised multi-agent workflows. Trigger whenever the user explicitly invokes workflow-supervisor, $workflow-supervisor, supervised workflow, dossiers, work units, worker agents, handoffs, approval gates, durable resume, or workflow-state documentation. When explicitly invoked, always run the full strict supervisor workflow regardless of task size; do not downscope, skip human approval or complete intake, skip dossiers, skip work units, skip worker-agent contracts, skip worker handoffs, or skip verification because a task appears simple. When not explicitly invoked, use only for workflows with hard supervisor triggers such as multi-agent handoff, durable resume, high-risk verification, contradictory or missing sources, multi-unit scope, repair loops, approval gates, or workflow-state documentation.
---

# Workflow Supervisor

Use this skill as the coordinating spine for supervised multi-agent work. The supervisor owns decomposition, worker-agent handoff quality, loop discipline, stop gates, and outcome reporting. It may do source discovery and reporting itself, but implementation, verification, repair-ticket writing, and documentation must be treated as separate worker-agent responsibilities when an automated worker path is available. Native threads, subagents, or the portable delegate command are transports for those worker agents.

## Strict Explicit Invocation Contract

When the user explicitly invokes `workflow-supervisor`, `$workflow-supervisor`, or says to use this skill, the workflow is in `strict_full_workflow` mode. Task size is irrelevant. Do not decide that a request is too small, too easy, local-only, or single-file to receive the full workflow.

Strict mode always requires:

1. Complete intake before planning, goal creation, worker delegation, implementation, publication, or irreversible action.
2. A human approval question before implementation unless completed intake explicitly selects `autonomous_goal`.
3. A source corpus map, even if the source corpus is only "user prompt plus current workspace".
4. A source-requirement coverage ledger before work-unit finalization.
5. At least one bounded work unit, even for a tiny change. Use `WU-001` when there is only one unit.
6. A dossier for each implementation work unit before implementation begins.
7. An acceptance matrix or acceptance draft with evidence expectations before implementation begins.
8. A worker-agent plan with implementer, verifier, repair-author, and documenter agents.
9. A worker lifecycle record using `planned -> handed_off -> acknowledged -> reported -> verified -> closed`.
10. Verification labeled as `self-check`, `focused-check`, or `independent-verifier`.
11. A final disposition question or recorded completed-intake final disposition after verification.

Worker agents are mandatory when the environment provides worker, subagent, thread, or portable delegation tools. The supervisor must hand off implementation, verification, repair-authoring when needed, and documentation to separate agents with scoped dossiers and the required report schema. Run worker agents sequentially by default unless completed intake explicitly authorizes parallelism.

If the environment cannot create, message, or delegate to worker agents, record `worker_agent_unavailable` and stop for the human decision unless completed intake explicitly selected `same_session_phased`. Do not silently collapse worker agents into same-session work.

Do not nest supervisors recursively. A worker agent that receives a supervisor-scoped dossier must perform its assigned role instead of spawning another supervisor layer unless the parent supervisor explicitly asks for a child supervisor.

## Domain Neutrality

This workflow must work without a repository, codebase, existing docs, or installed project conventions. Treat "surface" as any mutable target: files, documents, designs, datasets, decisions, prompts, workflows, tickets, configs, UI states, business processes, or research artifacts. Treat "check" as any evidence-producing method: tests, commands, inspections, rubrics, document diffs, stakeholder decisions, examples, screenshots, source citations, or manual verification.

When no source corpus exists, make the first work unit a discovery/intake unit instead of inventing prerequisites. Do not require `AGENTS.md`, a repo, commands, or Markdown files unless the specific task provides them or needs them.

## Source Requirement Coverage Gate

After the source corpus map and before final work units, extract the material requirements from the controlling sources into a coverage ledger. Include explicit user constraints, source deliverables, roadmap phases, exit criteria, named integrations, scale targets, verification requirements, and forbidden surfaces.

For every source requirement, record:

- source reference: file, ticket, prompt, section, line, or artifact id when available
- requirement statement using the source's own strength, including numbers, named systems, and "must"/"exit criteria" language
- disposition: `in_current_scope`, `explicit_user_deferred`, `blocked_needs_decision`, `out_of_scope_by_user`, or `non_material_context`
- planned work unit id or blocking question
- planned acceptance row id or waiver evidence

Do not weaken requirements while translating them into units or acceptance rows. Examples of forbidden downgrades:

- "live service import and query verification" to "generated export or optional loader"
- "required validation corpus size" to "small starter checks exist"
- "named providers A and B" to "one provider plus an extension hook"
- "required batch analysis and report generation" to "metadata says reports are possible"
- "provider-backed extraction and indexing" to "deterministic placeholder logic"

Treat roadmap phases, source "Build" lists, and exit criteria as material when the user says the source is the source of truth, asks to implement everything, or does not explicitly narrow the scope. If the user wants only a first slice, record every non-slice material item as `explicit_user_deferred`; otherwise create work units for it or stop as `blocked_needs_decision`.

Create exactly one implementation work unit only when all current-scope material requirements can be implemented and verified inside that one unit without hiding source requirements in residual risks, skipped checks, future work, or next recommended actions. For multi-phase, dependency-heavy, or roadmap-driven work, create one work unit per independently verifiable phase, integration, data slice, or risk boundary.

Before final closeout, audit the coverage ledger. The workflow may be PASS only when every material requirement is mapped to a PASS acceptance row, explicitly waived by the user, or blocked and reported as not complete.

## Codex Goal Lifecycle

This skill is loop-oriented. Complete intake is mandatory before goal binding. After all required intake decisions are answered, bind the workflow to a Codex goal only when the completed intake and governing environment both authorize goal-oriented work.

Use this lifecycle:

1. Confirm the complete intake gate is satisfied. If any required intake answer is missing or ambiguous, ask for the missing answer(s) and stop.
2. Call `get_goal` or the environment's equivalent.
3. Classify goal state: `none`, `active relevant`, `active unrelated`, `complete old`, `blocked old`, or `tool unavailable`.
4. If an active relevant goal exists, reuse it.
5. If an active unrelated goal exists, do not create, reuse, complete, block, or update it. Ask the user whether to switch goals or continue with goal binding skipped.
6. If no active goal exists and completed intake authorizes goal binding, call `create_goal` at most once with a concrete objective.
7. Do not create a goal for incomplete intake or when the user says not to.
8. Keep the goal objective stable. Track tactical steps in the plan, dossier, workflow docs, or `.workflow/GOAL-STATE.md` rather than trying to rewrite the goal.
9. Use `update_goal` only for terminal `complete` or `blocked` states when the environment supports that action.
10. Mark the goal complete only after acceptance evidence supports completion and no required supervisor work remains.
11. Distinguish workflow/unit BLOCKED from Codex goal blocked. Mark a Codex goal blocked only after the same material blocker repeats across the required consecutive goal turns and no meaningful progress remains.
12. On resume after compaction or continuation, read the active goal first, then reconcile workflow docs and current artifacts.

If the environment has no goal tool or goal creation is not permitted, state the intended goal objective in the supervisor report and continue with workflow docs or another state artifact as the fallback state container.

## Operating Contract

- After complete intake, ground the workflow in sources before creating work units.
- Treat skill use as instruction loading in the current agent, not as worker delegation, thread creation, subagent creation, goal, branch, commit, PR, publication, or other side-effect creation.
- Run the complete intake gate before goal creation, worker delegation, implementation, publication, or other irreversible action.
- Do not infer execution path, mode, delegation, final disposition, or boundaries from keywords, action verbs, or intent guesses.
- Classify the workflow as `autonomous_goal` or `human_in_loop` only from completed intake answers before delegating workers or beginning implementation.
- Explicit invocation always requires complete intake, work units, dossiers, worker-agent contracts, scoped handoffs, report schema, and verification; do this even for trivial tasks.
- Preserve source-scope fidelity: do not translate controlling-source requirements into weaker proxy checks unless the user explicitly approves the narrower scope or waiver.
- Always produce a plan after complete intake. In `human_in_loop`, make it an approval packet and stop for approval. In `autonomous_goal`, make it an execution plan and continue only when the completed intake authorizes that path.
- Do not begin implementation until complete intake and the path gate are satisfied, at least one work unit exists, at least one concrete dossier exists, worker-agent contracts exist, and no stop gate applies.
- Delegate workers only through an automated supported delegation transport after complete intake and the path gate authorize delegation. If no supported transport exists, use same-session phased mode only when intake allowed it; otherwise stop as `worker_agent_unavailable`.
- Do not start implementer, verifier, repair-author, or documenter workers before complete intake and the path gate are satisfied; role-specific start conditions are additional gates after that.
- Keep roles separate: implementers implement, verifiers verify, repair authors write tickets, documenters update workflow artifacts, and the supervisor coordinates.
- Treat same-session verification as a self-check, not independent verification. Separate verifier-agent verification may be labeled `independent-verifier` only when genuinely performed by a separate worker agent or thread.
- Prefer explicit PASS/FAIL/BLOCKED states over soft completion language.
- Stop instead of improvising when sources are missing, contradictory, materially stale, or too vague to produce acceptance criteria.
- Treat unimplemented material source requirements found in residual risks, skipped checks, future work, or `next_recommended_action` as open work, not PASS evidence.
- Keep provenance optional; require enough outcome detail for another agent to resume.
- Treat companion skills as optional phase tools, not an automatic cascade. Use the smallest set needed for the current risk.

## Skills And Workers

Using this skill does not spawn a worker, thread, or subagent. It coordinates the current agent until a separate automated execution mechanism is explicitly available and authorized.

Treat these as distinct mechanisms:

- Skill: reusable instructions loaded into the current agent.
- Worker: a role-scoped automated execution run that receives one dossier and returns one terminal report.
- Portable worker delegation: the package helper command, `workflow-supervisor delegate --agent <agent> --role <role> --unit <unit-id> --cwd <workspace> --dossier <path>`, which invokes an installed platform CLI and normalizes its report.
- Native thread or subagent: an environment-specific transport a worker adapter may use when it is available and authorized.
- Same-session phased mode: the current agent performs roles sequentially. Verification in this mode is a self-check, not independent verification.

Start workers only after complete intake and the path gate are satisfied, at least one work unit exists, a concrete dossier exists, the loop policy authorizes delegation, and the environment exposes an automated supported transport. If environment rules require explicit user approval for user-visible native thread creation, obtain it before using that transport. Do not use manual copy/paste handoff as the primary path. If automated delegation is unavailable, mark the unit `worker_agent_unavailable` unless completed intake explicitly selected same-session phased work.

## Worker Report Schema

Every worker report back to the supervisor must use this schema:

```text
status: PASS | FAIL | BLOCKED | PARTIAL
worker_id:
role: implementer | verifier | repair-author | documenter
work_unit_id:
dossier_id:
summary:
changed_files:
acceptance_evidence:
checks_run:
skipped_checks:
blockers:
residual_risks:
next_recommended_action:
```

Implementers may edit only allowed surfaces from the dossier. Verifiers must not edit. Repair authors write repair tickets from failed acceptance rows and must not expand scope. Documenters update only approved workflow or documentation surfaces after source, implementation, verification, or repair evidence exists.

## Intake Gate

Every supervisor invocation must pass the complete intake gate before creating a goal, decomposing deeply, delegating workers, implementing, publishing, or taking irreversible action. If the current conversation already contains explicit answers to every required intake decision, record those answers and proceed. Otherwise, ask the intake packet and stop.

Do not use keywords to skip intake. Words such as "autonomous", "agent loop", "work until done", "approval", "generate", or "create" are not substitutes for completed intake answers.

Required intake decisions:

- Objective and source: what artifact, spec, repo path, document, ticket, or source set controls the work.
- Execution path: `autonomous_goal` or `human_in_loop`.
- Execution mode: `sequential`, `parallel_where_safe`, or `staged_parallel`.
- Delegation: `automated_worker_delegation`, `native_threads_or_subagents_if_available`, or `same_session_phased`.
- Final disposition: `keep_local_when_green`, `open_pr_when_green`, `push_main_when_green`, `deploy_when_green`, `publish_when_green`, or `ask_at_end`.
- Mutation boundaries: local files, dependency installs, network calls, external services, credentials, destructive operations, and any forbidden surfaces.
- State artifacts: whether to create workflow docs under `<workspace>/.workflow/`, use another named artifact directory, or keep state inline.

If the completed intake selects `.workflow/` state artifacts in a Git-backed codebase, ensure `<workspace>/.gitignore` contains `.workflow/` before creating those artifacts. Create `.gitignore` if needed. Treat `.workflow/` as local supervisor memory that must not be staged, committed, pushed, or included in a PR unless the user explicitly names workflow state as a final deliverable.

Use this question shape for the first intake ask:

```text
Before I start the supervisor loop, answer every intake item:
1. Objective and source: what artifact, spec, repo path, document, ticket, or source set controls the work?
2. Execution path: autonomous_goal or human_in_loop?
3. Mode: sequential, parallel where safe, or staged parallel?
4. Delegation: automated worker delegation, native threads/subagents if available, or same-session phased?
5. Final disposition: keep local, open PR, push main, deploy/publish, or ask at the end?
6. Boundaries: may I install dependencies, call external services, use credentials, or only edit local files?
7. State artifacts: create `.workflow/` docs, use another artifact directory, or keep state inline?
```

If the user answers only some intake items, ask only the unanswered or ambiguous item(s) again and stop. If the user says "use your judgment", treat that item as unanswered; do not substitute defaults. Continue prompting until every required intake decision has an explicit user answer.

Treat `autonomous_goal`, PR creation, direct push, deploy, publication, paid operations, production data changes, and credential use as satisfied only by completed intake answers, not by keywords elsewhere in the prompt.

Negative example: "Using Workflow Supervisor, generate an API and create the project" is not autonomous authorization and is not complete intake. It names the supervisor and objective, but leaves required intake decisions unresolved. Ask the complete intake packet and stop before implementation.

## Supervisor Loop

1. Run the complete intake gate. Record explicit user answers. If any required intake answer is missing, vague, or delegated to judgment, ask for the unresolved item(s) and stop.
2. Restate the objective, constraints, non-goals, known sources, and unknowns from the completed intake.
3. Bind or reconcile the Codex goal only after complete intake and only when no unrelated active goal prevents binding.
4. Build or request a source corpus map. Use `$source-corpus` when source authority, freshness, or contradictions matter.
5. Create the source-requirement coverage ledger. If any material source requirement cannot be classified, mapped to work, or explicitly deferred, stop and ask for the missing scope decision.
6. Split the objective into bounded work units from the coverage ledger. Use `$work-unit` for ambiguous or multi-phase goals. If the task is tiny and the ledger has no deferred material requirements, create exactly one work unit named `WU-001`.
7. Choose a loop policy before starting work: sequential or parallel, retry limits, approval gates, budgets, goal update cadence, and blocker rules. Use `$loop-policy` when the policy is not obvious.
8. Build dossiers for the first implementation units and any planned verification, repair, or documentation workers. Use `$dossier-builder` when delegating work to another agent or when the task has boundaries.
9. Assign worker roles with explicit allowed and forbidden behavior. Use `$worker-roles` for multi-agent, native-thread, or portable-worker work.
10. Select the execution path:
   - `human_in_loop`: use when selected in completed intake or when a higher-priority rule requires human approval after intake.
   - `autonomous_goal`: use only when selected in completed intake and no higher-priority rule requires human approval.
11. If `.workflow/` artifacts will be used in a Git-backed codebase, ensure `.gitignore` contains `.workflow/` before writing them.
12. Present the path-specific plan:
   - `human_in_loop`: approval packet with plan, work units, worker delegation plan, approval gates, stop gates, and first dossiers. Stop until the human approves or revises it.
   - `autonomous_goal`: execution plan with the same contents plus autonomous boundaries, allowed actions, stop gates, repair limits, and final disposition policy. Continue after recording it only when complete intake authorized that path.
13. After the path gate is satisfied, delegate named workers from the worker delegation plan through the selected automated transport. Send each worker only its role, dossier, sources, acceptance rows, stop gates, and report schema.
14. Collect one terminal report from each worker. If a worker asks a human-facing question, convert it to `BLOCKED` and have the supervisor ask the user only when the path policy permits.
15. Verify independently where possible. Use `$acceptance-matrix` to map every requirement to evidence. Start verifier workers only after the relevant implementer report is available.
16. If verification FAILs, convert findings into repair tickets and route them to a repair-author or implementer repair worker. Do not expand scope during repair.
17. Re-run verification after repairs. Continue only until PASS, BLOCKED, repair limit, or path stop.
18. Start documenter workers only after source, implementation, verification, or repair evidence exists, unless the documenter is explicitly creating planning state.
19. If verification BLOCKs, report the blocker and stop or ask for the missing decision.
20. Use `$workflow-docs` to create or refresh reusable Markdown artifacts under `<workspace>/.workflow/` when the workflow must persist across context loss, agents, or sessions.
21. Audit skipped checks, residual risks, future work, and next recommended actions against the source-requirement coverage ledger. If any material source requirement appears there without an explicit user deferral or waiver, mark the workflow FAIL/BLOCKED and create more work units or ask for a scope decision.
22. When all material acceptance rows are PASS or waived, apply the final disposition policy:
   - `human_in_loop`: use the completed intake final disposition; if it is `ask_at_end`, ask the human to choose PR, push main, or keep local.
   - `autonomous_goal`: use the completed intake final disposition. If it is `ask_at_end`, stop and ask before taking any final disposition action.
23. Finish with an outcome report that names execution path, goal status, sources, coverage ledger disposition, work units, delegated workers, checks, skipped checks, residual risks, final disposition decision, and next action.

## Execution Paths

### Human-In-Loop

Use `human_in_loop` when the completed intake selects it, or when a higher-priority rule requires human approval after intake. If the user has not answered the execution-path intake item, stop and ask for that answer instead of inferring a path.

The first supervisor deliverable is a plan for approval, not implementation. The approval packet must include:

- objective and non-goals
- source corpus summary and gaps
- source-requirement coverage ledger summary
- work units and sequence
- worker delegation plan with names, roles, dossiers, dependencies, start conditions, and transport
- acceptance matrix summary
- approval gates and stop gates
- expected final disposition choices: PR, push main, or keep local

Stop until the human approves or revises the packet.

### Autonomous Goal

Use `autonomous_goal` only when the completed intake selects it. Phrases such as "work autonomously until done", "run the full loop without waiting for me", or "do not wait" do not skip the required intake packet. The autonomous plan must include:

- objective and non-goals
- source corpus summary and gaps
- source-requirement coverage ledger summary
- work units and sequence
- worker delegation plan with names, roles, dossiers, dependencies, start conditions, and transport
- acceptance matrix summary
- autonomous boundaries and forbidden actions
- stop gates, repair limits, budgets, and escalation rules
- final disposition policy: `open_pr_when_green`, `push_main_when_green`, or `keep_local_when_green`

The final disposition must come from the completed intake. Direct push to the main branch, PR creation, deploy, publication, paid operations, production data changes, credential use, and destructive operations require explicit answers in the relevant intake fields.

Even in `autonomous_goal`, stop and ask when any required intake answer is missing or ambiguous, required sources are missing, acceptance cannot be verified, a worker needs scope expansion, an irreversible action lacks intake authorization, or higher-priority instructions require approval.

## Portable Worker Delegation

After the path gate is satisfied, use the selected automated worker transport. The portable default is the package helper:

```text
workflow-supervisor delegate --agent <agent> --role <role> --unit <unit-id> --cwd <workspace> --dossier <path>
```

Before calling `delegate`, validate the dossier:

```text
workflow-supervisor validate-dossier <path> --role <role> --unit <unit-id> --json
```

If the dossier does not pass `DossierV1` validation, do not start the worker. Create a discovery dossier, ask for the missing decision, or mark the unit BLOCKED.

Adapters may use native threads, native subagents, or one-shot CLI execution underneath, but the supervisor consumes only the normalized worker report. Use `workflow-supervisor delegate-doctor --agent <agent> --probe` to test the installed local adapter before relying on it for a workflow. If automated delegation is unavailable, mark execution as `worker_agent_unavailable` unless completed intake selected `same_session_phased`.

Name workers deterministically from the workflow, unit, role, and dossier:

```text
wf/<workflow-slug>/<unit-id>-<role>-<dossier-slug>
```

Examples:

```text
wf/better-auth/U1-implementer-backend-auth-instance
wf/better-auth/U1-verifier-backend-auth-instance
wf/better-auth/U1-repair-auth-route-order
wf/better-auth/U6-documenter-outcome-docs
```

Use one worker per role per work unit unless the loop policy explicitly allows batching. Worker prompts must be scoped:

- kickoff: role, dossier, sources, acceptance rows, stop gates, report schema
- checkpoint: request status, blockers, or clarification without expanding scope
- repair delegation: failed rows, verifier findings, allowed repair surfaces, checks
- closeout: collect terminal report and confirm no further action is expected

Workers must not ask the human questions directly, choose final disposition, approve plans, expand scope, or message each other. They return `PASS`, `FAIL`, or `BLOCKED` using the assigned report schema. The supervisor routes blockers, repairs, and human questions.

Final disposition prompt shape:

```text
Verification is green and repair loops are closed. Choose one:
1. Open a PR
2. Push directly to main
3. Keep changes local
```

## Minimum Dossier Gate

Do not hand off or implement a work unit unless the dossier can name:

- objective and non-goals
- source corpus used and missing
- allowed and forbidden surfaces or artifacts
- acceptance matrix or acceptance draft
- required checks or evidence
- adversarial checks
- stop gates
- worker report schema
- worker name, transport, and role start condition when delegation is planned

The dossier must be machine-checkable as `DossierV1`. The portable delegate command refuses missing or invalid dossiers with `reason: invalid_dossier`; no worker process should start when the gate fails.

Boundaries may be mutable artifacts, source claims, decisions, audiences, data fields, design areas, process steps, publication rights, or forbidden claims. For read-only advisory work, naming forbidden claims and decision limits can satisfy the boundary requirement.

If any item is unknown and material, stop and ask for the missing decision or mark the unit BLOCKED.

## Stop Gates

Stop when:

- any required intake answer is missing, vague, delegated to judgment, or contradicted by another intake answer
- source authority cannot be established
- sources contradict each other on a material requirement
- the requested scope cannot fit into a bounded work unit
- the coverage ledger is missing, incomplete, or contains material requirements classified as future work without explicit user deferral
- mandatory approval packet, work unit, dossier, worker-agent contract, or acceptance matrix is missing
- allowed and forbidden surfaces cannot be named
- acceptance cannot be verified with evidence
- a verifier is asked to edit or an implementer is asked to self-approve
- repair loops repeat without new evidence
- the user requires approval before continuing
- the selected path is `autonomous_goal` but it was inferred from prompt wording instead of a completed intake answer
- an irreversible action is requested without explicit authorization in the completed intake
- a worker asks to expand scope without supervisor or human approval
- final verification is not green and no waiver evidence exists
- residual risks, skipped checks, future work, or next actions contain unimplemented material source requirements

## Final Report Shape

Report:

- Status: PASS, FAIL, BLOCKED, or PARTIAL
- Execution path: autonomous_goal or human_in_loop
- Goal status and whether a Codex goal was created, reused, skipped, completed, or blocked
- Objective handled
- Sources used and gaps
- Source-requirement coverage ledger summary, including deferred or blocked material requirements
- Work units completed or remaining
- Approval question id and whether `WAITING_FOR_HUMAN -> ACTIVE` occurred
- Dossiers created or missing
- Workers delegated, blocked, unavailable, or skipped
- Worker lifecycle status for each role
- Verification evidence
- Repairs performed or recommended
- Checks run and skipped
- Residual risks
- Final disposition: PR, push main, keep local, or undecided
- Resume point or next action
