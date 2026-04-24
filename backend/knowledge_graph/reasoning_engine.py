from .graph_engine import GraphEngine

class ReasoningEngine:
    def __init__(self, engine: GraphEngine):
        self.engine = engine

    def _determine_learning_path(self, expanded_gaps: set) -> list:
        """
        Creates an ordered strategic topological learning path.
        In this implementation, effectively reverses sequence to study foundational nodes first.
        """
        # Convert to deterministic string list
        gaps_list = list(expanded_gaps)
        return [f"Learn and practice {item}" for item in reversed(gaps_list)]

    def analyze_weaknesses(self, weak_skills: list) -> dict:
        """
        Takes raw weak skills, branches upstream through graph definitions, 
        identifies systemic root causes, and generates extrapolated curriculum. 
        """
        root_causes = set()
        expanded_gaps = set()
        
        if not weak_skills:
            return {"root_causes": [], "expanded_gaps": [], "learning_path": []}
            
        for skill in weak_skills:
            # We already know they are weak here
            expanded_gaps.add(skill)
            
            # Step 1: Immediate upstream root causes
            deps = self.engine.get_dependencies(skill)
            
            # Step 2: Multi-hop reasoning
            transitive = self.engine.traverse_multi_hop_dependencies(skill)
            
            if deps:
                root_causes.update(deps)
            
            # Formulate the entire missing subtree
            expanded_gaps.update(deps)
            expanded_gaps.update(transitive)
            
        # Ensure deterministic return serialization
        return {
            "root_causes": sorted(list(root_causes)),
            "expanded_gaps": sorted(list(expanded_gaps)),
            "learning_path": self._determine_learning_path(expanded_gaps)
        }
