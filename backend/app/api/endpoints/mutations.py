from fastapi import APIRouter, HTTPException
from ...models.schemas import SkillMutation
from ...services.mutation import get_all_mutations, evaluate_mutation

router = APIRouter(prefix="/mutations", tags=["mutations"])

@router.get("", response_model=list[SkillMutation])
def list_mutations():
    return get_all_mutations()

@router.post("/{mutation_id}/evaluate", response_model=SkillMutation)
def run_mutation_evaluation(mutation_id: str):
    updated = evaluate_mutation(mutation_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Mutation scenario not found")
    return updated
