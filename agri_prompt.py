def build_prompt(user_input, language="English"):
    """
    Build a prompt for the GPT model based on user input and language.
    
    Args:
        user_input (str): The farmer's question
        language (str): The language to respond in
        
    Returns:
        str: The formatted prompt for GPT
    """
    return f"""
You are KrishiMitra, a multilingual AI agent that helps Indian farmers.
Respond in {language}. Be short, simple, and friendly.

Farmer's question: {user_input}
Reply:
"""
