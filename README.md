# Workflow Supervisor

Portable workflow skills for supervising messy agent work.

![Workflow Supervisor hero image showing the supervisor coordinating source corpus, work units, dossiers, roles, loop policy, acceptance, repair, workflow docs, and final outputs](assets/workflow-supervisor-hero.png)

This repository contains an installable skill pack for Codex, Claude Code, OpenCode, HermesAgent, and other agents that can read Markdown instructions. It is built for work that is too broad, risky, ambiguous, or long-running to handle as one ordinary prompt.

Use it when an agent needs to:

- ground work in source material before acting
- split a fuzzy goal into bounded work units
- create concrete handoffs between agents or threads
- choose between autonomous goal execution and human-in-the-loop execution
- fan out path-gated dossiers into named worker threads
- separate implementation from verification
- turn acceptance criteria into evidence-backed checks
- control repair loops, retries, budgets, and stop gates
- leave reusable Markdown state so another agent can resume

Do not use it for tiny edits, one-off commands, ordinary README wording, or a task that already has clear files and clear acceptance criteria.

## The Idea

The pack treats open-ended work as a supervised loop:

```text
sources -> work units -> execution path -> named threads -> verification -> repair -> disposition
```

`$workflow-supervisor` is the spine. The other skills are phase tools the supervisor can call when the workflow needs more structure.

```text
                source-corpus
                      |
workflow-supervisor --+-- work-unit
        |             |
        |             +-- dossier-builder
        |             |
        |             +-- worker-roles
        |             |
        |             +-- acceptance-matrix
        |             |
        |             +-- loop-policy
        |
        +-- workflow-docs
```

The goal is not bureaucracy. The goal is to stop agents from drifting, guessing, rubber-stamping their own work, or losing state after a long context window.

## Execution Paths

The supervisor enforces complete intake before it chooses a path or starts work:

- `human_in_loop`: after complete intake, the agent produces an approval packet first, then waits for a human decision before implementation, worker thread creation, publication, direct push, or other irreversible action.
- `autonomous_goal`: after complete intake, the agent can continue through planning, implementation, verification, repair, and final disposition only when the execution-path intake answer selects `autonomous_goal`.

`$workflow-supervisor` does not skip intake from keywords such as "autonomous", "work until done", "approval", "generate", or "create". The user must answer every intake item. If any answer is missing, vague, or delegated to judgment, the supervisor prompts for the unresolved item(s) again and stops before planning or implementation.

Both paths use the same core controls after intake: source grounding, bounded work units, dossiers, role separation, acceptance evidence, repair limits, stop gates, and final disposition choices. In Codex-style environments, the supervisor can bind the loop to a goal only after complete intake and any required environment authorization, mirror state into workflow artifacts, and resume without losing the active objective.

The pack is domain-neutral. A "surface" can be a repository path, document section, design, dataset, ticket, process, prompt, or other mutable artifact. When prerequisites are missing, the skills create a discovery or intake unit instead of inventing repo-only requirements.

## Skills, Threads, And Subagents

Using a skill loads instructions into the current agent. It does not automatically create a new thread, subagent, goal, branch, commit, PR, publication, or other side effect.

Worker threads or subagents are separate execution mechanisms. `$workflow-supervisor` may plan them, but creation happens only after the selected execution path is authorized, a concrete dossier exists, the environment exposes the needed tool, and no stop gate applies. If thread or subagent tools are unavailable, the supervisor emits ready-to-send handoff prompts or workflow docs instead.

In Codex-style environments, user-visible thread creation may require an explicit user request or approval even when the supervisor has prepared a thread plan. Treat same-thread verification as a self-check, not independent verification.

## Quick Example

Ask the agent to use the supervisor for work that needs a real loop:

```text
Use $workflow-supervisor.

Migrate this repo's docs to the new API shape.
```

The supervisor should ask the complete intake before work starts:

```text
Before I start the supervisor loop, answer every intake item:
1. Objective and source: what artifact, spec, repo path, document, ticket, or source set controls the work?
2. Execution path: autonomous_goal or human_in_loop?
3. Mode: sequential, parallel where safe, or staged parallel?
4. Delegation: same-thread only, use threads/subagents if available, or handoff prompts only?
5. Final disposition: keep local, open PR, push main, deploy/publish, or ask at the end?
6. Boundaries: may I install dependencies, call external services, use credentials, or only edit local files?
7. State artifacts: create `.workflow/` docs, use another artifact directory, or keep state inline?
```

If the reply skips any item, the supervisor asks for the missing item(s) and stops again.

For a narrower phase, invoke the specific skill:

```text
Use $source-corpus to identify the sources of truth for this migration and flag contradictions.
```

```text
Use $acceptance-matrix to turn this launch checklist into PASS, FAIL, and BLOCKED criteria with evidence requirements.
```

```text
Use $workflow-docs to create a reusable HANDOFF.md and OUTCOME.md for the next agent.
```

## Install

From a local checkout:

```bash
git clone https://github.com/NikolaCehic/workflow-supervisor.git
cd workflow-supervisor
npm run validate
node ./bin/workflow-skills.mjs install --agent codex --scope user
```

After npm publication, the same installer can be run through `npx`:

```bash
npx workflow-supervisor install --agent codex --scope user
```

Install into a project-local skill directory for all supported agents:

```bash
node ./bin/workflow-skills.mjs install --agent all --scope project --project /path/to/project
```

Install into any custom directory:

```bash
node ./bin/workflow-skills.mjs install --agent generic --target ./agent-skills
```

Install only selected skills:

```bash
node ./bin/workflow-skills.mjs install --agent codex --skills workflow-supervisor,loop-policy,workflow-docs
```

Remove an install:

