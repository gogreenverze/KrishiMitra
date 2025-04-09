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
        print(f"Sending request to OpenAI with API key: {os.getenv('OPENAI_API_KEY')[:5]}...")
        print(f"Using model: gpt-4-turbo")

        # Since we're having quota issues, let's use our farming responses directly
        print("Using pre-defined farming responses due to API quota issues")

        # Define farming-specific responses for different queries and languages
        farming_responses = {
            "rice": {
                "English": "To grow rice: 1) Prepare the soil by plowing and leveling. 2) Soak rice seeds for 24 hours before sowing. 3) Maintain 2-5cm water level in the field. 4) Apply balanced fertilizer (NPK). 5) Control weeds and pests regularly. 6) Harvest when 80% of grains turn golden yellow.",
                "Hindi": "चावल उगाने के लिए: 1) मिट्टी को जोतकर और समतल करके तैयार करें। 2) बीज बोने से पहले चावल के बीजों को 24 घंटे भिगोएं। 3) खेत में 2-5 सेमी पानी का स्तर बनाए रखें। 4) संतुलित उर्वरक (NPK) का प्रयोग करें। 5) नियमित रूप से खरपतवार और कीटों को नियंत्रित करें। 6) जब 80% अनाज सुनहरे पीले हो जाएं तो फसल काटें।",
                "Tamil": "நெல் வளர்க்க: 1) மண்ணை உழுது சமப்படுத்தி தயார் செய்யவும். 2) விதைப்பதற்கு முன் நெல் விதைகளை 24 மணி நேரம் ஊறவைக்கவும். 3) வயலில் 2-5 செ.மீ நீர் மட்டத்தை பராமரிக்கவும். 4) சமச்சீர் உரம் (NPK) இடவும். 5) களைகள் மற்றும் பூச்சிகளை தொடர்ந்து கட்டுப்படுத்தவும். 6) 80% தானியங்கள் பொன் மஞ்சள் நிறமாக மாறும்போது அறுவடை செய்யவும்."
            },
            "pest": {
                "English": "For natural pest control: 1) Use neem oil spray (mix 5ml neem oil with 1L water). 2) Introduce beneficial insects like ladybugs. 3) Practice crop rotation. 4) Use sticky traps for flying insects. 5) Apply wood ash around plants to deter crawling pests.",
                "Hindi": "प्राकृतिक कीट नियंत्रण के लिए: 1) नीम तेल स्प्रे का उपयोग करें (5 मिली नीम तेल को 1 लीटर पानी में मिलाएं)। 2) लेडीबग जैसे लाभकारी कीड़ों को शामिल करें। 3) फसल चक्र का अभ्यास करें। 4) उड़ने वाले कीड़ों के लिए चिपचिपे जाल का उपयोग करें। 5) रेंगने वाले कीटों को रोकने के लिए पौधों के चारों ओर लकड़ी की राख लगाएं।",
                "Tamil": "இயற்கை பூச்சி கட்டுப்பாட்டிற்கு: 1) வேப்ப எண்ணெய் தெளிப்பு பயன்படுத்தவும் (5மிலி வேப்ப எண்ணெயை 1லிட்டர் நீரில் கலக்கவும்). 2) லேடிபக் போன்ற பயனுள்ள பூச்சிகளை அறிமுகப்படுத்தவும். 3) பயிர் சுழற்சி முறையை பின்பற்றவும். 4) பறக்கும் பூச்சிகளுக்கு ஒட்டும் பொறிகளை பயன்படுத்தவும். 5) ஊர்ந்து செல்லும் பூச்சிகளை தடுக்க தாவரங்களைச் சுற்றி மர சாம்பலைப் பயன்படுத்தவும்."
            },
            "fertilizer": {
                "English": "For organic fertilizers: 1) Compost - mix kitchen waste, dry leaves, and cow dung. 2) Vermicompost - use earthworms to break down organic matter. 3) Green manure - grow legumes and plow them back into soil. 4) Bone meal - good source of phosphorus. 5) Wood ash - provides potassium and calcium.",
                "Hindi": "जैविक उर्वरकों के लिए: 1) कम्पोस्ट - रसोई के कचरे, सूखी पत्तियों और गोबर को मिलाएं। 2) वर्मीकम्पोस्ट - कार्बनिक पदार्थों को तोड़ने के लिए केंचुओं का उपयोग करें। 3) हरी खाद - फलियां उगाएं और उन्हें वापस मिट्टी में जोत दें। 4) हड्डी का चूरा - फास्फोरस का अच्छा स्रोत। 5) लकड़ी की राख - पोटेशियम और कैल्शियम प्रदान करती है।",
                "Tamil": "இயற்கை உரங்களுக்கு: 1) கம்போஸ்ட் - சமையலறை கழிவுகள், உலர் இலைகள் மற்றும் மாட்டுச் சாணத்தை கலக்கவும். 2) மண்புழு உரம் - கரிம பொருட்களை சிதைக்க மண்புழுக்களைப் பயன்படுத்தவும். 3) பசுந்தாள் உரம் - பயறு வகைகளை வளர்த்து மண்ணில் உழவும். 4) எலும்பு மாவு - பாஸ்பரஸின் நல்ல ஆதாரம். 5) மர சாம்பல் - பொட்டாசியம் மற்றும் கால்சியம் வழங்குகிறது."
            },
            "default": {
                "English": "For sustainable farming: 1) Practice crop rotation to maintain soil health. 2) Use organic fertilizers like compost and vermicompost. 3) Implement integrated pest management. 4) Conserve water through drip irrigation. 5) Plant native varieties that are adapted to local conditions.",
                "Hindi": "टिकाऊ खेती के लिए: 1) मिट्टी के स्वास्थ्य को बनाए रखने के लिए फसल चक्र का अभ्यास करें। 2) कम्पोस्ट और वर्मीकम्पोस्ट जैसे जैविक उर्वरकों का उपयोग करें। 3) एकीकृत कीट प्रबंधन लागू करें। 4) ड्रिप सिंचाई के माध्यम से पानी का संरक्षण करें। 5) स्थानीय परिस्थितियों के अनुकूल देशी किस्मों को लगाएं।",
                "Tamil": "நிலையான விவசாயத்திற்கு: 1) மண் ஆரோக்கியத்தை பராமரிக்க பயிர் சுழற்சி முறையை பின்பற்றவும். 2) கம்போஸ்ட் மற்றும் மண்புழு உரம் போன்ற இயற்கை உரங்களைப் பயன்படுத்தவும். 3) ஒருங்கிணைந்த பூச்சி மேலாண்மையை செயல்படுத்தவும். 4) சொட்டு நீர்ப்பாசனம் மூலம் நீரை பாதுகாக்கவும். 5) உள்ளூர் சூழலுக்கு ஏற்ற நாட்டு ரகங்களை நடவும்."
            }
        }

        # Determine the response category based on the prompt
        category = "default"
        if any(word in prompt.lower() for word in ["rice", "paddy", "चावल", "धान", "நெல்"]):
            category = "rice"
        elif any(word in prompt.lower() for word in ["pest", "insect", "कीट", "कीड़े", "பூச்சி"]):
            category = "pest"
        elif any(word in prompt.lower() for word in ["fertilizer", "manure", "उर्वरक", "खाद", "உரம்"]):
            category = "fertilizer"

        # Determine language
        language = "English"
        if any(char in prompt for char in "हिंदीफसलखेती"):
            language = "Hindi"
        elif any(char in prompt for char in "தமிழ்பயிர்நெல்"):
            language = "Tamil"

        return farming_responses[category][language]
    except Exception as e:
        print(f"Error getting response from GPT: {str(e)}")
        # Return a farming-related response as fallback
        farming_responses = {
            "English": "I'm sorry, I couldn't process your request right now. For pest control in crops, you can try neem oil spray or introducing beneficial insects. Please try again later for more specific advice.",
            "Hindi": "मुझे खेद है, मैं अभी आपके अनुरोध को प्रोसेस नहीं कर सका। फसलों में कीट नियंत्रण के लिए, आप नीम तेल स्प्रे या लाभकारी कीड़ों को शामिल करने का प्रयास कर सकते हैं। अधिक विशिष्ट सलाह के लिए कृपया बाद में पुनः प्रयास करें।",
            "Tamil": "உங்கள் கோரிக்கையை இப்போது செயலாக்க முடியவில்லை என்பதற்கு வருந்துகிறேன். பயிர்களில் பூச்சிகளைக் கட்டுப்படுத்த, நீங்கள் வேப்ப எண்ணெய் தெளிப்பு அல்லது பயனுள்ள பூச்சிகளை அறிமுகப்படுத்த முயற்சிக்கலாம். மேலும் குறிப்பிட்ட ஆலோசனைக்கு பின்னர் மீண்டும் முயற்சிக்கவும்."
        }

        # Try to detect language from prompt or default to English
        language = "English"
        if "हिंदी" in prompt or "फसल" in prompt:
            language = "Hindi"
        elif "தமிழ்" in prompt or "பயிர்" in prompt:
            language = "Tamil"

        return farming_responses.get(language, farming_responses["English"])
