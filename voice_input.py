import os
from tempfile import NamedTemporaryFile
from fastapi import UploadFile

# This is a temporary implementation that doesn't use Whisper
# It will be replaced with the actual Whisper implementation once ffmpeg is installed

import random
import time

async def transcribe_audio(audio: UploadFile):
    """
    Simulates transcribing audio with dynamic content based on audio metadata.
    In a real implementation, this would use Whisper to convert speech to text.

    Args:
        audio (UploadFile): The uploaded audio file

    Returns:
        str: The transcribed text
    """
    # Save the uploaded file to a temporary file
    with NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # Extract information from the audio file metadata
        file_name = audio.filename.lower()
        file_size = len(content)
        timestamp = int(time.time())

        # Use these values to create a more dynamic response
        # In a real implementation, we would use Whisper to get the actual content

        # Define topic keywords that might be in the filename or could be detected
        topics = {
            "rice": ["rice", "paddy", "धान", "चावल", "நெல்", "அரிசி"],
            "wheat": ["wheat", "गेहूं", "கோதுமை"],
            "pest": ["pest", "insect", "bug", "कीट", "कीड़े", "பூச்சி"],
            "fertilizer": ["fertilizer", "manure", "compost", "उर्वरक", "खाद", "உரம்"],
            "water": ["water", "irrigation", "rain", "पानी", "सिंचाई", "நீர்", "பாசனம்"],
            "soil": ["soil", "land", "मिट्टी", "भूमि", "மண்", "நிலம்"],
            "organic": ["organic", "natural", "जैविक", "प्राकृतिक", "இயற்கை"],
            "season": ["season", "weather", "climate", "मौसम", "जलवायु", "பருவம்", "காலநிலை"]
        }

        # Determine language from filename or metadata
        language = "English"  # Default
        if any(char in file_name for char in "हिंदीफसलखेती"):
            language = "Hindi"
        elif any(char in file_name for char in "தமிழ்பயிர்நெல்"):
            language = "Tamil"
        elif any(char in file_name for char in "తెలుగు"):
            language = "Telugu"

        # Determine topic from filename or use timestamp to select random topic
        detected_topics = []
        for topic, keywords in topics.items():
            if any(keyword in file_name for keyword in keywords):
                detected_topics.append(topic)

        # If no topics detected, use timestamp to select random topics
        if not detected_topics:
            # Use the timestamp to select 1-2 random topics
            random.seed(timestamp % 100)  # Use last two digits of timestamp as seed
            num_topics = random.randint(1, 2)
            detected_topics = random.sample(list(topics.keys()), num_topics)

        # Generate a question based on detected topics and language
        question_templates = {
            "English": {
                "rice": ["How can I increase rice yield in my field?", "What is the best time to plant rice in this season?", "How much water does rice need during growth?"],
                "wheat": ["What are the best wheat varieties for my region?", "How do I prevent wheat rust disease?", "When should I harvest wheat for best quality?"],
                "pest": ["How can I control pests without chemicals?", "What natural methods work for pest control in my crops?", "Which beneficial insects help control crop pests?"],
                "fertilizer": ["What organic fertilizers work best for my crops?", "How often should I apply fertilizer to my field?", "How can I make compost at home for my farm?"],
                "water": ["How can I conserve water in my farm during summer?", "What irrigation methods are most efficient?", "How much water does my crop need weekly?"],
                "soil": ["How can I improve soil fertility naturally?", "What crops are best for my soil type?", "How do I test soil quality at home?"],
                "organic": ["How do I transition to organic farming?", "What organic pesticides are effective?", "How can I get organic certification for my produce?"],
                "season": ["What crops should I plant this season?", "How will changing weather affect my crops?", "How do I prepare my farm for the monsoon season?"]
            },
            "Hindi": {
                "rice": ["मैं अपने खेत में धान की उपज कैसे बढ़ा सकता हूँ?", "इस मौसम में धान लगाने का सबसे अच्छा समय क्या है?", "धान को विकास के दौरान कितने पानी की आवश्यकता होती है?"],
                "wheat": ["मेरे क्षेत्र के लिए सबसे अच्छी गेहूं की किस्में कौन सी हैं?", "मैं गेहूं के रस्ट रोग को कैसे रोक सकता हूँ?", "सर्वोत्तम गुणवत्ता के लिए गेहूं की कटाई कब करनी चाहिए?"],
                "pest": ["मैं रसायनों के बिना कीटों को कैसे नियंत्रित कर सकता हूँ?", "मेरी फसलों में कीट नियंत्रण के लिए कौन से प्राकृतिक तरीके काम करते हैं?", "कौन से लाभकारी कीड़े फसल के कीटों को नियंत्रित करने में मदद करते हैं?"],
                "fertilizer": ["मेरी फसलों के लिए कौन से जैविक उर्वरक सबसे अच्छे काम करते हैं?", "मुझे अपने खेत में कितनी बार उर्वरक डालना चाहिए?", "मैं अपने खेत के लिए घर पर खाद कैसे बना सकता हूँ?"],
                "water": ["गर्मी के दौरान मैं अपने खेत में पानी कैसे बचा सकता हूँ?", "कौन सी सिंचाई विधियां सबसे कुशल हैं?", "मेरी फसल को साप्ताहिक कितने पानी की आवश्यकता होती है?"],
                "soil": ["मैं प्राकृतिक रूप से मिट्टी की उर्वरता कैसे बढ़ा सकता हूँ?", "मेरी मिट्टी के प्रकार के लिए कौन सी फसलें सबसे अच्छी हैं?", "मैं घर पर मिट्टी की गुणवत्ता का परीक्षण कैसे करूँ?"],
                "organic": ["मैं जैविक खेती में कैसे बदलाव करूँ?", "कौन से जैविक कीटनाशक प्रभावी हैं?", "मैं अपने उत्पादों के लिए जैविक प्रमाणन कैसे प्राप्त कर सकता हूँ?"],
                "season": ["इस मौसम में मुझे कौन सी फसलें लगानी चाहिए?", "बदलते मौसम से मेरी फसलों पर क्या प्रभाव पड़ेगा?", "मैं मानसून के मौसम के लिए अपने खेत को कैसे तैयार करूँ?"]
            },
            "Tamil": {
                "rice": ["என் வயலில் நெல் மகசூலை எப்படி அதிகரிக்க முடியும்?", "இந்த பருவத்தில் நெல் நடவு செய்ய சிறந்த நேரம் எது?", "வளர்ச்சியின் போது நெல்லுக்கு எவ்வளவு நீர் தேவை?"],
                "wheat": ["என் பகுதிக்கு சிறந்த கோதுமை ரகங்கள் எவை?", "கோதுமை துரு நோயை எவ்வாறு தடுக்கலாம்?", "சிறந்த தரத்திற்கு கோதுமையை எப்போது அறுவடை செய்ய வேண்டும்?"],
                "pest": ["இரசாயனங்கள் இல்லாமல் பூச்சிகளை எவ்வாறு கட்டுப்படுத்துவது?", "என் பயிர்களில் பூச்சி கட்டுப்பாட்டிற்கு எந்த இயற்கை முறைகள் பயனுள்ளதாக இருக்கும்?", "எந்த பயனுள்ள பூச்சிகள் பயிர் பூச்சிகளை கட்டுப்படுத்த உதவுகின்றன?"],
                "fertilizer": ["என் பயிர்களுக்கு எந்த இயற்கை உரங்கள் சிறப்பாக செயல்படும்?", "என் வயலில் எவ்வளவு முறை உரம் இட வேண்டும்?", "என் தோட்டத்திற்காக வீட்டில் எப்படி கம்போஸ்ட் தயாரிக்கலாம்?"],
                "water": ["கோடை காலத்தில் என் தோட்டத்தில் நீரை எவ்வாறு சேமிக்கலாம்?", "எந்த பாசன முறைகள் மிகவும் திறமையானவை?", "என் பயிருக்கு வாரந்தோறும் எவ்வளவு நீர் தேவை?"],
                "soil": ["இயற்கையாக மண் வளத்தை எவ்வாறு மேம்படுத்துவது?", "என் மண் வகைக்கு சிறந்த பயிர்கள் எவை?", "வீட்டில் மண் தரத்தை எவ்வாறு சோதிப்பது?"],
                "organic": ["இயற்கை விவசாயத்திற்கு எவ்வாறு மாறுவது?", "எந்த இயற்கை பூச்சிக்கொல்லிகள் பயனுள்ளவை?", "என் விளைபொருட்களுக்கு இயற்கை சான்றிதழை எவ்வாறு பெறுவது?"],
                "season": ["இந்த பருவத்தில் நான் என்ன பயிர்களை நட வேண்டும்?", "மாறும் வானிலை என் பயிர்களை எவ்வாறு பாதிக்கும்?", "மழைக்காலத்திற்கு என் தோட்டத்தை எவ்வாறு தயார் செய்வது?"]
            },
            "Telugu": {
                "rice": ["నా పొలంలో వరి దిగుబడిని ఎలా పెంచగలను?", "ఈ సీజన్‌లో వరి నాటడానికి ఉత్తమ సమయం ఏది?", "పెరుగుదల సమయంలో వరికి ఎంత నీరు అవసరం?"],
                "pest": ["రసాయనాలు లేకుండా పురుగులను ఎలా నియంత్రించగలను?", "నా పంటలలో పురుగుల నియంత్రణకు ఏ సహజ పద్ధతులు పనిచేస్తాయి?", "ఏ ప్రయోజనకరమైన కీటకాలు పంట పురుగులను నియంత్రించడంలో సహాయపడతాయి?"]
            }
        }

        # Select a random question for each detected topic
        questions = []
        for topic in detected_topics:
            if topic in question_templates.get(language, question_templates["English"]):
                topic_questions = question_templates[language][topic]
                # Use timestamp to select a question deterministically
                question_index = (timestamp + len(topic)) % len(topic_questions)
                questions.append(topic_questions[question_index])
            else:
                # Fallback to English if the topic doesn't exist in the selected language
                if topic in question_templates["English"]:
                    topic_questions = question_templates["English"][topic]
                    question_index = (timestamp + len(topic)) % len(topic_questions)
                    questions.append(topic_questions[question_index])

        # If no questions were generated, use a default question
        if not questions:
            default_questions = {
                "English": "How can I improve my farm's productivity this season?",
                "Hindi": "मैं इस मौसम में अपने खेत की उत्पादकता कैसे बढ़ा सकता हूँ?",
                "Tamil": "இந்த பருவத்தில் என் தோட்டத்தின் உற்பத்தித்திறனை எவ்வாறு மேம்படுத்துவது?",
                "Telugu": "ఈ సీజన్‌లో నా పొలం ఉత్పాదకతను ఎలా మెరుగుపరచగలను?"
            }
            questions = [default_questions.get(language, default_questions["English"])]

        # Return the first question (or combine multiple questions if needed)
        return questions[0]
    finally:
        # Clean up the temporary file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
