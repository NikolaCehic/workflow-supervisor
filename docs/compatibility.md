# Agent Compatibility

The certified support set is intentionally small: Codex and Claude Code for automated delegation, plus `generic` for emitting or installing Markdown instructions into a custom directory.

## Skills And Workers

Loading a skill does not spawn a worker, thread, or subagent. A skill is instruction context for the current agent until the supervisor uses an approved delegation mechanism.

`$workflow-supervisor` can plan role-scoped workers, but they start only after complete intake, the workflow path gate, a concrete dossier, and target-environment delegation support are all satisfied. The portable mechanism is the one-shot `workflow-supervisor delegate` command described in [portable-delegation.md](portable-delegation.md). Native Codex threads or Claude subagents are adapter optimizations, not workflow requirements.

## Codex

Codex support is native:

- each skill has `SKILL.md`
- each skill has `agents/openai.yaml`
- all skills opt out of implicit invocation by default
- `$workflow-supervisor`, `$loop-policy`, and `$workflow-docs` include Codex goal lifecycle rules

Install:

```bash
npx workflow-supervisor install --agent codex --scope user
npx workflow-supervisor install --agent codex --scope project --project .
```

Use:

```text
Use $workflow-supervisor to supervise this migration. It should ask the complete intake before planning or work starts.
```

## Claude Code

Claude Code support uses the same `SKILL.md` folders and the `claude` CLI for one-shot delegated workers.

```bash
npx workflow-supervisor install --agent claude-code --scope user
npx workflow-supervisor install --agent claude-code --scope project --project .
```

If native discovery is unavailable, emit a context file:

```bash
npx workflow-supervisor emit-context --agent claude-code --skills workflow-supervisor,workflow-docs --out CLAUDE.md
```

Codex goal APIs degrade to `.workflow/GOAL-STATE.md` and workflow docs.

## Generic Agent

Use `generic` only for Markdown instruction export or installation into a custom directory. It is not a certified automated delegation adapter.

```bash
npx workflow-supervisor install --agent generic --target ./agent-skills
npx workflow-supervisor emit-context --agent generic --skills workflow-supervisor,workflow-docs --out AGENTS.md
```

Then point the receiving agent at `./agent-skills/WORKFLOW_SKILL_PACK.md`, the individual `SKILL.md` files, or the emitted context file.
