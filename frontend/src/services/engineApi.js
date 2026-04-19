/**
 * Engine API Service
 * Centralized API client for the Preparation, Practice, and Tracking engine endpoints.
 * Matches the FastAPI routes defined in engine_routes.py.
 */

const BASE_URL = 'http://localhost:8000';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  ...(localStorage.getItem('access_token')
    ? { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    : {}),
});

/** Preparation Engine: generate a learning roadmap from missing skills */
export const fetchPreparationPlan = async (missingSkills, topRole) => {
  const res = await fetch(`${BASE_URL}/preparation/plan`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ missing_skills: missingSkills, top_role: topRole }),
  });
  if (!res.ok) throw new Error(`Preparation plan failed: ${res.status}`);
  const json = await res.json();
  return json.data;
};

/** Practice Engine: get role-specific aptitude/coding/interview questions */
export const fetchPracticeSet = async (topRole, skills = [], limitCoding = 10, limitAptitude = 15, limitInterview = 12) => {
  const res = await fetch(`${BASE_URL}/practice/set`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      top_role: topRole,
      skills,
      limit_coding: limitCoding,
      limit_aptitude: limitAptitude,
      limit_interview: limitInterview,
    }),
  });
  if (!res.ok) throw new Error(`Practice set failed: ${res.status}`);
  const json = await res.json();
  return json.data;
};

/** Tracking Engine: record a practice session */
export const recordSession = async (sessionData) => {
  const res = await fetch(`${BASE_URL}/tracking/record`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(sessionData),
  });
  if (!res.ok) throw new Error(`Record session failed: ${res.status}`);
  return res.json();
};

/** Tracking Engine: retrieve user progress history */
export const fetchProgress = async (userId) => {
  const res = await fetch(`${BASE_URL}/tracking/progress/${userId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Fetch progress failed: ${res.status}`);
  const json = await res.json();
  return json.data;
};

/** Tracking Engine: feedback loop — re-compute score from new skills */
export const submitFeedback = async (userId, currentSkills, newSkills, topRole = null) => {
  const res = await fetch(`${BASE_URL}/tracking/feedback`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      user_id: userId,
      current_skills: currentSkills,
      new_skills: newSkills,
      top_role: topRole,
    }),
  });
  if (!res.ok) throw new Error(`Feedback failed: ${res.status}`);
  const json = await res.json();
  return json.data;
};
