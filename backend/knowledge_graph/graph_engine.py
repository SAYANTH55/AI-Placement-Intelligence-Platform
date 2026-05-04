from collections import defaultdict, deque
import logging

logger = logging.getLogger(__name__)

class GraphEngine:
    def __init__(self, build_data: dict):
        self.nodes = build_data["nodes"]
        self.adjacency_out = defaultdict(list)
        self.adjacency_in = defaultdict(list)
        
        for edge in build_data["edges"]:
            # Phase 4: Initialize edges with weights and success metrics
            edge_obj = {
                "target": edge.target,
                "type": edge.type,
                "weight": getattr(edge, "weight", 1.0),
                "success_count": getattr(edge, "success_count", 0),
                "attempts_count": getattr(edge, "attempts_count", 0) # ISSUE C
            }
            self.adjacency_out[edge.source].append(edge_obj)
            self.adjacency_in[edge.target].append({"source": edge.source, "type": edge.type})

    def boost_edge(self, source_name: str, target_name: str, success: bool = True) -> bool:
        """
        Dynamically learns from user success with GUARDRAILS (ISSUE C).
        """
        MIN_SUPPORT = 10 
        CONFIDENCE_THRESHOLD = 0.65
        MAX_WEIGHT = 2.5 
        
        source_id = self._find_node_id_by_name(source_name)
        target_id = self._find_node_id_by_name(target_name)
        if not source_id or not target_id: return False
        
        for edge in self.adjacency_out.get(source_id, []):
            if edge["target"] == target_id:
                edge["attempts_count"] += 1
                if success:
                    edge["success_count"] += 1
                
                # Only update weight if we have enough data (ISSUE C)
                if edge["attempts_count"] >= MIN_SUPPORT:
                    emp_conf = edge["success_count"] / edge["attempts_count"]
                    if emp_conf >= CONFIDENCE_THRESHOLD:
                        # Boost
                        edge["weight"] = min(edge["weight"] + 0.05, MAX_WEIGHT)
                    else:
                        # Slight penalty if falling below threshold
                        edge["weight"] = max(edge["weight"] * 0.98, 1.0)
                
                return True
        return False

    def apply_graph_decay(self):
        """
        Temporal decay of learned edges to prevent legacy patterns from dominating (ISSUE 2).
        """
        for source_id, edges in self.adjacency_out.items():
            for edge in edges:
                # Decay towards baseline (1.0), but never below foundations
                if edge["weight"] > 1.0:
                    edge["weight"] = max(edge["weight"] * 0.995, 1.0)

    def _find_node_id_by_name(self, name: str) -> str:
        name_lower = name.lower()
        for node_id, node in self.nodes.items():
            if node.name.lower() == name_lower:
                return node_id
        return None

    def get_dependencies(self, skill_name: str) -> list:
        node_id = self._find_node_id_by_name(skill_name)
        if not node_id: return []
        
        deps = []
        for edge in self.adjacency_out.get(node_id, []):
            if edge["type"] == "REQUIRES":
                deps.append(self.nodes[edge["target"]].name)
        return deps

    def traverse_multi_hop_dependencies(self, skill_name: str, max_depth: int = 3) -> list:
        """
        Calculates transitive requirements safely preventing O(N^2) infinite cycles.
        """
        start_id = self._find_node_id_by_name(skill_name)
        if not start_id: return []
        
        visited = set()
        queue = deque([(start_id, 0)])
        result = []
        
        while queue:
            current_id, depth = queue.popleft()
            if depth > max_depth:
                continue
                
            if current_id not in visited:
                visited.add(current_id)
                if current_id != start_id:
                    result.append(self.nodes[current_id].name)
                    
                for edge in self.adjacency_out.get(current_id, []):
                    if edge["type"] == "REQUIRES" and edge["target"] not in visited:
                        queue.append((edge["target"], depth + 1))
                        
        return result