```bash
node ./bin/workflow-skills.mjs uninstall --agent codex --scope user
```

Emit a portable context file for agents that do not natively discover skill folders. This embeds the selected `SKILL.md` files and bundled Markdown references:

```bash
npx workflow-supervisor emit-context --agent opencode --skills workflow-supervisor,workflow-docs --out AGENTS.md
```

Each install writes:

- the selected skill folders
- `WORKFLOW_SKILL_PACK.md`
- `.workflow-skills-install.json` with installed skills and checksums

## Supported Agents

| Agent | User Install | Project Install |
|---|---|---|
| Codex | `~/.agents/skills` | `<project>/.agents/skills` |
| Claude Code | `${CLAUDE_HOME:-~/.claude}/skills` | `<project>/.claude/skills` |
| OpenCode | `${OPENCODE_HOME:-~/.config/opencode}/skills` | `<project>/.opencode/skills` |
| HermesAgent | `${HERMESAGENT_HOME:-${HERMES_HOME:-~/.hermes}}/skills` | `<project>/.hermes/skills` |
| Generic | custom `--target` | custom `--target` |

Use `emit-context` to create `AGENTS.md`, `CLAUDE.md`, `HERMES.md`, or another portable instruction file when an agent does not read `SKILL.md` folders directly. See [docs/compatibility.md](docs/compatibility.md) for adapter notes.

## Included Skills

| Skill | What It Does |
|---|---|
| `$workflow-supervisor` | Coordinates the whole loop: source grounding, work units, autonomous or human-in-loop execution path, thread orchestration, dossiers, verification, repair, stop gates, goal state, final PR/push/local disposition, and outcome reporting. |
| `$source-corpus` | Identifies and ranks sources of truth, then flags stale, missing, contradictory, inaccessible, or non-blocking evidence gaps. |
| `$work-unit` | Turns broad goals into bounded units with objective, dependencies, scope, done criteria, and sequencing. |
| `$dossier-builder` | Creates a concrete handoff contract for one unit: sources, allowed surfaces, forbidden surfaces, checks, stop gates, and report shape. |
| `$worker-roles` | Defines narrow role contracts for implementer, verifier, researcher, repair author, documenter, reviewer, and synthesizer. |
| `$acceptance-matrix` | Converts goals into testable criteria with evidence requirements, adversarial checks, PASS/FAIL/BLOCKED states, and residual risk. |
| `$loop-policy` | Controls autonomous vs human-in-loop execution, sequential/parallel mode, retry limits, approvals, budgets, escalation, no-progress detection, and continuation rules. |
| `$workflow-docs` | Generates the smallest useful set of durable workflow-state and documentation-production artifacts. |

## Documentation Artifacts

`$workflow-docs` supports two lanes.

Markdown workflow artifacts are created under `<workspace>/.workflow/` by default. Use another directory only when the user names one, the project already has a clearer workflow-state convention, or the artifact is a final deliverable that belongs elsewhere.

Workflow state:

- `.workflow/WORKFLOW.md`
- `.workflow/SOURCE-CORPUS.md`
- `.workflow/WORK-UNITS.md`
- `.workflow/DOSSIER.md`
- `.workflow/THREAD-MAP.md`
- `.workflow/ACCEPTANCE-MATRIX.md`
- `.workflow/VERIFICATION-REPORT.md`
- `.workflow/REPAIR-TICKETS.md`
- `.workflow/DECISIONS.md`
- `.workflow/HANDOFF.md`
- `.workflow/OUTCOME.md`
- `.workflow/GOAL-STATE.md`

Documentation production:

- `.workflow/DOCUMENTATION-BRIEF.md`
- `.workflow/CONTENT-INVENTORY.md`
- `.workflow/OUTLINE.md`
- `.workflow/CONTENT-DRAFT.md`
- `.workflow/CLAIMS-REGISTER.md`
- `.workflow/STYLE-GUIDE.md`
- `.workflow/GLOSSARY.md`
- `.workflow/ASSET-REGISTER.md`
- `.workflow/REVIEW-PLAN.md`
- `.workflow/REVISION-QUEUE.md`
- `.workflow/PUBLISHING-CHECKLIST.md`
- `.workflow/PUBLICATION-LOG.md`
- `.workflow/MAINTENANCE-PLAN.md`

Markdown is the default, but the skills can also produce inline handoffs, ticket outlines, runbooks, spreadsheet-ready tables, design review notes, or other state that a human or agent can reuse.

`$workflow-docs` is intentionally selective: it can scaffold, refresh, or preserve only the artifacts a workflow actually needs, including resume packs, verification reports, repair tickets, content briefs, claims registers, review plans, publishing checklists, and maintenance plans.

## CLI

```bash
workflow-supervisor list
workflow-supervisor validate
workflow-supervisor doctor --agent codex
workflow-supervisor install --agent codex --dry-run
workflow-supervisor install --agent all --scope project --project .
workflow-supervisor install --agent generic --target ./agent-skills
workflow-supervisor install --agent codex --skills workflow-supervisor,loop-policy
workflow-supervisor uninstall --agent codex --scope user
workflow-supervisor emit-context --agent opencode --skills workflow-supervisor,workflow-docs --out AGENTS.md
```

See [docs/cli.md](docs/cli.md) for the full command reference.

## Validation

Run the built-in validator before installing from a local checkout:

```bash
npm run validate
node ./bin/workflow-skills.mjs install --agent generic --target ./agent-skills --dry-run
```

## Repository Layout

```text
skills/      production skill folders
adapters/    agent adapter metadata
bin/         workflow-supervisor CLI
docs/        user documentation
```

## Status

The package is ready for local installation and explicit skill invocation. Keep implicit invocation disabled unless your environment has proven routing precision for these skills.
