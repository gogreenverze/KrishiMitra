import os
import whisper
from tempfile import NamedTemporaryFile
from fastapi import UploadFile

# Load the Whisper model
# Use "tiny" for speed, "base"/"small" for accuracy
model = None

def load_model():
    global model
    if model is None:
        model = whisper.load_model("base")
    return model

async def transcribe_audio(audio: UploadFile):
    """
    Transcribe audio file to text using Whisper.
    
    Args:
        audio (UploadFile): The uploaded audio file
        
    Returns:
        str: The transcribed text
    """
    # Load the model if not already loaded
    model = load_model()
    
    # Save the uploaded file to a temporary file
    with NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        # Transcribe the audio file
        result = model.transcribe(tmp_path, fp16=False)
        return result['text']
    finally:
        # Clean up the temporary file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
