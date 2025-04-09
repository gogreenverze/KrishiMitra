from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ai_agent import get_response_from_gpt
from agri_prompt import build_prompt

# Initialize FastAPI app
app = FastAPI(
    title="KrishiMitra API",
    description="A multilingual AI assistant for Indian farmers",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Define request model
class Query(BaseModel):
    question: str
    language: str = "English"

# Define response model
class Response(BaseModel):
    reply: str

@app.get("/")
async def root():
    """Root endpoint to check if the API is running."""
    return {"message": "Welcome to KrishiMitra API! Use /ask endpoint to ask questions."}

@app.post("/ask", response_model=Response)
async def ask_agent(query: Query):
    """
    Endpoint to ask questions to KrishiMitra.
    
    Args:
        query (Query): The query containing the question and language
        
    Returns:
        Response: The response from KrishiMitra
    """
    if not query.question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    prompt = build_prompt(query.question, query.language)
    reply = await get_response_from_gpt(prompt)
    
    return Response(reply=reply)

# Run the app with uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
