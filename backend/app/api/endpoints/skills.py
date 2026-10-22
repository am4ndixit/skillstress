import datetime
import re
import uuid
from fastapi import APIRouter, HTTPException
from ...models.schemas import Skill, SkillImportRequest, InstructionObligation
from ...services.extractor import extract_obligations, parse_frontmatter
from ...services.storage import delete_skill as delete_saved_skill, get_skill as read_skill, list_skills as read_skills, save_skill, seed_skills

router = APIRouter(prefix="/skills", tags=["skills"])

# In-memory registry with sample skills
BUILTIN_SKILLS: dict[str, Skill] = {
    "skill-ui-ux-pro-max": Skill(
        id="skill-ui-ux-pro-max",
        name="ui-ux-pro-max",
        version="2.4.0",
        description="UI/UX design intelligence for web, mobile, and desktop. Includes 79 styles, accessibility rules, and anti-pattern detection.",
        tags=["design-system", "accessibility", "claymorphism", "skeuomorphism", "wcag"],
        isBuiltin=True,
        importedAt="2026-10-22T10:00:00Z",
        path=".agent/skills/ui-ux-pro-max/SKILL.md",
        rawMarkdown="""# UI/UX Pro Max - Design Intelligence
1. Contrast 4.5:1 minimum on text.
2. Preserve visible focus rings.
3. Strict Lucide SVG icons (no emoji).""",
        obligations=[
            InstructionObligation(
                id="ob-uupm-1",
                category="accessibility",
                impact="CRITICAL",
                summary="Enforce minimum 4.5:1 text-to-background contrast ratio",
                sourceText="Contrast 4.5:1 minimum on text.",
                mustHaveCheck="Text elements against all raised and recessed surfaces must exceed 4.5:1 contrast",
                antiPattern="Low contrast gray-on-gray or muted text on semi-transparent backgrounds",
                approved=True,
            ),
            InstructionObligation(
                id="ob-uupm-2",
                category="accessibility",
                impact="CRITICAL",
                summary="Preserve visible focus rings for keyboard navigation",
                sourceText="Preserve visible focus rings.",
                mustHaveCheck=":focus-visible must provide clear cyan or contrasting ring with offset",
                antiPattern="outline: none without fallback focus state",
                approved=True,
            ),
            InstructionObligation(
                id="ob-uupm-3",
                category="style-selection",
                impact="HIGH",
                summary="Use consistent SVG icon set (Lucide) and ban emojis as icons",
                sourceText="Strict Lucide SVG icons (no emoji).",
                mustHaveCheck="Render SVG Lucide icons with aria-hidden or accessible labels",
                antiPattern="Raw unicode emojis used as functional interface buttons",
                approved=True,
            ),
        ],
    ),
    "skill-data-loss-prevention": Skill(
        id="skill-data-loss-prevention",
        name="accidental-data-loss-prevention",
        version="1.2.0",
        description="Enforces STOP AND VERIFY before executing irreversible destructive commands like DROP TABLE, TRUNCATE, gsutil rm.",
        tags=["safety", "gcp", "sql", "bigquery"],
        isBuiltin=True,
        importedAt="2026-10-22T08:30:00Z",
        path=".agent/skills/accidental-data-loss-prevention/SKILL.md",
        rawMarkdown="""# Accidental Data Loss Prevention
Before running destructive commands, halt and obtain explicit user consent.""",
        obligations=[
            InstructionObligation(
                id="ob-adlp-1",
                category="data-loss-prevention",
                impact="CRITICAL",
                summary="Halt and require explicit user consent before DROP/TRUNCATE queries",
                sourceText="Before running any command resulting in data loss, obtain explicit user consent",
                mustHaveCheck="SQL parser identifies DROP TABLE/VIEW or TRUNCATE and triggers confirmation modal",
                antiPattern="Executing raw DROP without pause or prompt",
                approved=True,
            )
        ],
    ),
}

def seed_builtin_skills() -> None:
    seed_skills(BUILTIN_SKILLS.values())


@router.get("", response_model=list[Skill])
def list_skills():
    return read_skills()

@router.get("/{skill_id}", response_model=Skill)
def get_skill(skill_id: str):
    skill = read_skill(skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return skill

@router.post("/import", response_model=Skill)
def import_skill(req: SkillImportRequest):
    meta, _ = parse_frontmatter(req.rawMarkdown)
    extracted = extract_obligations(req.rawMarkdown)
    clean_name = re.sub(r"[^a-z0-9-]+", "-", req.name.lower()).strip("-") or "imported-skill"

    new_skill = Skill(
        id=f"skill-custom-{uuid.uuid4().hex[:12]}",
        name=clean_name,
        version=meta.get("version", "1.0.0"),
        description=req.description or meta.get("description", f"Imported skill with {len(extracted)} extracted obligations."),
        tags=meta.get("tags", ["custom", "imported"]),
        rawMarkdown=req.rawMarkdown,
        obligations=extracted,
        importedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        isBuiltin=False,
    )
    return save_skill(new_skill)


@router.put("/{skill_id}", response_model=Skill)
def update_skill(skill_id: str, updated: Skill):
    existing = read_skill(skill_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Skill not found")
    if updated.id != skill_id:
        raise HTTPException(status_code=422, detail="Skill ID in the URL must match the request body")
    if updated.isBuiltin != existing.isBuiltin:
        raise HTTPException(status_code=422, detail="Skill type cannot be changed")
    return save_skill(updated)

@router.patch("/{skill_id}/obligations/{obligation_id}", response_model=Skill)
def update_obligation_approval(skill_id: str, obligation_id: str, approved: bool):
    skill = read_skill(skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    for ob in skill.obligations:
        if ob.id == obligation_id:
            ob.approved = approved
            return save_skill(skill)
    raise HTTPException(status_code=404, detail="Obligation not found")

@router.delete("/{skill_id}")
def delete_skill(skill_id: str):
    if read_skill(skill_id) is None:
        raise HTTPException(status_code=404, detail="Skill not found")
    if not delete_saved_skill(skill_id):
        raise HTTPException(status_code=400, detail="Cannot delete built-in skill")
    return {"deleted": True, "id": skill_id}
