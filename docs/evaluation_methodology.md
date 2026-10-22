# Evaluation methodology and limits

This prototype evaluates one response to a user-supplied task against a human-approved set of candidate obligations extracted from a skill. Its live score is a language-model judgment; it is not a deterministic behavioral test suite.

## Current live-run procedure

1. Extract candidate obligations from Markdown. Extraction is heuristic; a user reviews and approves the obligations in Test Lab.
2. Send the approved skill text and task to OpenAI or to an installed Ollama model. The model has no tools or filesystem access.
3. Send the generated response, task, skill text, and obligation list to the same selected model in a separate judge request.
4. Record each judgment, quote, reason, raw response, provider/model, task, duration, and evaluated obligation IDs in the run trace. An omitted or invalid judgment fails rather than passes.

The selected model judges its own response. It may miss violations, misread evidence, or vary between runs. Scores therefore describe that judge's report, not verified real-world behavior. Stronger evaluation requires independent judges, deterministic task-specific validators, repeat trials, and checks that evidence quotes actually occur in the response.

## Rerun comparison

After a human approves a repair proposal, SkillStress reruns the same task and scenario with the same provider and model, skill ID, and approved obligation IDs. The comparison reports per-obligation changes between the stored baseline and rerun. Since generation and judging are stochastic and share the same model, a changed score is an observed difference; it does not establish that the edit caused the difference. Repeat trials and an independent evaluator are future work.

The baseline is held in backend memory. Comparisons stop working after a backend restart, even if the browser still displays a locally saved run. Durable snapshots, prompt/version hashes, exportable evidence bundles, and multi-trial statistics remain unimplemented.

## Repair proposal

A failed provider run can be sent back to that run's model with the skill, failed assertions, and recorded response/judge evidence. The model returns proposed Markdown, a rationale, and supporting evidence. The person may edit, approve, or reject it. Approval updates only the SkillStress browser workbench copy; it does not modify the imported source file. A rerun is a new run and retains the original run as its comparison baseline.

## Mock preflight

The mock endpoint checks a narrow policy preflight and returns synthetic assertions. It does not call a model, execute tools, render a UI, parse SQL, or prove an agent followed a skill. It is labeled mock and excluded from provider comparisons.

## Not implemented

- Behavioral execution in an isolated tool sandbox.
- Deterministic assertion adapters for DOM, SQL, filesystem, or application state.
- Real mutation generation and measured regression detection.
- Independent judge validation, calibration, repeated trials, and quote verification.
- Durable run persistence, experiment export, or complete replay guarantees.
- Verified isolated deterministic run baseline with automated obligation validation.
