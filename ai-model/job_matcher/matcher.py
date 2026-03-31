from sklearn.metrics.pairwise import cosine_similarity

def calculate_match(resume_vec, jd_vec):
    # Placeholder for matching logic
    score = cosine_similarity([resume_vec], [jd_vec])
    return score[0][0]
