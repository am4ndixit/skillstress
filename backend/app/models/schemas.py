from typing import Literal, Optional, Any
from pydantic import BaseModel, Field

ObligationImpact = Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
ObligationCategory = Literal[
    "accessibility",
    "touch-interaction",
    "performance",
    "style-selection",
    "layout-responsive",
    "typography-color",
    "animation",
    "forms-feedback",
    "navigation",
    "data-loss-prevention",
    "schema-integrity",
    "general-rule",
]

class InstructionObligation(BaseModel):
    id: str
    category: ObligationCategory
    impact: ObligationImpact
    summary: str
    sourceText: str
    mustHaveCheck: str
    antiPattern: str
    approved: bool = True
    notes: Optional[str] = None

class Skill(BaseModel):
    id: str
    name: str
    version: str = "1.0.0"
    description: str
    tags: list[str] = Field(default_factory=list)
    rawMarkdown: str
    obligations: list[InstructionObligation] = Field(default_factory=list)
    importedAt: str
    isBuiltin: bool = False
    path: Optional[str] = None

class SkillImportRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    rawMarkdown: str = Field(min_length=1, max_length=24000)
    description: Optional[str] = Field(default=None, max_length=1000)

class MockToolCall(BaseModel):
    id: str
    toolName: str
    timestamp: str
    durationMs: int
    inputPayload: dict[str, Any]
    outputPayload: dict[str, Any]
    status: Literal["success", "error", "intercepted"]

class AssertionResult(BaseModel):
    id: str
    name: str
    obligationId: str
    expected: str
    actual: str
    passed: bool
    errorDetail: Optional[str] = None

class StepEvidence(BaseModel):
    type: Literal["fs-state", "sql-intercept", "dom-snapshot", "terminal-log", "diff"]
    title: str
    content: str
    format: Optional[Literal["json", "sql", "diff", "text"]] = "text"

class ScenarioStep(BaseModel):
    stepNumber: int
    name: str
    description: str
    status: Literal["passed", "failed", "running", "pending"]
    toolCalls: list[MockToolCall] = Field(default_factory=list)
    assertions: list[AssertionResult] = Field(default_factory=list)
    evidence: list[StepEvidence] = Field(default_factory=list)

class TestRun(BaseModel):
    id: str
    skillId: str
    skillName: str
    scenarioName: str
    status: Literal["passed", "failed", "running", "cancelled"]
    startedAt: str
    durationMs: int
    totalAssertions: int
    passedAssertions: int
    failedAssertions: int
    obligationCoveragePct: int
    steps: list[ScenarioStep] = Field(default_factory=list)
    honestNotice: Optional[str] = None
    provider: Optional[Literal["openai", "ollama", "mock"]] = None
    model: Optional[str] = None
    providerEndpoint: Optional[str] = None
    taskPrompt: Optional[str] = None
    evaluatedObligationIds: list[str] = Field(default_factory=list)
    skillVersion: Optional[str] = None
    skillMarkdown: Optional[str] = Field(default=None, max_length=24000)
    comparisonRunId: Optional[str] = None

class TestRunRequest(BaseModel):
    skillId: str
    scenarioName: Optional[str] = "Deterministic Evaluation Suite"
    taskPrompt: Optional[str] = None
    provider: Literal["openai", "ollama", "mock"] = "mock"
    model: Optional[str] = None
    endpoint: Optional[str] = None
    skill: Optional[Skill] = None
    comparisonRunId: Optional[str] = None

class SkillRepairProposalRequest(BaseModel):
    skill: Skill

class SkillRepairProposal(BaseModel):
    sourceRunId: str
    skillId: str
    originalMarkdown: str
    proposedMarkdown: str
    rationale: str
    supportingEvidence: list[str] = Field(default_factory=list)

class ProviderConfig(BaseModel):
    provider: Literal["openai", "ollama"] = "ollama"
    endpoint: str = "http://localhost:11434"
    model: str = "qwen2.5-coder:7b"
    temperature: float = 0.2
    timeoutSeconds: int = 15
    status: Literal["idle", "checking", "connected", "disconnected", "error"] = "idle"
    latencyMs: Optional[int] = None
    errorMessage: Optional[str] = None
    models: list[str] = Field(default_factory=list)
