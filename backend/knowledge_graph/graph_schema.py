from pydantic import BaseModel
from typing import Optional

class GraphNode(BaseModel):
    id: str
    type: str  # "Skill", "Subskill", "Role", "Topic"
    name: str
    category: Optional[str] = None
    importance: float = 1.0

class GraphEdge(BaseModel):
    source: str
    target: str
    type: str  # "REQUIRES", "RELATED_TO", "USED_IN", "PART_OF"
    weight: float = 1.0
