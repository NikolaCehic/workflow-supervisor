---
name: workflow-supervisor
description: Coordinate supervised workflows with profile-based overhead. Trigger whenever the user explicitly invokes workflow-supervisor, $workflow-supervisor, supervised workflow, lean work-unit runner, dossiers, work units, worker agents, handoffs, approval gates, durable resume, or workflow-state documentation. Route first before profile selection. If not explicitly invoked and the work is a small clear edit with obvious files and acceptance, do not invoke Workflow Supervisor. Execute directly. When explicitly invoked, first select the correct profile: lean_work_unit_runner for large already-bounded backlogs or low-footprint direct execution, strict_full_workflow for ambiguous/high-risk/source-of-truth/delegated work, or planning_only for intake and sequencing. Do not run strict ceremony just because the skill was named. When not explicitly invoked, use only for workflows with hard supervisor triggers such as multi-agent handoff, durable resume, high-risk verification, contradictory or missing sources, multi-unit scope, repair loops, approval gates, or workflow-state documentation.
---

# Workflow Supervisor

Use this skill as the coordinating spine for supervised work. The supervisor owns decomposition, execution profile selection, loop discipline, stop gates, optional worker-agent handoff quality, and outcome reporting. It may do source discovery, implementation, focused verification, and reporting itself in lean mode. In strict mode, implementation, verification, repair-ticket writing, and documentation must be treated as separate worker-agent responsibilities when an automated worker path is available. Native threads, subagents, or the portable delegate command are transports for those worker agents.

## Route First

Before profile selection, decide whether this is supervisor work at all.

If Workflow Supervisor was not explicitly invoked and the task is a small, clear edit with obvious files and acceptance, do not invoke this skill. Execute directly with normal repository inspection and the relevant check.

When Workflow Supervisor is explicitly invoked, do not silently skip it. Select the proportional profile and keep the overhead as small as that profile allows.

| Situation | Route |
|---|---|
| Small, clear edit with obvious files and acceptance | Do not use Workflow Supervisor. Execute directly. |
| Large bounded backlog with clear unit done signals | `lean_work_unit_runner`. |
| Broad, ambiguous, source-of-truth, delegated, security-sensitive, dirty-state, release, resume, or externally published work | `strict_full_workflow`. |
| Sequencing, risk review, or backlog shaping only | `planning_only`. |
| Runnable uncertainty before implementation | Create a discovery or prototype unit first. |

## Execution Profiles

When the user explicitly invokes `workflow-supervisor`, `$workflow-supervisor`, or says to use this skill, first classify the workflow profile before creating heavy artifacts, goals, worker plans, dossiers, or subagents.

Use `lean_work_unit_runner` when the source already contains bounded work units, tickets, issues, checklist rows, or backlog entries and the user's priority is throughput, low memory, direct execution, or many pure units. Lean mode is for "do the next unit" execution, not for interpreting a broad source of truth from scratch.

Use `strict_full_workflow` when the task is ambiguous, high-risk, source-of-truth driven, regulated, delegated to multiple workers, externally published, security-sensitive, cross-system, or missing clear work-unit boundaries.

Use `planning_only` when the user wants intake, backlog shaping, sequencing, risk review, or a plan without implementation.

If the profile is unclear after reading the user's request and controlling source, ask one profile question and stop. Do not default to strict ceremony merely because the skill was named.

### Lean Work Unit Runner

Lean mode optimizes for large-unit throughput while preserving non-ambiguity and human-verifiable state. It keeps work units as the backbone and removes per-unit ceremony that does not directly improve execution.

Lean mode requires exactly one upfront scope contract before the first unit starts:

- objective and controlling backlog/source
- selected profile: `lean_work_unit_runner`
- execution path: `autonomous_goal` or `human_in_loop`
- execution mode: usually `sequential`; parallel only for proven disjoint surfaces
- delegation: default `same_session_phased`; workers/subagents only with explicit authorization for a specific batch or risk
- final disposition and mutation boundaries
- state medium: one compact ledger, usually inline or `.workflow/LEDGER.md`
- batch size or checkpoint cadence for human review

