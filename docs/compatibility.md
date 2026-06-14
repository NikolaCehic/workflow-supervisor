# Agent Compatibility

The pack is built around portable `SKILL.md` folders. Codex consumes those folders directly. Other agents can use the same content as explicit prompt skills, context packs, or project-local instructions.

## Skills, Threads, And Subagents

Loading a skill does not spawn a thread or subagent. A skill is instruction context for the current agent until the environment explicitly uses a separate execution tool.

`$workflow-supervisor` can plan worker threads or subagents, but they start only after the workflow path gate is satisfied, a concrete dossier exists, and the target environment supports the needed delegation tool. If those tools are unavailable or user-visible thread creation is not approved, use the generated handoff prompts or workflow docs as the fallback.

## Codex

Codex support is native:

- each skill has `SKILL.md`
- each skill has `agents/openai.yaml`
- all skills opt out of implicit invocation by default
- `$workflow-supervisor`, `$loop-policy`, and `$workflow-docs` include Codex goal lifecycle rules

Install:

```bash
npx workflow-skill-pack install --agent codex --scope user
npx workflow-skill-pack install --agent codex --scope project --project .
```

Use:

```text
Use $workflow-supervisor as an agent loop goal to supervise this migration.
```

## Claude Code

Claude Code environments vary by local setup. Install to the skill or prompt directory your setup uses, or choose a project-local target.

```bash
npx workflow-skill-pack install --agent claude-code --target ~/.claude/skills
```

If native discovery is unavailable, emit a context file:

```bash
npx workflow-skill-pack emit-context --agent claude-code --target ~/.claude/skills --skills workflow-supervisor,workflow-docs --out CLAUDE.md
```

Codex goal APIs degrade to `GOAL-STATE.md` and workflow docs.

## OpenCode

Install to an OpenCode skill/prompt directory or project-local target:

```bash
npx workflow-skill-pack install --agent opencode --target ~/.config/opencode/skills
npx workflow-skill-pack install --agent opencode --scope project --project .
```

If OpenCode does not read `agents/openai.yaml`, ignore that file and invoke by explicit skill names from `SKILL.md`.

## HermesAgent

Install to the HermesAgent skill/prompt directory configured by your environment:

```bash
npx workflow-skill-pack install --agent hermesagent --target ~/.hermes/skills
npx workflow-skill-pack install --agent hermesagent --scope project --project .
```

User scope follows HermesAgent's documented `~/.hermes/skills` location. Project scope uses the package-local fallback `<project>/.hermes/skills` so `--agent all --scope project` can create a complete portable skill bundle.

If native discovery is unavailable:

```bash
npx workflow-skill-pack emit-context --agent hermesagent --target ~/.hermes/skills --skills workflow-supervisor,workflow-docs --out HERMES.md
```

## Generic Agent

Use `generic` for any agent that can read a directory of Markdown instructions.

```bash
npx workflow-skill-pack install --agent generic --target ./agent-skills
```

Then point the agent at `./agent-skills/WORKFLOW_SKILL_PACK.md` and the individual `SKILL.md` files.
