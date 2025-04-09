import { useState, useRef, useEffect } from 'react';

// Define language codes for TTS mapping
const LANGUAGE_CODES = {
  'English': 'en',
  'Hindi': 'hi',
  'Tamil': 'ta',
  'Telugu': 'te',
  'Kannada': 'kn',
  'Malayalam': 'ml',
  'Bengali': 'bn',
  'Marathi': 'mr',
  'Gujarati': 'gu',
  'Punjabi': 'pa',
  'Urdu': 'ur'
};

function App() {
  const [transcript, setTranscript] = useState('');
  const [responseAudio, setResponseAudio] = useState(null);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    // Get language from localStorage or default to 'English'
    return localStorage.getItem('krishimitraLanguage') || 'English';
  });
  const [error, setError] = useState('');
  const [chatHistory, setChatHistory] = useState(() => {
    // Get chat history from localStorage or default to empty array
    const savedHistory = localStorage.getItem('krishimitraChatHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const audioRef = useRef(null);

  // PWA installation prompt
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install button
      setShowInstallPrompt(true);
    });

    window.addEventListener('appinstalled', () => {
      // Hide the install button
      setShowInstallPrompt(false);
      // Clear the deferredPrompt
      setDeferredPrompt(null);
      // Log the installation to analytics
      console.log('PWA was installed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', () => {});
      window.removeEventListener('appinstalled', () => {});
    };
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const languages = [
    'English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam',
    'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'Urdu'
  ];

  // Save language preference when it changes
  useEffect(() => {
    localStorage.setItem('krishimitraLanguage', selectedLanguage);
  }, [selectedLanguage]);

  // Save chat history when it changes
  useEffect(() => {
    localStorage.setItem('krishimitraChatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunks.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        setProcessing(true);
        try {
          // Create a timestamp for this conversation
          const timestamp = new Date().toISOString();
          const questionBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          const questionURL = URL.createObjectURL(questionBlob);

          // Create a FormData object for the API request
          const formData = new FormData();
          formData.append('audio', questionBlob, 'voice.webm');

          // Send to backend
          const response = await fetch(`http://localhost:8000/voice-ask/?language=${selectedLanguage}`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
          }

          // Get the response audio
          const responseBlob = await response.blob();
          const responseURL = URL.createObjectURL(responseBlob);
          setResponseAudio(responseURL);

          // Auto-play the response
          if (audioRef.current) {
            audioRef.current.src = responseURL;
            audioRef.current.play();
          }

          // Add to chat history
          const newChatEntry = {
            id: Date.now().toString(),
            timestamp,
            language: selectedLanguage,
            questionAudio: questionURL,
            responseAudio: responseURL,
          };

          setChatHistory(prevHistory => [newChatEntry, ...prevHistory]);
        } catch (err) {
          console.error('Error processing audio:', err);
          setError(`Error: ${err.message}`);
        } finally {
          setProcessing(false);
        }
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError(`Microphone access error: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);

      // Stop all tracks on the stream
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-4">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-green-600 p-4 text-white text-center relative">
          <h1 className="text-2xl font-bold">🌾 KrishiMitra Voice Assistant</h1>
          <p className="text-sm mt-1">Your multilingual farming companion</p>

          {/* PWA Install Button */}
          {showInstallPrompt && (
            <button
              onClick={async () => {
                if (!deferredPrompt) {
                  return;
                }
                // Show the install prompt
                deferredPrompt.prompt();
                // Wait for the user to respond to the prompt
                const { outcome } = await deferredPrompt.userChoice;
                // We've used the prompt, and can't use it again, throw it away
                setDeferredPrompt(null);
                // Hide the install button
                setShowInstallPrompt(false);
                console.log(`User ${outcome} the installation`);
              }}
              className="absolute top-2 right-2 bg-white text-green-700 text-xs font-medium px-2 py-1 rounded-full flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Install App
            </button>
          )}
        </div>

        <div className="p-6">
          {/* Language selector */}
          <div className="mb-6">
            <label htmlFor="language" className="block text-base font-medium text-gray-700 mb-2">
              Select Your Language:
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
              {languages.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSelectedLanguage(lang)}
                  disabled={recording || processing || !isOnline}
                  className={`py-2 px-3 text-sm font-medium rounded-lg transition-colors ${selectedLanguage === lang
                    ? 'bg-green-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  {lang}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center">
              <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
              <p className="text-sm text-gray-600">Currently using: <span className="font-medium">{selectedLanguage}</span></p>
            </div>
          </div>

          {/* Recording button */}
          <div className="flex justify-center my-8">
            {recording ? (
              <button
                onClick={stopRecording}
                className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-red-500 to-red-600 group-hover:from-red-500 group-hover:to-red-600 hover:text-white focus:ring-4 focus:outline-none focus:ring-red-300"
                disabled={processing || !isOnline}
              >
                <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-opacity-0">
                  🛑 Stop Recording
                </span>
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-green-500 to-green-600 group-hover:from-green-500 group-hover:to-green-600 hover:text-white focus:ring-4 focus:outline-none focus:ring-green-300"
                disabled={processing || !isOnline}
              >
                <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-opacity-0">
                  🎤 Start Speaking
                </span>
              </button>
            )}
          </div>

          {/* Offline notification */}
          {!isOnline && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
              <p className="text-amber-800 text-sm">
                <span className="font-medium">You're offline.</span> You can view your chat history, but new recordings require an internet connection.
              </p>
            </div>
          )}

          {/* Status indicators */}
          <div className="text-center">
            {recording && (
              <div className="text-red-500 animate-pulse font-medium">
                🎙️ Recording... Speak now and click stop when finished
              </div>
            )}
            {processing && (
              <div className="text-blue-500 font-medium">
                ⏳ Processing your question...
              </div>
            )}
            {error && (
              <div className="text-red-600 font-medium mt-2">
                ❌ {error}
              </div>
            )}
            {responseAudio && !recording && !processing && (
              <div className="text-green-600 font-medium mt-2">
                ✅ Response received and played!
              </div>
            )}
          </div>

          {/* Hidden audio element for playback */}
          <audio ref={audioRef} className="hidden" controls />

          {/* Chat History Section */}
          {chatHistory.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Conversation History</h2>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {chatHistory.map((chat) => (
                  <div key={chat.id} className="bg-gray-50 rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-500">
                        {new Date(chat.timestamp).toLocaleString()} • {chat.language}
                      </span>
                      <button
                        onClick={() => {
                          // Clear chat history
                          if (confirm('Are you sure you want to delete this conversation?')) {
                            setChatHistory(prevHistory =>
                              prevHistory.filter(item => item.id !== chat.id)
                            );
                          }
                        }}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center">
                        <span className="text-green-600 mr-2">🎤 Your Question:</span>
                        <audio src={chat.questionAudio} controls className="w-full h-8" />
                      </div>
                      <div className="flex items-center">
                        <span className="text-blue-600 mr-2">🔊 AI Response:</span>
                        <audio src={chat.responseAudio} controls className="w-full h-8" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {chatHistory.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all conversation history?')) {
                      setChatHistory([]);
                    }
                  }}
                  className="mt-4 text-sm text-red-600 hover:text-red-800"
                >
                  Clear All History
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-4 py-3 flex justify-between items-center text-xs text-gray-500">
          <span>KrishiMitra - Powered by AI for Indian Farmers</span>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-1 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{isOnline ? 'Online' : 'Offline'}</span>
            {!isOnline && (
              <span className="ml-1 text-xs text-amber-600">(Chat history available)</span>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
