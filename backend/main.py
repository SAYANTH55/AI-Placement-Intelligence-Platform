from fastapi import FastAPI
from backend.api import endpoints

app = FastAPI(title="AI Placement Intelligence Platform API")

# Include routers
app.include_router(endpoints.router)

@app.get("/")
async def root():
    return {"message": "Welcome to AI Placement Intelligence Platform API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
