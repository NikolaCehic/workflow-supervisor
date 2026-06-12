# Contributing

Changes must preserve:

- explicit opt-in behavior
- trigger precision
- domain neutrality across code, docs, research, design, operations, and planning
- minimal artifact selection
- role separation and solo-mode labeling
- evidence-mapped verification
- Codex goal lifecycle discipline

## Local Checks

```bash
npm test
npm run validate:tests
npm run pack:dry
```

## Skill Rules

- Keep `SKILL.md` concise.
- Put large templates and variants in `references/`.
- Keep frontmatter to `name` and `description`.
- Keep `agents/openai.yaml` default prompts aligned with skill names.
- Keep `policy.allow_implicit_invocation: false` until live trigger tests justify changing it.

## Evaluation Rules

- Do not show `smoke-answer-key.md` to forward-test agents.
- Use `smoke-prompts-only.md` for fresh-thread tests.
- Record automatic fails before averaging scores.
- Treat static validation as necessary but not sufficient.
