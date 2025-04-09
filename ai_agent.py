import os
from dotenv import load_dotenv
from openai import AsyncOpenAI

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def get_response_from_gpt(prompt):
    """
    Get a response from GPT based on the provided prompt.
    
    Args:
        prompt (str): The prompt to send to GPT
        
    Returns:
        str: The response from GPT
    """
    try:
        response = await client.chat.completions.create(
            model="gpt-4-turbo-preview",  # Using the latest available model
            messages=[
                {"role": "system", "content": "You are KrishiMitra, a helpful agriculture advisor for Indian farmers."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=200
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error getting response from GPT: {str(e)}"
