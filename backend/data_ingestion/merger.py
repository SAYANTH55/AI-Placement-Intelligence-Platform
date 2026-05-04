import copy

SOURCE_WEIGHTS = {
    "manual": 0.9,
    "resume": 0.7,
    "academic": 0.6,
    "unknown": 0.1
}

def get_weight(source: str) -> float:
    return SOURCE_WEIGHTS.get(source, 0.1)

def merge_profiles(old: dict, new: dict) -> dict:
    """
    Intelligently merges a new profile into an existing one based on source weights.
    """
    merged = copy.deepcopy(old)
    
    old_source = old.get("source", "unknown")
    new_source = new.get("source", "unknown")
    
    # 1. Profile merging (strings)
    # If the new source is heavier or equal, overwrite basic fields if they exist
    if get_weight(new_source) >= get_weight(old_source):
        for key in ["name", "email", "phone"]:
            if new.get("profile", {}).get(key):
                merged.setdefault("profile", {})[key] = new["profile"][key]
                
    # 2. Experience mapping
    old_exp = merged.get("experience", {}).get("years", 0.0)
    new_exp = new.get("experience", {}).get("years", 0.0)
    if new_exp > old_exp:
        merged.setdefault("experience", {})["years"] = new_exp
        
    # 3. Skills Merging
    # Union list, keep highest confidence duplicate scaled by source weight
    skills_map = {}
    
    for s in old.get("skills", []):
        s_name = s.get("name", "").lower()
        skills_map[s_name] = s
        
    for s in new.get("skills", []):
        s_name = s.get("name", "").lower()
        if s_name in skills_map:
            # Overwrite if new confidence is higher or weight is dominant
            if s.get("confidence", 0) > skills_map[s_name].get("confidence", 0) or get_weight(new_source) > get_weight(skills_map[s_name].get("source", "unknown")):
                 skills_map[s_name] = s
        else:
            skills_map[s_name] = s
            
    merged["skills"] = list(skills_map.values())
    
    # 4. History Merging
    old_history = merged.get("metadata", {}).get("history", [])
    new_history = new.get("metadata", {}).get("history", [])
    
    current_version = merged.get("metadata", {}).get("version", 1)
    
    merged["metadata"]["version"] = current_version + 1
    
    # Clean history appending
    combined_history = old_history + [{"action": "update", "source": new_source, "timestamp": new.get("metadata", {}).get("updated_at")}]
    merged["metadata"]["history"] = combined_history
    
    # 5. Flags Union
    merged["flags"] = list(set(old.get("flags", []) + new.get("flags", [])))
    
    # Maintain raw text payload for ML analysis locally
    merged["metadata"]["raw_text"] = new.get("metadata", {}).get("raw_text", merged.get("metadata", {}).get("raw_text"))
    
    return merged
