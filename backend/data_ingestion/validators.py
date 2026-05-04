def validate_student_profile(data: dict) -> dict:
    """
    Validates that the unified schema contains requisite core information.
    Appends warning flags instead of raising hard exceptions to ensure robust pipeline execution.
    """
    flags = data.get("flags", [])
    
    if not data.get("student_id"):
        # This is a critical system fault, not a data fault, but we'll flag it anyway
        flags.append("CRITICAL:MISSING_ID")
        
    if not data.get("skills"):
        flags.append("MISSING_SKILLS")
    elif len(data.get("skills")) < 3:
        flags.append("LOW_CONFIDENCE_PROFILE")
        
    if not data.get("profile", {}).get("name"):
        flags.append("MISSING_NAME")
        
    if data.get("experience", {}).get("years", 0.0) == 0.0:
        flags.append("PARTIAL_DATA")

    # Deduplicate flags
    data["flags"] = list(set(flags))
    
    return data