Lean mode requires a backlog where each executable unit has:

```yaml
id:
source_ref:
slice_type:
scope:
observable_behavior:
done:
check:
status: pending | active | pass | fail | blocked | escalated
notes:
```

Do not start a lean unit unless its boundary and done signal are clear. If a unit lacks `scope`, `done`, or `check`, mark it `blocked` and ask for the smallest missing decision, or split it into smaller units. Do not hide ambiguity in notes.

For product or integration behavior, prefer tracer-bullet units that expose one observable behavior across the smallest useful set of layers. A product implementation unit must name `observable_behavior` and `demo_or_verification`, or explicitly use a non-product `slice_type` such as `prefactor`, `migration`, `research`, `document`, or `risk_boundary` with a `horizontal_slice_justification`.

Lean per-unit loop:

1. Select the next ready unit from the ledger.
2. Inspect only the files, artifacts, or source slices needed for that unit.
3. Apply the smallest implementation that satisfies the unit.
4. Run the unit's targeted check, or record the exact reason the check is blocked.
5. Update one ledger row with status, touched surfaces, check result, and residual risk if any.
6. Continue to the next ready unit until the batch checkpoint, blocker, resource gate, or final disposition.

Lean mode must not create per-unit SPEC files, full dossiers, worker maps, repair-ticket documents, or documenter passes by default. Use inline unit contracts and one compact ledger. Batch documentation and outcome reporting at checkpoints or final closeout.

Escalate a lean unit to `strict_full_workflow` or pause for human review when:

- source requirements conflict or are materially incomplete
- the unit touches broad architecture, security, data loss, credentials, production systems, billing, legal/compliance, public API contracts, migrations, or destructive operations
- the unit cannot name a targeted check or human-inspectable evidence
- multiple units unexpectedly touch the same shared surface and need re-sequencing
- repair repeats without new evidence
- the user asks for independent verification, subagents, PR, deploy, publish, or external-service action
- memory, process count, broad scans, or context churn threatens execution throughput

Lean verification is proportional. Use `focused-check` for the unit or batch. Use `independent-verifier` only when a risk trigger or user instruction justifies the extra cost. A lean PASS requires the ledger to show every completed unit's source reference, done signal, check or substitute evidence, and touched surfaces.

### Strict Full Workflow

Strict mode always requires:

1. Complete intake before planning, goal creation, worker delegation, implementation, publication, or irreversible action.
2. A human approval question before implementation unless completed intake explicitly selects `autonomous_goal`.
3. A source corpus map, even if the source corpus is only "user prompt plus current workspace".
4. A source-requirement coverage ledger before work-unit finalization.
5. A SPEC review packet or `.workflow/SPEC.md` before work-unit finalization.
6. At least one bounded work unit, even for a tiny change. Use `WU-001` when there is only one unit.
7. A dossier for each implementation work unit before implementation begins.
8. An acceptance matrix or acceptance draft with evidence expectations before implementation begins.
9. A worker-agent plan with implementer, verifier, repair-author, and documenter agents.
10. A worker lifecycle record using `planned -> handed_off -> acknowledged -> reported -> verified -> resource_closed -> closed`.
11. Verification labeled as `self-check`, `focused-check`, or `independent-verifier`.
12. A final disposition question or recorded completed-intake final disposition after verification.

Worker agents are mandatory when strict mode is selected and the environment provides worker, subagent, thread, or portable delegation tools with a complete lifecycle: start, terminal report collection, and resource close. The supervisor must hand off implementation, verification, repair-authoring when needed, and documentation to separate agents with scoped dossiers and the required report schema. Run worker agents sequentially by default unless completed intake explicitly authorizes parallelism.

If the environment cannot create, message, delegate to, and close worker agents, record `worker_agent_unavailable` or `worker_resource_close_unavailable` and stop for the human decision unless completed intake explicitly selected `same_session_phased`. Do not silently collapse worker agents into same-session work.

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

