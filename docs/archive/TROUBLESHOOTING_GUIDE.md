# Troubleshooting Guide - Resume Analysis Not Working

## ✅ What Was Fixed

1. **Dashboard Routing** - Fixed nested Routes to properly display Analysis, Skills, Score, and Recommendations pages
2. **Error Handling** - Added detailed error messages in UploadBox with server diagnostics
3. **Console Logging** - Added debugging logs to track the upload and analysis process

---

## 🔍 Step-by-Step Troubleshooting

### Step 1: Verify Backend is Running

**Check if the backend server is active:**

```bash
# Terminal 1: Navigate to backend
cd backend

# Check if server is already running
netstat -ano | findstr :8000  (Windows)
lsof -i :8000  (Mac/Linux)

# If not running, start it:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

### Step 2: Verify Frontend is Running

```bash
# Terminal 2: Navigate to frontend
cd frontend

# If you haven't installed dependencies:
npm install

# Start the development server
npm run dev
```

**Expected Output:**
```
  ➜  Local:   http://localhost:5173/
```

### Step 3: Test the API Endpoint Directly

Open your browser and navigate to:
- **API Documentation:** `http://localhost:8000/docs`
- **API Health Check:** `http://localhost:8000/`

You should see:
```json
{
  "message": "Welcome to AI Placement Intelligence Platform API v2",
  "features": [...],
  "docs": "/docs"
}
```

### Step 4: Check Browser Console for Errors

1. Open the application: `http://localhost:5173`
2. Press `F12` to open Developer Tools
3. Go to the **Console** tab
4. Try uploading a resume
5. Look for console messages starting with:
   - `🚀 Starting resume upload...`
   - `✅ API Response:` (should show the data structure)
   - `❌ Analysis failed:` (if there's an error)

### Step 5: Verify File is Valid

**The backend accepts:**
- PDF (.pdf)
- Word Document (.doc, .docx)
- Text (.txt)

**Make sure your test resume:**
- Is a real resume file (not corrupted)
- Contains actual text content
- Is less than 10MB in size

---

## 🐛 Common Issues & Solutions

### Issue 1: "Backend server is not running"

**Symptoms:**
- Error alert: "Backend server is not running. Please start it first."
- Console shows: Network Error

**Solution:**
```bash
cd backend
pip install -r ../requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

### Issue 2: "Invalid file format"

**Symptoms:**
- Error: "Invalid file format. Please upload a PDF, DOC, or DOCX file."
- Status Code: 422

**Solution:**
- Ensure file is in PDF, DOC, or DOCX format
- Verify file is not corrupted
- Try a different resume file

---

### Issue 3: "No skills extracted from resume"

**Symptoms:**
- Error: "No skills extracted from resume"
- Page loads but shows no skill data

**Possible causes:**
- Resume doesn't contain recognized technical skills
- Resume text extraction failed (corrupted PDF)
- Skill keywords not in the SKILLS_DICTIONARY

**Solution:**
- Add common technical skills to your resume (Python, JavaScript, React, etc.)
- Check [SKILLS_DICTIONARY](ai_model/data/skills_data.py) for recognized skills
- Verify resume text can be extracted: `http://localhost:8000/docs` → Try `/upload_resume` endpoint with Swagger UI

---

### Issue 4: "Page navigation not working"

**Symptoms:**
- Click on Skill Gap / Placement Score / Recommendations but page doesn't change
- Empty state message appears instead of data

**Solution:**
1. **Upload a resume first on the Overview tab**
2. Data is stored in component state and persists across page navigation
3. Check console for routing errors: `[Route] No match for location...`

---

### Issue 5: "API returns but data is empty"

**Symptoms:**
- Upload completes (100%)
- Button shows "complete"
- But no analysis data displays

**Solution:**
1. Check console logs for the actual response data
2. Go to `http://localhost:8000/docs` 
3. Try the `/upload_resume` endpoint manually with Swagger UI
4. Copy the response and verify structure matches:
   ```json
   {
     "status": "success",
     "filename": "resume.pdf",
     "data": {
       "extractedText": "...",
       "skills": ["Python", "React", ...],
       "experience": "5 years",
       "prediction": {
         "placement_probability": 0.85,
         "readiness": "High"
       },
       "roleMatches": [
         {
           "role": "Full Stack Developer",
           "match": 85,
           "present": [...],
           "missing": [...],
           "salary": "..."
         }
       ]
     }
   }
   ```

---

## 🧪 Testing Checklist

- [ ] Backend is running on port 8000
- [ ] Frontend is running on port 5173
- [ ] Can access API docs: `http://localhost:8000/docs`
- [ ] Browser console shows no CORS errors
- [ ] Resume file is valid PDF/DOCX format
- [ ] Resume contains at least 2-3 technical skills
- [ ] Upload completes without network errors
- [ ] Console shows `✅ API Response:` message
- [ ] Analysis data appears on Overview tab
- [ ] Can navigate to Skill Gap / Score / Recommendations
- [ ] Clicking "New Analysis" resets the form

---

## 📊 Expected Data Flow

```
Frontend Upload
    ↓
POST /upload_resume (FormData with file)
    ↓
Backend: Parse Resume
    ├─ extract_text_from_pdf/docx
    ├─ extract skills with fuzzy matching
    ├─ predict_placement probability
    └─ calculate_role_matches
    ↓
Response: { status, data }
    ↓
Frontend: Format data
    ├─ Calculate scores
    ├─ Map role matches
    └─ Generate recommendations
    ↓
Display on Dashboard
    ├─ Overview: Extracted text + detected skills
    ├─ Skill Gap: Skills by role (present/missing)
    ├─ Score: Placement readiness percentage
    └─ Recommendations: Learning path
```

---

## 🔧 Advanced Debugging

### Enable Debug Mode in Backend

Edit [backend/main.py](backend/main.py):

```python
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@app.post("/upload_resume")
async def upload_resume(...):
    logger.debug(f"Received file: {file.filename}")
    logger.debug(f"Parsed data: {parsed_data}")
    # ... rest of code
```

### Check Model Files

Verify placement prediction model exists:

```bash
ls -la ai_model/models/
# Should show: placement_predictor.pkl, skill_vectorizer.pkl
```

If missing, run:
```bash
cd ai_model
python train_models.py
```

---

## 📝 Log Collection

Gather these logs when reporting issues:

1. **Frontend Console** (F12 → Console tab):
   - Copy all messages starting with 🚀, ✅, ❌

2. **Backend Console Output**:
   - Copy the full error message

3. **API Response** (F12 → Network tab):
   - Click on `/upload_resume` request
   - Check Response tab
   - Copy the full JSON

4. **Browser Info**:
   - Your OS: Windows / Mac / Linux
   - Browser: Chrome / Firefox / Safari
   - Resume file type: PDF / DOCX

---

## 📞 Getting Help

If issues persist:

1. **Check all console logs** (frontend and backend)
2. **Verify all requirements** are installed:
   ```bash
   pip install -r requirements.txt
   python -m spacy download en_core_web_sm
   ```
3. **Restart both servers** completely
4. **Clear browser cache** (Ctrl+Shift+Delete)
5. **Test with a simple resume** (just technical skills)

---

## ✨ Expected Behavior After Fix

1. ✅ Upload resume → Shows analysis in real-time
2. ✅ Navigate between pages → Data persists
3. ✅ All pages show data → No empty states
4. ✅ Error messages are specific → "Server error: X" not generic
5. ✅ Console shows debug logs → Can track flow
6. ✅ All features work → Analysis, Gap, Score, Recommendations
