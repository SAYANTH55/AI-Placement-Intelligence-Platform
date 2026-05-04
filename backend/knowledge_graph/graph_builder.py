from .graph_schema import GraphNode, GraphEdge
from ai_model.data.skills_data import SKILLS_DICTIONARY, SKILL_TOPICS

class GraphBuilder:
    def __init__(self):
        self.nodes = {}
        self.edges = []
        
    def _normalize_id(self, prefix: str, name: str) -> str:
        return f"{prefix}_{name.lower().replace(' ', '_').replace('/', '_')}"
        
    def add_node(self, node: GraphNode):
        self.nodes[node.id] = node
        
    def add_edge(self, edge: GraphEdge):
        self.edges.append(edge)

    def build_in_memory_graph(self) -> dict:
        """
        Dynamically extracts and constructs nodes & relationships from static mapping sets.
        Creates an adjacency structure portable to Neo4j.
        """
        # 1. Build Skill Nodes
        for category, skills in SKILLS_DICTIONARY.items():
            for skill in skills:
                skill_id = self._normalize_id("skill", skill)
                if skill_id not in self.nodes:
                    self.add_node(GraphNode(id=skill_id, type="Skill", name=skill, category=category))
                    
        # 2. Build Subskill Nodes and PART_OF Edges
        for skill, subskills in SKILL_TOPICS.items():
            skill_id = self._normalize_id("skill", skill)
            for sub in subskills:
                sub_id = self._normalize_id("subskill", sub)
                if sub_id not in self.nodes:
                    self.add_node(GraphNode(id=sub_id, type="Subskill", name=sub, category=skill))
                self.add_edge(GraphEdge(source=skill_id, target=sub_id, type="PART_OF"))
                
        # 3. Inject critical traversal REQUIRES edges defining knowledge logic flows
        manual_deps = [
            ("Dynamic Programming", "Recursion", "REQUIRES", 0.9),
            ("Recursion", "Problem Solving", "REQUIRES", 0.8),
            ("Docker", "Containers", "REQUIRES", 1.0),
            ("Docker", "Linux", "REQUIRES", 0.8),
            ("React", "JavaScript", "REQUIRES", 0.9),
            ("Machine Learning", "Statistics", "REQUIRES", 0.8),
            ("Machine Learning", "Python", "REQUIRES", 0.9),
            ("Deep Learning", "Machine Learning", "REQUIRES", 1.0),
            ("PyTorch", "Deep Learning", "REQUIRES", 0.9),
            ("Kubernetes", "Docker", "REQUIRES", 0.9),
            ("Ethereum", "Cryptography", "REQUIRES", 0.8),
            ("Spring Boot", "Java", "REQUIRES", 1.0),
        ]
        
        for source, target, rel_type, weight in manual_deps:
            s_id = self._normalize_id("skill", source)
            t_id = self._normalize_id("skill", target)
            
            # Autocreate missing topics
            if s_id not in self.nodes:
                self.add_node(GraphNode(id=s_id, type="Skill", name=source))
            if t_id not in self.nodes:
                self.add_node(GraphNode(id=t_id, type="Topic", name=target))
                
            self.add_edge(GraphEdge(source=s_id, target=t_id, type=rel_type, weight=weight))
            
        return {"nodes": self.nodes, "edges": self.edges}