For user-facing behavior or integration behavior, make work units tracer-bullet shaped by default. Horizontal units are valid only for prefactoring, migration safety, infrastructure, documentation, research, or a dependency that cannot yet be verified as behavior, and they must include a horizontal-slice justification.

Before final closeout, audit the coverage ledger. The workflow may be PASS only when every material requirement is mapped to a PASS acceptance row, explicitly waived by the user, or blocked and reported as not complete.

## SPEC Review And Q&A Gate

Before final work units, create a concise reviewable spec as `.workflow/SPEC.md` when workflow docs are enabled, or as an inline SPEC review packet when state is inline. The SPEC is the human-readable contract for interpretation, not the execution plan.

The SPEC must include:

- status: `Draft`, `Approved`, `Needs Revision`, or `Blocked`
- objective and non-goals
- source of truth summary
- interpreted scope
- requirement coverage ledger or summary
- deferred, out-of-scope, and blocked items
- proposed work units summary
- acceptance summary
- assumptions, risks, and open questions
- Q&A log
- human verification decision with reviewer, decision, notes, and date when known

In `human_in_loop`, stop after presenting the draft SPEC and ask for review. The human may ask questions, request revisions, block, defer requirements, change dispositions, or approve. Continue to final work units, dossiers, or implementation only after the SPEC has `Decision: Approved` or an equivalent explicit approval in the conversation.

If the human asks questions, answer them and update the Q&A log before proceeding. If the answers change scope, sources, dispositions, work units, or acceptance, revise the SPEC and ask for approval again. If the human marks `Needs Revision`, revise and re-present. If the human marks `Blocked`, stop and record the blocker.

In `autonomous_goal`, create or record the SPEC and continue only when no blocking questions remain and no higher-priority instruction requires approval. Do not fabricate human approval; use `Approval: not required by autonomous_goal intake` or equivalent wording instead.

Agents may propose dispositions such as `proposed_current_scope` or `proposed_deferred`, but only explicit user approval may convert them into `in_current_scope`, `explicit_user_deferred`, or `out_of_scope_by_user` when the distinction changes scope. Keep proposed agent interpretation separate from final human decisions.

If `autonomous_goal` finds a blocking question or human decision point, use Resume After Human Decision instead of treating the autonomous path as failed. Autonomous execution may pause for the smallest necessary decision and then continue from the saved checkpoint after the human answers.

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
12. On resume after compaction, continuation, or human answer, read the active goal first, then reconcile workflow docs and current artifacts.
13. If the prior Codex goal is terminal `blocked old`, do not assume it can be reopened. Continue from workflow state when safe; create or reuse a new active workflow state only when complete intake still authorizes goal binding, and reference the old blocked goal as history.

If the environment has no goal tool or goal creation is not permitted, state the intended goal objective in the supervisor report and continue with workflow docs or another state artifact as the fallback state container.

## Resume After Human Decision

Use this protocol when `autonomous_goal` or another supervised path stops to ask a human for clarification, scope disposition, approval, waiver, final disposition, or any other blocking decision.

Before asking the human:

- Record the blocker in `.workflow/SPEC.md`, `.workflow/WORKFLOW.md`, `.workflow/GOAL-STATE.md`, or the inline state packet. Include the blocked artifact, exact question, affected requirement ids, affected work units, last completed step, and recorded next action.
- Ask the smallest decision that can unblock progress. Do not re-ask complete intake unless a required intake decision is missing, contradicted, or directly changed by the blocker.
- Mark the workflow, SPEC item, unit, or worker as waiting or blocked. Do not mark the Codex goal terminal `blocked` for a first material blocker when meaningful progress can continue after the human answers.

When the human answers:

