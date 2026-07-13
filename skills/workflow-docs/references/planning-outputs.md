# Planning Output Templates

Use only the artifact needed for the requested handoff or decision.

## AGENT-BRIEF.md

```md
# Ready-For-Agent Brief

Category:
Summary:
Current Behavior:
Desired Behavior:
Key Interfaces Or Artifacts:
Acceptance Criteria:
Out Of Scope:
Recommended Checks:
Risks:
Source References:
Open Decisions:
```

A brief is planning output. Convert it to a concrete `DossierV1` before machine delegation.

## PROTOTYPE-DECISION.md

```md
# Prototype Decision

Question:
Prototype Kind:
Allowed Surfaces:
Production Surfaces Forbidden:
Command Or Observation:
Expected Observation:
Actual Observation:
Decision:
Decision Source:
Delete Or Absorb Rule:
Cleanup Or Absorption Result:
Production Work Units Affected:
```

## ARCHITECTURE-RECOMMENDATIONS.md

```md
# Architecture Recommendations

| Candidate | Affected Modules Or Artifacts | Current Friction | Proposed Interface | Test Surface | Expected Leverage | Expected Locality | Strength | Needs Decision |
|---|---|---|---|---|---|---|---|---|

## Sources And Constraints

## Selected Candidate

## Implementation Authorization
```

Keep architecture recommendations planning-only until implementation is explicitly requested or already in scope.
