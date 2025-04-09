# KrishiMitra - Multilingual AI Assistant for Farmers

KrishiMitra is a FastAPI-based backend that accepts a farmer's question in any Indian language and returns a GPT-generated response in the same language, tailored to agriculture.

## Project Structure

```
krishimitra/
├── main.py                  # FastAPI entry point
├── agri_prompt.py           # GPT prompt template
├── ai_agent.py              # GPT interaction logic
├── voice_input.py           # Speech-to-text using Whisper
├── voice_output.py          # Text-to-speech using gTTS
├── requirements.txt         # Project dependencies
├── .env                     # API keys (OpenAI, etc.)
└── README.md                # Project documentation
```

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Install ffmpeg (required for audio processing):
   ```bash
   # For Mac
   brew install ffmpeg

   # For Linux
   apt install ffmpeg

   # For Windows
   # Download from https://ffmpeg.org/download.html
   ```
4. Create a `.env` file based on `.env.example` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_key_here
   ```

## Running the Application

```bash
uvicorn main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

## API Endpoints

### GET /
Root endpoint to check if the API is running.

### POST /ask
Endpoint to ask questions to KrishiMitra using text input.

**Request Body:**
```json
{
  "question": "Your question here",
  "language": "Language name (default: English)"
}
```

**Example:**
```json
{
  "question": "பயிர் மஞ்சள் ஆகுது என்ன செய்வது?",
  "language": "Tamil"
}
```

**Response:**
```json
{
  "reply": "GPT-generated response in the specified language"
}
```

### POST /voice-ask
Endpoint to ask questions to KrishiMitra using voice input.

**Request:**
- Form data with:
  - `audio`: Audio file (MP3, WAV, etc.) containing the farmer's question
  - `language`: Language name (default: English)

**Response:**
- Audio file (MP3) containing the spoken response from KrishiMitra

**Example using curl:**
```bash
curl -X POST "http://127.0.0.1:8000/voice-ask/?language=Tamil" \
  -F "audio=@question.mp3" \
  --output response.mp3
```

## Features

- **Multilingual Support**: Accepts and responds in multiple Indian languages
- **Text Input/Output**: Traditional text-based interaction
- **Voice Input/Output**: Speech-to-text and text-to-speech capabilities
- **Agriculture Focus**: Tailored responses for farming-related queries

## Future Enhancements

- Add automatic language detection
- Implement caching for common questions
- Add more agriculture-specific knowledge to the prompts
- Integrate with SMS or WhatsApp for wider accessibility
- Improve voice recognition for rural accents and dialects
