# Planning And Discovery Outputs

Use this reference for planning-only handoffs, domain context, prototypes, or architecture recommendations.

## Ready-For-Agent Brief

Use a brief when the next consumer is a human or capable agent and no worker is starting now. A brief is not a `DossierV1`.

```yaml
category:
summary:
current_behavior:
desired_behavior:
key_interfaces_or_artifacts:
acceptance_criteria:
out_of_scope:
recommended_checks:
risks:
source_refs:
open_decisions:
```

Convert the brief to a validated dossier only before machine delegation.

## Optional Domain And Decision Context

When present and relevant, inspect `CONTEXT.md`, `CONTEXT-MAP.md`, glossaries, ADRs, decision records, and established project conventions before proposing structural work. Their absence is not a blocker unless terminology or prior decisions are material to correctness.

Record whether relevant context is `present`, `absent_non_blocking`, `stale`, or `blocked_inaccessible`.

## Discovery Or Prototype Unit

Use runnable discovery when evidence is needed before selecting production scope:

```yaml
id:
slice_type: discovery | prototype
question:
prototype_kind: logic | ui | integration | performance | other
allowed_surfaces:
production_surfaces_forbidden:
command_or_observation:
expected_observation:
decision_record_target:
delete_or_absorb_rule:
done:
```

Prototype output informs a decision, SPEC, brief, or work-unit split. It is not production PASS evidence until absorbed into verified production behavior or explicitly accepted as the requested deliverable.

## Architecture Recommendation

Use only when architecture is the task:

```yaml
candidate:
affected_modules_or_artifacts:
current_friction:
proposed_interface:
test_surface:
expected_leverage:
expected_locality:
recommendation_strength: strong | worth_exploring | speculative
needs_user_decision:
```

Keep architecture planning separate from implementation authorization.
