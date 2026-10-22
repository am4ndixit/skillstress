import datetime
import time
import uuid
from ..models.schemas import Skill, TestRun, ScenarioStep, MockToolCall, AssertionResult, StepEvidence

def run_evaluation(skill: Skill, scenario_name: str = "Deterministic Evaluation Suite") -> TestRun:
    started = time.perf_counter()
    approved_obligations = [o for o in skill.obligations if o.approved]
    has_unapproved_critical = any(o.impact == "CRITICAL" and not o.approved for o in skill.obligations)

    passed = not has_unapproved_critical
    total_assertions = max(3, len(approved_obligations) * 2)
    passed_assertions = total_assertions if passed else max(1, total_assertions - 2)
    failed_assertions = total_assertions - passed_assertions

    coverage_pct = (
        round((len(approved_obligations) / len(skill.obligations)) * 100)
        if skill.obligations
        else 50
    )

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    steps = [
        ScenarioStep(
            stepNumber=1,
            name="Specification & Obligation Contract Verification",
            description=f"Evaluate {len(approved_obligations)} active obligations against test manifest",
            status="passed",
            toolCalls=[
                MockToolCall(
                    id="tc-1",
                    toolName="mock_obligation_validator",
                    timestamp="00:00.120",
                    durationMs=120,
                    inputPayload={"targetSkill": skill.name, "approvedCount": len(approved_obligations)},
                    outputPayload={"schemaValid": True, "obligationsSatisfied": True},
                    status="success",
                )
            ],
            assertions=[
                AssertionResult(
                    id="as-1",
                    name="Approved obligations present in active runtime pipeline",
                    obligationId=approved_obligations[0].id if approved_obligations else "ob-0",
                    expected="approvedCount > 0",
                    actual=str(len(approved_obligations)),
                    passed=True,
                )
            ],
            evidence=[
                StepEvidence(
                    type="terminal-log",
                    title="Evaluation Preflight Manifest",
                    content=f"[PASS] Loaded {skill.name} v{skill.version}\n[AUDIT] {len(approved_obligations)} obligations confirmed in scope.",
                    format="text",
                )
            ],
        ),
        ScenarioStep(
            stepNumber=2,
            name="Deterministic Sandbox & Safety Interception",
            description="Execute mock tool calls and verify policy boundary enforcement",
            status="passed" if passed else "failed",
            toolCalls=[
                MockToolCall(
                    id="tc-2",
                    toolName="mock_sandbox_executor",
                    timestamp="00:00.340",
                    durationMs=220,
                    inputPayload={"dryRun": True, "interceptDestructive": True},
                    outputPayload={"intercepted": not passed, "executed": passed},
                    status="success" if passed else "intercepted",
                )
            ],
            assertions=[
                AssertionResult(
                    id="as-2",
                    name="Zero unapproved critical obligation deviations detected",
                    obligationId=approved_obligations[0].id if approved_obligations else "ob-0",
                    expected="violations == 0",
                    actual="1 violation" if has_unapproved_critical else "0 violations",
                    passed=not has_unapproved_critical,
                    errorDetail="Policy Violation: An unapproved critical obligation caused sandbox halt."
                    if has_unapproved_critical
                    else None,
                )
            ],
            evidence=[
                StepEvidence(
                    type="sql-intercept" if "loss" in skill.name.lower() else "dom-snapshot",
                    title="Sandbox Interception Proof",
                    content='{"audit": "COMPLIANT"}' if passed else '{"audit": "VIOLATION_HALT"}',
                    format="json",
                )
            ],
        ),
    ]

    return TestRun(
        id=f"run-{uuid.uuid4().hex[:12]}",
        skillId=skill.id,
        skillName=skill.name,
        scenarioName=scenario_name,
        status="passed" if passed else "failed",
        startedAt=now_iso,
        durationMs=round((time.perf_counter() - started) * 1000),
        totalAssertions=total_assertions,
        passedAssertions=passed_assertions,
        failedAssertions=failed_assertions,
        obligationCoveragePct=coverage_pct,
        steps=steps,
        honestNotice="Mock policy preflight only; no model execution or behavioral skill evaluation occurred.",
        provider="mock",
    )
