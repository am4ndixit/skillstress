from fastapi import APIRouter, HTTPException
from ...models.schemas import SkillRepairProposal, SkillRepairProposalRequest, TestRun, TestRunRequest
from ...services.evaluator import run_evaluation
from ...services.provider_runner import ProviderRunError, propose_skill_repair, run_provider_evaluation
from ...services.storage import get_run as read_run, list_runs as read_runs, get_skill as read_skill, save_run, save_skill
from ...core.config import settings

router = APIRouter(prefix="/runs", tags=["runs"])

@router.get("", response_model=list[TestRun])
def list_runs():
    return read_runs()

@router.get("/{run_id}", response_model=TestRun)
def get_run(run_id: str):
    run = read_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run

@router.post("/execute", response_model=TestRun)
async def execute_test_run(req: TestRunRequest):
    if req.skill is not None and req.skill.id != req.skillId:
        raise HTTPException(status_code=422, detail="skill.id must match skillId")
    saved_skill = read_skill(req.skillId)
    if req.skill is not None:
        # The UI sends its reviewed workbench copy so its approved rules and reviewed repair
        # are exactly the ones used for this run. Persist that copy for later comparisons.
        if saved_skill and saved_skill.isBuiltin != req.skill.isBuiltin:
            raise HTTPException(status_code=422, detail="Skill type cannot be changed")
        if not saved_skill and req.skill.isBuiltin:
            raise HTTPException(status_code=404, detail="Built-in skill was not found")
        target_skill = save_skill(req.skill)
    else:
        target_skill = saved_skill
    if target_skill is None:
        raise HTTPException(status_code=404, detail=f"Skill '{req.skillId}' not found. Import it before running a test.")
    scenario_name = req.scenarioName or "Automated Verification Suite"
    task_prompt = req.taskPrompt or "Describe how you would complete the task while following the skill instructions."
    if req.comparisonRunId:
        baseline = read_run(req.comparisonRunId)
        if baseline is None:
            raise HTTPException(status_code=404, detail="Comparison run not found in this backend session")
        evaluated_ids = [item.id for item in target_skill.obligations if item.approved]
        if (
            req.provider == "mock"
            or baseline.provider != req.provider
            or baseline.model != req.model
            or baseline.skillId != req.skillId
            or baseline.scenarioName != scenario_name
            or baseline.taskPrompt != task_prompt
            or baseline.evaluatedObligationIds != evaluated_ids
            or baseline.providerEndpoint != ("https://api.openai.com" if req.provider == "openai" else (req.endpoint or settings.OLLAMA_ENDPOINT).rstrip("/"))
        ):
            raise HTTPException(status_code=422, detail="A comparison rerun must use the same provider, model, skill, scenario, task prompt, and evaluated obligation IDs")
    if req.provider == "mock":
        new_run = run_evaluation(target_skill, scenario_name)
        new_run.provider = "mock"
        new_run.model = None
    else:
        if not req.model:
            raise HTTPException(status_code=422, detail="A model is required for provider-backed evaluation")
        try:
            new_run = await run_provider_evaluation(
                skill=target_skill,
                provider=req.provider,
                model=req.model,
                task_prompt=task_prompt,
                scenario_name=scenario_name,
                ollama_endpoint=req.endpoint,
            )
        except ProviderRunError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc
    new_run.comparisonRunId = req.comparisonRunId
    new_run.skillVersion = target_skill.version
    new_run.skillMarkdown = target_skill.rawMarkdown
    if req.provider == "mock":
        new_run.taskPrompt = req.taskPrompt
        new_run.evaluatedObligationIds = [o.id for o in target_skill.obligations if o.approved]
    return save_run(new_run)


@router.post("/{run_id}/repair-proposal", response_model=SkillRepairProposal)
async def create_repair_proposal(run_id: str, req: SkillRepairProposalRequest):
    run = read_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    if run.status != "failed":
        raise HTTPException(status_code=400, detail="Repair proposals are available only for failed runs")
    if req.skill.id != run.skillId:
        raise HTTPException(status_code=422, detail="Skill ID does not match the failed run")
    source_skill = req.skill.model_copy(update={"rawMarkdown": run.skillMarkdown}) if run.skillMarkdown else req.skill
    try:
        proposal = await propose_skill_repair(source_skill, run)
    except ProviderRunError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return SkillRepairProposal(
        sourceRunId=run.id,
        skillId=run.skillId,
        originalMarkdown=source_skill.rawMarkdown,
        **proposal,
    )
