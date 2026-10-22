import re
import time
import yaml
from ..models.schemas import InstructionObligation, ObligationCategory, ObligationImpact

def parse_frontmatter(markdown: str) -> tuple[dict, str]:
    pattern = r"^---\s*\n(.*?)\n---\s*\n"
    match = re.match(pattern, markdown, re.DOTALL)
    if match:
        raw_yaml = match.group(1)
        body = markdown[match.end():]
        try:
            meta = yaml.safe_load(raw_yaml) or {}
            return meta, body
        except Exception:
            return {}, body
    return {}, markdown

def extract_obligations(markdown: str) -> list[InstructionObligation]:
    obligations: list[InstructionObligation] = []
    lines = markdown.split("\n")
    counter = 1

    for line in lines:
        trimmed = line.strip()
        match = re.match(r"^(\d+\.|\-|\*)\s+(.+)", trimmed)
        if match:
            text = match.group(2).strip()
            if len(text) < 12:
                continue

            category: ObligationCategory = "general-rule"
            impact: ObligationImpact = "MEDIUM"

            lower = text.lower()
            if any(k in lower for k in ["contrast", "accessibility", "wcag", "aria", "focus"]):
                category = "accessibility"
                impact = "CRITICAL"
            elif any(k in lower for k in ["touch", "click", "size", "hover", "44x44"]):
                category = "touch-interaction"
                impact = "CRITICAL"
            elif any(k in lower for k in ["drop", "delete", "halt", "consent", "truncate", "loss"]):
                category = "data-loss-prevention"
                impact = "CRITICAL"
            elif any(k in lower for k in ["responsive", "mobile", "viewport", "scroll"]):
                category = "layout-responsive"
                impact = "HIGH"
            elif any(k in lower for k in ["icon", "emoji", "style", "color"]):
                category = "style-selection"
                impact = "HIGH"
            elif any(k in lower for k in ["speed", "performance", "lazy", "cls"]):
                category = "performance"
                impact = "HIGH"

            summary = text[:90] + ("..." if len(text) > 90 else "")
            obligations.append(
                InstructionObligation(
                    id=f"ob-ext-{int(time.time())}-{counter}",
                    category=category,
                    impact=impact,
                    summary=summary,
                    sourceText=text,
                    mustHaveCheck=f"Verify system complies with directive: '{text[:60]}'",
                    antiPattern="Bypassing requirement in automated execution",
                    approved=(impact == "CRITICAL"),
                )
            )
            counter += 1

    if not obligations:
        obligations.append(
            InstructionObligation(
                id=f"ob-ext-{int(time.time())}-1",
                category="general-rule",
                impact="MEDIUM",
                summary="General execution directive",
                sourceText=markdown[:100],
                mustHaveCheck="Execute under standard evaluation guardrails",
                antiPattern="Unconstrained execution",
                approved=True,
            )
        )
    return obligations