- Classify the answer as one or more of: clarification, scope change, requirement waiver, explicit deferral, blocker resolution, final disposition, intake change, or workflow cancellation.
- Update the SPEC Q&A log, requirement coverage dispositions, decision source, and any `DECISIONS.md`, `WORKFLOW.md`, or `GOAL-STATE.md` resume fields before continuing.
- Do not restart intake unless the answer changes a required intake decision: objective/source, execution path, mode, delegation, final disposition, mutation boundaries, or state artifacts. If it does, ask only the affected intake item(s), then resume.
- Re-run only the affected downstream steps: source coverage, SPEC, work-unit split, acceptance rows, dossiers, worker plan, verification, or final disposition. Preserve unaffected completed units and evidence.
- Invalidate stale work units, acceptance rows, dossiers, or worker reports whose assumptions changed. Do not reuse them as green evidence.
- Continue from the recorded `Next Action`. If the recorded next action is missing, derive the next action from the latest non-terminal workflow artifact and state the derivation in the report.
- If the old Codex goal is still active and relevant, reuse it. If it is terminal `blocked old` and cannot be reopened, reference it as history and continue with workflow docs or a newly authorized goal binding.

## Operating Contract

- After complete intake, ground the workflow in sources before creating work units.
- Treat skill use as instruction loading in the current agent, not as worker delegation, thread creation, subagent creation, goal, branch, commit, PR, publication, or other side-effect creation.
- Run the complete intake gate before goal creation, worker delegation, implementation, publication, or other irreversible action.
- Do not infer execution path, mode, delegation, final disposition, or boundaries from keywords, action verbs, or intent guesses.
- Classify the workflow as `autonomous_goal` or `human_in_loop` only from completed intake answers before delegating workers or beginning implementation.
- Explicit invocation always requires profile selection before heavy planning. `strict_full_workflow` requires complete intake, work units, dossiers, worker-agent contracts, scoped handoffs, report schema, and verification. `lean_work_unit_runner` requires an upfront scope contract, bounded work units, a compact ledger, focused checks, and escalation gates instead of full per-unit ceremony.
- Preserve source-scope fidelity: do not translate controlling-source requirements into weaker proxy checks unless the user explicitly approves the narrower scope or waiver.
- Always produce a plan after complete intake. In `human_in_loop`, make it an approval packet and stop for approval. In `autonomous_goal`, make it an execution plan and continue only when the completed intake authorizes that path.
- Do not begin strict implementation until complete intake and the path gate are satisfied, at least one work unit exists, at least one concrete dossier exists, worker-agent contracts exist, and no stop gate applies.
- Do not begin lean implementation until the scope contract is recorded, the backlog contains at least one ready unit, the compact ledger exists or can be kept inline, the current unit has source reference, scope, done signal, and check, and no escalation gate applies.
- Do not begin product or integration implementation from a vague horizontal phase. Prefer a tracer-bullet unit with observable behavior and demo or verification; allow horizontal units only for prefactoring, migration, infrastructure, documentation, research, or risk-boundary work with a justification.
- Delegate workers only through an automated supported delegation transport after complete intake and the path gate authorize delegation. If no supported transport exists, use same-session phased mode only when intake allowed it; otherwise stop as `worker_agent_unavailable`.
- Do not start implementer, verifier, repair-author, or documenter workers before complete intake and the path gate are satisfied; role-specific start conditions are additional gates after that.
- Do not use native thread or native subagent workers unless the environment exposes a close operation for that transport. For Codex subagents, the supervisor must call `close_agent` for every `spawn_agent` id after the worker reaches a terminal report, times out, blocks, fails validation, is cancelled, or is no longer needed.
- Keep roles separate: implementers implement, verifiers verify, repair authors write tickets, documenters update workflow artifacts, and the supervisor coordinates.
- Treat same-session verification as a self-check, not independent verification. Separate verifier-agent verification may be labeled `independent-verifier` only when genuinely performed by a separate worker agent or thread.
- Prefer explicit PASS/FAIL/BLOCKED states over soft completion language.
- Stop instead of improvising when sources are missing, contradictory, materially stale, or too vague to produce acceptance criteria.
- Treat unimplemented material source requirements found in residual risks, skipped checks, future work, or `next_recommended_action` as open work, not PASS evidence.
- Keep provenance optional; require enough outcome detail for another agent to resume.
- When resuming after a human decision, update state first, invalidate changed downstream artifacts, and continue from the recorded next action instead of restarting the whole workflow.
- Treat companion skills as optional phase tools, not an automatic cascade. Use the smallest set needed for the current risk.

