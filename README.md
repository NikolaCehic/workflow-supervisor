# Workflow Skill Pack

Installable workflow-control skills for agentic work across codebases, documentation projects, research, design, operations, and planning.

This pack is for supervised, multi-step, high-risk, resumable, or multi-agent work. It is intentionally opt-in and should not trigger for tiny edits, ordinary README wording, routine reviews, or one-off commands.

## Install

Use without a global install:

```bash
npx workflow-skill-pack install --agent codex --scope user
npx workflow-skill-pack install --agent all --scope project --project .
```

Install for a custom skill directory:

```bash
npx workflow-skill-pack install --agent generic --target ./agent-skills
```

Install for another agent target:

```bash
npx workflow-skill-pack install --agent claude-code --target ~/.claude/skills
npx workflow-skill-pack install --agent opencode --target ~/.config/opencode/skills
npx workflow-skill-pack install --agent hermesagent --target ~/.hermes/skills
```

The installer never installs tests by default. It copies only the production `skills/` folders, writes `WORKFLOW_SKILL_PACK.md`, and records `.workflow-skills-install.json` with installed skills and checksums.

## Quick Start

```text
Use $workflow-supervisor as an agent loop goal to supervise a multi-step documentation migration with independent verification and repair passes.
```

```text
Use $work-unit to split this broad onboarding refresh into bounded, verifiable units.
```

```text
Use $acceptance-matrix to define evidence-backed PASS, FAIL, and BLOCKED criteria.
```

## Included Skills

| Skill | Use When | Avoid When |
|---|---|---|
| `$workflow-supervisor` | Coordinating open-ended, multi-step, resumable, supervised workflows | Simple scoped tasks |
| `$source-corpus` | Source authority, freshness, contradictions, or evidence gaps affect safe action | Ordinary file inspection |
| `$work-unit` | A broad goal needs bounded, sequenced units | Task is already small and clear |
| `$dossier-builder` | One bounded unit needs a handoff contract | Same-thread direct work |
| `$worker-roles` | Separating responsibilities across agents, threads, or formal reviews | Solo routine work |
| `$acceptance-matrix` | Completion needs row-by-row evidence | Informal review is enough |
| `$loop-policy` | Retry, approval, budget, stop, goal, or resume rules matter | One failing command |
| `$workflow-docs` | Durable workflow or documentation-production state is needed | Ordinary prose edits |

## Core Workflow

```text
source corpus -> work units -> dossier -> worker roles -> acceptance matrix -> verification -> repair tickets -> workflow docs/outcome
```

Use the smallest set of skills needed for the risk. The supervisor is the spine; companion skills are phase tools, not an automatic cascade.

## Agent Compatibility

- **Codex:** native `SKILL.md` folders plus `agents/openai.yaml`; Codex goal lifecycle is supported when goal tools are available.
- **Claude Code:** install the same skill folders into the location you use for Claude skills or prompts; use explicit `$skill-name` invocation.
- **OpenCode:** install the same skill folders and emit a project context file if native skill discovery is unavailable.
- **HermesAgent:** install the same skill folders or use `emit-context` to create a portable agent instruction file.

See [docs/compatibility.md](docs/compatibility.md) for details.

Compatibility is based on current public skill docs: Codex uses `SKILL.md` folders and optional `agents/openai.yaml`, with `.agents/skills` locations; Claude Code supports personal `~/.claude/skills` and project `.claude/skills`; OpenCode searches `.opencode/skills`, `.claude/skills`, `.agents/skills`, and global `~/.config/opencode/skills`; Hermes uses `~/.hermes/skills` as its primary skill directory.

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

See [docs/cli.md](docs/cli.md).
See [docs/productionization-plan.md](docs/productionization-plan.md) for release gates and tarball validation.

## Evaluation

The package includes an evaluation suite under `eval/`:

- `smoke-prompts-only.md`: fresh-thread prompts without answer leakage
- `smoke-answer-key.md`: evaluator-only expectations
- `evil-metrics.md`: adversarial scoring
- `adversarial-report.md`: latest review findings and current posture

Run:

```bash
npm test
npm run validate:tests
```

Promotion bar:

- every skill validates
- no prompt answer-key leakage
- no automatic fails in live smoke tests
- relevant evil metrics score at least 2
- average target is 2.6 or higher

## Documentation Artifacts

`$workflow-docs` supports two lanes:

- Workflow control: `WORKFLOW.md`, `SOURCE-CORPUS.md`, `WORK-UNITS.md`, `DOSSIER.md`, `ACCEPTANCE-MATRIX.md`, `VERIFICATION-REPORT.md`, `REPAIR-TICKETS.md`, `DECISIONS.md`, `HANDOFF.md`, `OUTCOME.md`, `GOAL-STATE.md`.
- Documentation production: `DOCUMENTATION-BRIEF.md`, `CONTENT-INVENTORY.md`, `OUTLINE.md`, `CONTENT-DRAFT.md`, `CLAIMS-REGISTER.md`, `STYLE-GUIDE.md`, `GLOSSARY.md`, `ASSET-REGISTER.md`, `REVIEW-PLAN.md`, `REVISION-QUEUE.md`, `PUBLISHING-CHECKLIST.md`, `PUBLICATION-LOG.md`, `MAINTENANCE-PLAN.md`.

## Status

This repository is ready for local package smoke testing and fresh-thread evaluation. Keep implicit invocation disabled until live routing tests prove the pack does not over-trigger.
