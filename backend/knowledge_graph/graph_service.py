from .graph_builder import GraphBuilder
from .graph_engine import GraphEngine
from .reasoning_engine import ReasoningEngine

class GraphService:
    def __init__(self):
        # Instantiate localized in-memory architecture (v1 logic mapping to explicit graph objects)
        builder = GraphBuilder()
        build_data = builder.build_in_memory_graph()
        
        self.engine = GraphEngine(build_data)
        self.reasoning = ReasoningEngine(self.engine)
        
    def generate_explanations(self, weak_skills: list) -> list:
        """
        Generates logic strings based purely off graph traversals ensuring deterministic explanations.
        """
        exps = []
        for skill in weak_skills:
            deps = self.engine.get_dependencies(skill)
            if deps:
                exps.append(f"{skill} requires {', '.join(deps)}, which are likely affecting your score.")
                exps.append(f"Improving foundational {deps[0]} will significantly increase your {skill} performance.")
                
        return exps

    def process_insights(self, intelligence_profile: dict) -> dict:
        """
        Bridges the Intelligence layer outputs natively. Extracting weak points and traversing graphs.
        """
        behavior = intelligence_profile.get("behavior", {})
        weak_skills = behavior.get("weak_areas", [])
        
        if not weak_skills:
            return {
                "status": "no_gaps", 
                "message": "No critical weaknesses identified to generate reasoning topologies.",
                "weak_skills": [],
                "root_causes": [],
                "expanded_gaps": [],
                "learning_path": [],
                "graph_explanations": []
            }
            
        reasoning_data = self.reasoning.analyze_weaknesses(weak_skills)
        explanations = self.generate_explanations(weak_skills)
        
        return {
            "status": "success",
            "weak_skills": weak_skills,
            "root_causes": reasoning_data["root_causes"],
            "expanded_gaps": reasoning_data["expanded_gaps"],
            "learning_path": reasoning_data["learning_path"],
            "graph_explanations": explanations
        }

# Expose orchestrator singleton
graph_service = GraphService()
