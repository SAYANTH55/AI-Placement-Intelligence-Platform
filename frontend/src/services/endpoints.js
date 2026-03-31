import API from "./api";

export const uploadResume = (formData) =>
  API.post("/upload_resume", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

export const analyzeJD = (data) =>
  API.post("/analyze_jd", data);

export const getResults = () =>
  API.get("/results");
