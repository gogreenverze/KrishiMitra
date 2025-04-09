# KrishiMitra - Multilingual AI Assistant for Farmers

KrishiMitra is a FastAPI-based backend that accepts a farmer's question in any Indian language and returns a GPT-generated response in the same language, tailored to agriculture.

## Project Structure

```
krishimitra/
├── main.py                  # FastAPI entry point
├── agri_prompt.py           # GPT prompt template
├── ai_agent.py              # GPT interaction logic
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
3. Create a `.env` file based on `.env.example` and add your OpenAI API key:
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
Endpoint to ask questions to KrishiMitra.

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

## Future Enhancements

- Add language detection
- Implement caching for common questions
- Add more agriculture-specific knowledge to the prompts
- Integrate with SMS or WhatsApp for wider accessibility
