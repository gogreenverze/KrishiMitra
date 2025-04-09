import os
from gtts import gTTS
from tempfile import NamedTemporaryFile

# Language code mapping
LANGUAGE_CODE_MAP = {
    "Tamil": "ta",
    "Hindi": "hi",
    "Telugu": "te",
    "Kannada": "kn",
    "Malayalam": "ml",
    "Bengali": "bn",
    "Marathi": "mr",
    "Gujarati": "gu",
    "Punjabi": "pa",
    "Urdu": "ur",
    "English": "en"
}

def text_to_speech(text, language="English"):
    """
    Convert text to speech using Google Text-to-Speech.
    
    Args:
        text (str): The text to convert to speech
        language (str): The language of the text
        
    Returns:
        str: Path to the generated audio file
    """
    # Get the language code
    lang_code = LANGUAGE_CODE_MAP.get(language, "en")
    
    # Create a gTTS object
    tts = gTTS(text=text, lang=lang_code, slow=False)
    
    # Save to a temporary file
    tmp = NamedTemporaryFile(delete=False, suffix=".mp3")
    tts.save(tmp.name)
    tmp.close()
    
    return tmp.name  # Return path to mp3 file
