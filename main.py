import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from ai_agent import get_response_from_gpt
from agri_prompt import build_prompt
from voice_input import transcribe_audio
from voice_output import text_to_speech

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

@app.post("/voice-ask/")
async def ask_by_voice(audio: UploadFile = File(...), language: str = Form("English")):
    """
    Endpoint to ask questions to KrishiMitra using voice input.

    Args:
        audio (UploadFile): The audio file containing the farmer's question
        language (str): The language to respond in

    Returns:
        FileResponse: The audio file containing the response
    """
    # Step 1: Convert voice to text
    farmer_text = await transcribe_audio(audio)

    # Step 2: Build and send prompt
    prompt = build_prompt(farmer_text, language)
    reply = await get_response_from_gpt(prompt)

    # Step 3: Convert reply to speech
    mp3_path = text_to_speech(reply, language)

    # Step 4: Return voice reply as downloadable audio
    return FileResponse(
        mp3_path,
        media_type="audio/mpeg",
        filename="krishimitra_reply.mp3",
        headers={"Content-Disposition": f"attachment; filename=krishimitra_reply.mp3"}
    )

# Run the app with uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