## Skills And Workers

Using this skill does not spawn a worker, thread, or subagent. It coordinates the current agent until a separate automated execution mechanism is explicitly available and authorized.

Treat these as distinct mechanisms:

- Skill: reusable instructions loaded into the current agent.
- Worker: a role-scoped automated execution run that receives one dossier and returns one terminal report.
- Portable worker delegation: the package helper command, `workflow-supervisor delegate --agent <agent> --role <role> --unit <unit-id> --cwd <workspace> --dossier <path>`, which invokes an installed platform CLI and normalizes its report.
- Native thread or subagent: an environment-specific transport a worker adapter may use only when it can also close the native worker resource after use.
- Same-session phased mode: the current agent performs roles sequentially. Verification in this mode is a self-check, not independent verification.

Start workers only after complete intake and the path gate are satisfied, at least one work unit exists, a concrete dossier exists, the loop policy authorizes delegation, and the environment exposes an automated supported transport. If environment rules require explicit user approval for user-visible native thread creation, obtain it before using that transport. Do not use manual copy/paste handoff as the primary path. If automated delegation is unavailable, mark the unit `worker_agent_unavailable` unless completed intake explicitly selected same-session phased work.

### Native Worker Resource Lifecycle

Logical worker completion is not enough for native thread or subagent transports. A worker is not `closed` until its native resource has also been released.

For every native worker:

1. Record the native resource id immediately after creation, such as the Codex `agent_id` returned by `spawn_agent`, in the worker map.
2. Record transport, worker name, role, work unit, dossier, start time, and close requirement before waiting on the worker.
3. Collect one terminal report or mark the worker `BLOCKED` because of timeout, invalid output, unavailable adapter, cancellation, or missing evidence.
4. Call the native close operation as soon as the terminal report or blocker is captured. For Codex subagents, call `close_agent` with the recorded `agent_id`.
5. Record the close result and previous native status. Only then move the worker to `resource_closed` and then `closed`.
6. Before final workflow outcome, audit the worker map. If any native worker has no close result, final status is `BLOCKED` with reason `open_native_worker`.

