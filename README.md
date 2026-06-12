# Workflow Supervisor

Portable workflow skills for supervising messy agent work.

This repository contains an installable skill pack for Codex, Claude Code, OpenCode, HermesAgent, and other agents that can read Markdown instructions. It is built for work that is too broad, risky, ambiguous, or long-running to handle as one ordinary prompt.

Use it when an agent needs to:

- ground work in source material before acting
- split a fuzzy goal into bounded work units
- create concrete handoffs between agents or threads
- separate implementation from verification
- turn acceptance criteria into evidence-backed checks
- control repair loops, retries, budgets, and stop gates
- leave reusable Markdown state so another agent can resume

Do not use it for tiny edits, one-off commands, ordinary README wording, or a task that already has clear files and clear acceptance criteria.

## The Idea

The pack treats open-ended work as a supervised loop:

```text
sources -> work units -> dossier -> execution -> verification -> repair -> outcome
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

## Quick Example

Ask the agent to use the supervisor for work that needs a real loop:

```text
Use $workflow-supervisor as an agent loop goal.

Migrate this repo's docs to the new API shape. Inspect the source first, split the work into units, create acceptance criteria, verify independently, repair failures, and leave a handoff another agent can resume from.
```

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
npm test
node ./bin/workflow-skills.mjs install --agent codex --scope user
```

After npm publication, the same installer can be run through `npx`:

```bash
npx workflow-skill-pack install --agent codex --scope user
```

Install into a project-local skill directory for all supported agents:

```bash
node ./bin/workflow-skills.mjs install --agent all --scope project --project /path/to/project
```

Install into any custom directory:

```bash
node ./bin/workflow-skills.mjs install --agent generic --target ./agent-skills
```

The installer copies only production skill folders. It does not install the evaluation suite into agent skill directories. Each install writes:

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

See [docs/compatibility.md](docs/compatibility.md) for adapter notes.

## Included Skills

| Skill | What It Does |
|---|---|
| `$workflow-supervisor` | Coordinates the whole loop: source grounding, work units, dossiers, verification, repair, stop gates, goal state, and outcome reporting. |
| `$source-corpus` | Identifies and ranks sources of truth, then flags stale, missing, or contradictory evidence. |
| `$work-unit` | Turns broad goals into bounded units with objective, dependencies, scope, done criteria, and sequencing. |
| `$dossier-builder` | Creates a concrete handoff contract for one unit: sources, allowed surfaces, forbidden surfaces, checks, stop gates, and report shape. |
| `$worker-roles` | Defines narrow role contracts for implementer, verifier, researcher, repair author, documenter, reviewer, and synthesizer. |
| `$acceptance-matrix` | Converts goals into testable criteria with evidence requirements, adversarial checks, PASS/FAIL/BLOCKED states, and residual risk. |
| `$loop-policy` | Controls sequential/parallel execution, retry limits, approvals, budgets, escalation, no-progress detection, and continuation rules. |
| `$workflow-docs` | Generates durable Markdown workflow state and documentation-production artifacts. |

## Documentation Artifacts

`$workflow-docs` supports two lanes.

Workflow state:

- `WORKFLOW.md`
- `SOURCE-CORPUS.md`
- `WORK-UNITS.md`
- `DOSSIER.md`
- `ACCEPTANCE-MATRIX.md`
- `VERIFICATION-REPORT.md`
- `REPAIR-TICKETS.md`
- `DECISIONS.md`
- `HANDOFF.md`
- `OUTCOME.md`
- `GOAL-STATE.md`

Documentation production:

- `DOCUMENTATION-BRIEF.md`
- `CONTENT-INVENTORY.md`
- `OUTLINE.md`
- `CONTENT-DRAFT.md`
- `CLAIMS-REGISTER.md`
- `STYLE-GUIDE.md`
- `GLOSSARY.md`
- `ASSET-REGISTER.md`
- `REVIEW-PLAN.md`
- `REVISION-QUEUE.md`
- `PUBLISHING-CHECKLIST.md`
- `PUBLICATION-LOG.md`
- `MAINTENANCE-PLAN.md`

Markdown is the default, but the skills can also produce inline handoffs, ticket outlines, runbooks, spreadsheet-ready tables, design review notes, or other state that a human or agent can reuse.

## CLI

```bash
workflow-skills list
workflow-skills validate --tests
workflow-skills doctor --agent codex
workflow-skills install --agent codex --dry-run
workflow-skills install --agent all --scope project --project .
workflow-skills install --agent generic --target ./agent-skills
workflow-skills emit-context --agent opencode --out AGENTS.md
```

See [docs/cli.md](docs/cli.md) for the full command reference.

## Verification

The repository includes adversarial checks so the skills are judged as process artifacts, not by vibes.

Run:

```bash
npm run validate:tests
npm test
python3 eval/static_validate.py
```

The evaluation suite includes:

- [eval/smoke-prompts-only.md](eval/smoke-prompts-only.md): fresh-thread prompts without answer leakage
- [eval/smoke-answer-key.md](eval/smoke-answer-key.md): evaluator-only expectations
- [eval/evil-metrics.md](eval/evil-metrics.md): adversarial scoring metrics
- [eval/adversarial-report.md](eval/adversarial-report.md): current findings and residual risks

Promotion bar:

- all skills validate
- no answer-key leakage
- no automatic fail in live smoke tests
- relevant evil metrics score at least 2
- average target score is 2.6 or higher
- generated workflow docs can be used by a fresh agent after context loss

See [docs/evaluation.md](docs/evaluation.md) and [docs/productionization-plan.md](docs/productionization-plan.md).

## Repository Layout

```text
skills/      production skill folders
adapters/    agent adapter metadata
bin/         workflow-skills CLI
docs/        user and release documentation
eval/        adversarial prompts, answer keys, and validators
test/        package smoke tests
```

## Status

The package is ready for local installation, tarball testing, and fresh-thread evaluation. Keep implicit invocation disabled until routing tests prove the skills do not over-trigger.
