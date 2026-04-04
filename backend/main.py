from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import endpoints

app = FastAPI(title="AI Placement Intelligence Platform API")

# Allow all origins for development (restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(endpoints.router)

@app.get("/")
async def root():
    return {"message": "Welcome to AI Placement Intelligence Platform API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