Native worker ids are resource handles, not evidence. Do not use a completed worker report, a subagent notification, or a wait result as a substitute for closing the native worker. If the close operation fails or is unavailable, stop and report `worker_resource_close_failed` or `worker_resource_close_unavailable`; do not keep spawning replacement workers.

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
- Profile: `lean_work_unit_runner`, `strict_full_workflow`, or `planning_only`.
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
2. Profile: lean_work_unit_runner, strict_full_workflow, or planning_only?
3. Execution path: autonomous_goal or human_in_loop?
4. Mode: sequential, parallel where safe, or staged parallel?
5. Delegation: same-session phased, automated worker delegation, or native threads/subagents if available?
6. Final disposition: keep local, open PR, push main, deploy/publish, or ask at the end?
7. Boundaries: may I install dependencies, call external services, use credentials, or only edit local files?
8. State artifacts: compact ledger, `.workflow/` docs, another artifact directory, or inline state?
```

If the user answers only some intake items, ask only the unanswered or ambiguous item(s) again and stop. If the user says "use your judgment", treat that item as unanswered; do not substitute defaults. Continue prompting until every required intake decision has an explicit user answer.

Treat `strict_full_workflow`, `autonomous_goal`, PR creation, direct push, deploy, publication, paid operations, production data changes, and credential use as satisfied only by completed intake answers or an explicit profile selection, not by vague keywords elsewhere in the prompt.

Negative example: "Using Workflow Supervisor, generate an API and create the project" is not autonomous authorization and is not complete intake. It names the supervisor and objective, but leaves required intake decisions unresolved. Ask the complete intake packet and stop before implementation.

## Supervisor Loop

1. Run the complete intake gate. Record explicit user answers. If any required intake answer is missing, vague, or delegated to judgment, ask for the unresolved item(s) and stop.
2. Restate the selected profile, objective, constraints, non-goals, known sources, and unknowns from the completed intake.
3. Bind or reconcile the Codex goal only after complete intake and only when no unrelated active goal prevents binding.
4. If the profile is `lean_work_unit_runner`, run the lean loop:
   - Confirm the source contains bounded work units or create a short upfront backlog contract. If not possible, pause for a decision or switch to `planning_only` or `strict_full_workflow`.
   - Create or select one compact ledger instead of full workflow docs.
   - Verify each ready unit has `id`, `source_ref`, `slice_type`, `scope`, `done`, `check`, and `status`; product or integration units also need `observable_behavior` and `demo_or_verification`.
   - Present a concise batch plan in `human_in_loop`, or continue in `autonomous_goal` when intake permits it.
   - Execute one unit at a time with targeted inspection, smallest patch, focused check, ledger update, and checkpoint cadence.
   - Escalate only the affected unit or batch when a strict-mode trigger appears; do not convert the whole backlog to strict mode unless the source contract is invalid.
   - Finish with a compact outcome naming units completed, blocked, failed, escalated, checks, skipped checks, residual risks, and final disposition.
5. If the profile is `planning_only`, stop after source grounding, backlog shape, risks, recommended profile, and approval questions. Do not implement.
6. If the profile is `strict_full_workflow`, continue the strict loop below.
7. Build or request a source corpus map. Use `$source-corpus` when source authority, freshness, or contradictions matter.
8. Create the source-requirement coverage ledger. If any material source requirement cannot be classified, mapped to work, or explicitly deferred, stop and ask for the missing scope decision.
9. Create the SPEC review packet or `.workflow/SPEC.md` from the source corpus and coverage ledger.
10. Run the SPEC Q&A gate. In `human_in_loop`, stop until the human asks questions, receives answers or revisions, and explicitly approves the SPEC. In `autonomous_goal`, continue only when no blocking questions remain and approval is not required by intake.
11. Split the objective into bounded work units from the approved or non-blocked SPEC and coverage ledger. Use `$work-unit` for ambiguous, multi-phase, product, or integration goals. Prefer tracer-bullet units for user-facing or integration behavior. If the task is tiny and the ledger has no deferred material requirements, create exactly one work unit named `WU-001`.
12. Choose a loop policy before starting work: sequential or parallel, retry limits, approval gates, budgets, goal update cadence, and blocker rules. Use `$loop-policy` when the policy is not obvious.
13. Build dossiers for the first implementation units and any planned verification, repair, or documentation workers. Use `$dossier-builder` when delegating work to another agent or when the task has boundaries.
14. Assign worker roles with explicit allowed and forbidden behavior. Use `$worker-roles` for multi-agent, native-thread, or portable-worker work.
15. Select the execution path:
   - `human_in_loop`: use when selected in completed intake or when a higher-priority rule requires human approval after intake.
   - `autonomous_goal`: use only when selected in completed intake and no higher-priority rule requires human approval.
16. If `.workflow/` artifacts will be used in a Git-backed codebase, ensure `.gitignore` contains `.workflow/` before writing them.
17. Present the path-specific plan:
   - `human_in_loop`: approval packet with plan, work units, worker delegation plan, approval gates, stop gates, and first dossiers. Stop until the human approves or revises it.
   - `autonomous_goal`: execution plan with the same contents plus autonomous boundaries, allowed actions, stop gates, repair limits, and final disposition policy. Continue after recording it only when complete intake authorized that path.
18. After the path gate is satisfied, delegate named workers from the worker delegation plan through the selected automated transport. Send each worker only its role, dossier, sources, acceptance rows, stop gates, and report schema. For native threads or subagents, record the native resource id immediately and confirm a close operation exists before starting more workers.
19. Collect one terminal report from each worker. If a worker asks a human-facing question, convert it to `BLOCKED` and have the supervisor ask the user only when the path policy permits. For native threads or subagents, close the native resource after the report or blocker is captured.
20. Verify independently where possible. Use `$acceptance-matrix` to map every requirement to evidence. Start verifier workers only after the relevant implementer report is available.
21. If verification FAILs, convert findings into repair tickets and route them to a repair-author or implementer repair worker. Do not expand scope during repair.
22. Re-run verification after repairs. Continue only until PASS, BLOCKED, repair limit, or path stop.
23. Start documenter workers only after source, implementation, verification, or repair evidence exists, unless the documenter is explicitly creating planning state.
24. If verification BLOCKs, record the resume checkpoint, report the blocker, and stop or ask for the missing decision. When the human answers, use Resume After Human Decision.
25. Use `$workflow-docs` to create or refresh reusable Markdown artifacts under `<workspace>/.workflow/` when the workflow must persist across context loss, agents, or sessions.
26. Audit skipped checks, residual risks, future work, and next recommended actions against the source-requirement coverage ledger. If any material source requirement appears there without an explicit user deferral or waiver, mark the workflow FAIL/BLOCKED and create more work units or ask for a scope decision.
27. When all material acceptance rows are PASS or waived, apply the final disposition policy:
   - `human_in_loop`: use the completed intake final disposition; if it is `ask_at_end`, ask the human to choose PR, push main, or keep local.
   - `autonomous_goal`: use the completed intake final disposition. If it is `ask_at_end`, stop and ask before taking any final disposition action.
28. Finish with an outcome report that names profile, execution path, goal status, sources, SPEC decision when strict, coverage or ledger disposition, work units, delegated workers or same-session execution, native worker close status, checks, skipped checks, residual risks, final disposition decision, and next action.

## Execution Paths

### Human-In-Loop

Use `human_in_loop` when the completed intake selects it, or when a higher-priority rule requires human approval after intake. If the user has not answered the execution-path intake item, stop and ask for that answer instead of inferring a path.

In `lean_work_unit_runner`, the first review deliverable is the scope contract plus compact ledger and batch checkpoint policy. Stop for approval before the first batch unless the user explicitly selected autonomous execution.

In `strict_full_workflow`, the first review deliverable after source coverage is the SPEC review packet, not implementation. After the SPEC Q&A gate is approved, the supervisor presents the implementation approval packet. The approval packet must include:

- objective and non-goals
- source corpus summary and gaps
- source-requirement coverage ledger summary
- SPEC review status, Q&A summary, and decision
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
- SPEC review status, Q&A summary, and approval policy
- work units and sequence
- worker delegation plan with names, roles, dossiers, dependencies, start conditions, and transport
- acceptance matrix summary
- autonomous boundaries and forbidden actions
- stop gates, repair limits, budgets, and escalation rules
- final disposition policy: `open_pr_when_green`, `push_main_when_green`, or `keep_local_when_green`

For `lean_work_unit_runner`, replace SPEC, coverage-ledger, and worker-delegation details with the scope contract, compact ledger path, unit readiness fields, batch checkpoint cadence, resource gates, focused-check policy, and strict-mode escalation triggers.

The final disposition must come from the completed intake. Direct push to the main branch, PR creation, deploy, publication, paid operations, production data changes, credential use, and destructive operations require explicit answers in the relevant intake fields.

Even in `autonomous_goal`, stop and ask when any required intake answer is missing or ambiguous, required sources are missing, acceptance cannot be verified, a worker needs scope expansion, an irreversible action lacks intake authorization, or higher-priority instructions require approval.

When `autonomous_goal` stops for a human decision, it should usually leave the Codex goal active and mark only the workflow artifact, SPEC item, work unit, or worker as waiting or blocked. After the human answers, resume from the recorded next action and refresh only the affected downstream artifacts.

## Portable Worker Delegation

After the path gate is satisfied, use the selected automated worker transport. Prefer the portable delegate path when it satisfies the work because it is one-shot and does not leave a native thread or subagent resource open. The portable default is the package helper:

```text
workflow-supervisor delegate --agent <agent> --role <role> --unit <unit-id> --cwd <workspace> --dossier <path>
```

Before calling `delegate`, validate the dossier:

```text
workflow-supervisor validate-dossier <path> --role <role> --unit <unit-id> --json
```

If the dossier does not pass `DossierV1` validation, do not start the worker. Create a discovery dossier, ask for the missing decision, or mark the unit BLOCKED.

Adapters may use native threads, native subagents, or one-shot CLI execution underneath, but the supervisor consumes only the normalized worker report plus the transport lifecycle result. Use `workflow-supervisor delegate-doctor --agent <agent> --probe` to test the installed local adapter before relying on it for a workflow. If automated delegation is unavailable, mark execution as `worker_agent_unavailable` unless completed intake selected `same_session_phased`. If native delegation is available but native close is unavailable, mark execution as `worker_resource_close_unavailable` and choose portable delegation or same-session phased only when intake permits it.

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
- closeout: collect terminal report, close any native worker resource, and confirm no further action is expected

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

- the profile is missing or unclear and cannot be selected from explicit user intent plus controlling source
- any required intake answer is missing, vague, delegated to judgment, or contradicted by another intake answer
- source authority cannot be established
- sources contradict each other on a material requirement
- the requested scope cannot fit into a bounded work unit
- `lean_work_unit_runner` is selected but the backlog lacks clear unit ids, source references, boundaries, done signals, or targeted checks
- a product or integration unit is a vague horizontal phase without observable behavior, demo or verification, valid non-product slice type, or horizontal-slice justification
- `lean_work_unit_runner` finds a strict-mode risk trigger and the user has not authorized escalation, deferral, or a narrower unit
- the coverage ledger is missing, incomplete, or contains material requirements classified as future work without explicit user deferral
- human-in-loop SPEC approval is missing, marked Needs Revision, marked Blocked, or has unanswered Q&A
- a human decision was answered but affected downstream coverage, SPEC, work units, acceptance, dossiers, or verification have not been refreshed
- mandatory approval packet, work unit, dossier, worker-agent contract, or acceptance matrix is missing
- allowed and forbidden surfaces cannot be named
- acceptance cannot be verified with evidence
- a verifier is asked to edit or an implementer is asked to self-approve
- repair loops repeat without new evidence
- the user requires approval before continuing
- the selected path is `autonomous_goal` but it was inferred from prompt wording instead of a completed intake answer
- an irreversible action is requested without explicit authorization in the completed intake
- a worker asks to expand scope without supervisor or human approval
- a native thread or subagent worker has no recorded close result
- final verification is not green and no waiver evidence exists
- residual risks, skipped checks, future work, or next actions contain unimplemented material source requirements

## Final Report Shape

Report:

- Status: PASS, FAIL, BLOCKED, or PARTIAL
- Profile: lean_work_unit_runner, strict_full_workflow, or planning_only
- Execution path: autonomous_goal or human_in_loop
- Goal status and whether a Codex goal was created, reused, skipped, completed, or blocked
- Objective handled
- Sources used and gaps
- SPEC status, Q&A summary, and human decision or autonomous approval policy
- Source-requirement coverage ledger summary, including deferred or blocked material requirements
- Work units completed, blocked, failed, escalated, or remaining
- Compact ledger path or inline ledger summary when in lean mode
- Approval question id and whether `WAITING_FOR_HUMAN -> ACTIVE` occurred
- Human decision resume status, affected artifacts, and whether stale downstream artifacts were invalidated
- Dossiers created or missing
- Workers delegated, blocked, unavailable, or skipped
- Worker lifecycle status for each role, including native resource ids and close results when native threads or subagents were used
- Verification evidence
- Repairs performed or recommended
- Checks run and skipped
- Residual risks
- Final disposition: PR, push main, keep local, or undecided
- Resume point or next action
