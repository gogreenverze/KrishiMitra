import { useState, useRef, useEffect, Fragment } from 'react';
import { Dialog, Transition, Menu } from '@headlessui/react';
import {
  MicrophoneIcon,
  StopIcon,
  ChevronDownIcon,
  GlobeAltIcon,
  XMarkIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/solid';

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

  const startRecording = async () => {
    try {
      setError('');
      console.log('Requesting microphone access...');
      
      // Request microphone access with explicit error handling
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false
      }).catch(err => {
        console.error('Microphone access error:', err.name, err.message);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          throw new Error('Microphone access denied. Please allow microphone access in your browser settings.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          throw new Error('No microphone found. Please connect a microphone and try again.');
        } else {
          throw err;
        }
      });
      
      console.log('Microphone access granted, creating MediaRecorder...');
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
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
          console.log(`Sending audio to backend with language: ${selectedLanguage}`);
          let responseBlob, responseURL;
          
          try {
            const response = await fetch(`http://localhost:8000/voice-ask/?language=${selectedLanguage}`, {
              method: 'POST',
              body: formData,
              // Add explicit headers for CORS
              headers: {
                'Accept': 'audio/mpeg, audio/mp3, audio/*'
              }
            });

            if (!response.ok) {
              console.error(`Server error: ${response.status} ${response.statusText}`);
              throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }
            
            console.log('Response received successfully');
            
            // Get the response audio
            responseBlob = await response.blob();
            responseURL = URL.createObjectURL(responseBlob);
            setResponseAudio(responseURL);
            
            // Auto-play the response
            if (audioRef.current) {
              console.log('Playing audio response...');
              audioRef.current.src = responseURL;
              audioRef.current.play().catch(playError => {
                console.error('Audio playback error:', playError);
                setError(`Audio playback error: ${playError.message}. Try clicking the audio player manually.`);
              });
            }
          } catch (fetchError) {
            console.error('Fetch error:', fetchError);
            throw new Error(`Network error: ${fetchError.message}. Please check your connection and try again.`);
          }
          
          // Add to chat history only if we have a response
          if (responseURL) {
            const newChatEntry = {
              id: Date.now().toString(),
              timestamp,
              language: selectedLanguage,
              questionAudio: questionURL,
              responseAudio: responseURL,
            };
            
            console.log('Adding to chat history:', newChatEntry);
            setChatHistory(prevHistory => [newChatEntry, ...prevHistory]);
          }
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header - Clean, Professional Design */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="text-green-600 dark:text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M19.5 22c.828 0 1.5-.672 1.5-1.5V11.122c0-.223-.05-.443-.146-.646l-3.304-6.986C17.266 2.808 16.52 2 15.5 2h-7c-1.02 0-1.766.808-2.05 1.49l-3.304 6.986A1.496 1.496 0 003 11.122V20.5c0 .828.672 1.5 1.5 1.5h15zM12 4.25c1.335 0 2.25 1.057 2.25 2.25 0 1.335-.915 2.25-2.25 2.25S9.75 7.835 9.75 6.5c0-1.193.915-2.25 2.25-2.25zm-4.5 9.5c0-1.193.915-2.25 2.25-2.25h4.5c1.335 0 2.25 1.057 2.25 2.25v.25h-9v-.25z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-800 dark:text-gray-200">KrishiMitra</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">AI Farming Assistant</p>
            </div>
          </div>
          
          {/* Online/Offline Indicator and Install Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-600 dark:text-gray-300">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            
            {/* PWA Install Button */}
            {showInstallPrompt && (
              <button
                onClick={async () => {
                  if (!deferredPrompt) return;
                  deferredPrompt.prompt();
                  const { outcome } = await deferredPrompt.userChoice;
                  setDeferredPrompt(null);
                  setShowInstallPrompt(false);
                }}
                className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
              >
                <ArrowDownTrayIcon className="h-3 w-3" />
                <span>Install</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Farming Voice Assistant</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Ask questions about farming in your language and get instant voice responses.
          </p>
        </div>

        {/* Language selector - Clean Design */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GlobeAltIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <h3 className="text-sm font-medium text-gray-800 dark:text-white">Language</h3>
            </div>
            
            <Menu as="div" className="relative inline-block text-left z-20">
              <div>
                <Menu.Button className="inline-flex items-center justify-center gap-1.5 rounded-md bg-gray-50 dark:bg-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  {selectedLanguage}
                  <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                </Menu.Button>
              </div>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-30 mt-1 w-48 origin-top-right rounded-md bg-white dark:bg-gray-700 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1 max-h-60 overflow-y-auto">
                    {languages.map((lang) => (
                      <Menu.Item key={lang}>
                        {({ active }) => (
                          <button
                            onClick={() => setSelectedLanguage(lang)}
                            disabled={recording || processing || !isOnline}
                            className={`${active ? 'bg-gray-50 dark:bg-gray-600' : ''} ${selectedLanguage === lang ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-700 dark:text-gray-200'} flex w-full items-center px-3 py-2 text-xs`}
                          >
                            {selectedLanguage === lang && (
                              <CheckCircleIcon className="mr-2 h-3.5 w-3.5 text-green-500" aria-hidden="true" />
                            )}
                            {selectedLanguage !== lang && <div className="mr-2 w-3.5" />}
                            {lang}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
          
          <div className="p-4">
            <div className="flex flex-wrap gap-1.5">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  disabled={recording || processing || !isOnline}
                  className={`py-1 px-2.5 text-xs font-medium rounded-md transition-colors ${selectedLanguage === lang
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Voice Interaction Section - Clean Design */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-800 dark:text-white">Voice Input</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Speak in {selectedLanguage} to get farming advice
            </p>
          </div>
          
          <div className="p-6 flex flex-col items-center">
            <div className="mb-4">
              {recording ? (
                <button
                  onClick={stopRecording}
                  disabled={processing || !isOnline}
                  className="relative flex items-center justify-center h-14 w-14 rounded-full bg-red-500 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Stop recording"
                >
                  <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"></div>
                  <StopIcon className="h-6 w-6" />
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  disabled={processing || !isOnline}
                  className="flex items-center justify-center h-14 w-14 rounded-full bg-green-600 text-white shadow-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Start recording"
                >
                  <MicrophoneIcon className="h-6 w-6" />
                </button>
              )}
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center h-5">
              {recording ? (
                <div className="text-red-500 dark:text-red-400 font-medium flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                  <span>Recording... Tap when finished</span>
                </div>
              ) : processing ? (
                <div className="text-blue-500 dark:text-blue-400 font-medium flex items-center gap-1.5">
                  <ArrowPathIcon className="h-3 w-3 animate-spin" />
                  <span>Processing your question...</span>
                </div>
              ) : responseAudio ? (
                <div className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1.5">
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  <span>Response received and played</span>
                </div>
              ) : (
                <span>Tap the microphone to start speaking</span>
              )}
            </div>
          </div>
        </div>

        {/* Offline notification */}
        {!isOnline && (
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/30 rounded-lg p-3 mb-6">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-4 w-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-medium text-amber-800 dark:text-amber-300">You're offline</h3>
                <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">
                  You can view your conversation history, but new recordings require an internet connection.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Hidden audio element for playback */}
        <audio ref={audioRef} className="hidden" controls />
        
        {/* Chat History Section */}
        {chatHistory.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-800 dark:text-white">Conversation History</h3>
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-1.5 py-0.5 rounded">
                  {chatHistory.length}
                </span>
              </div>
              
              <button
                onClick={() => {
                  if (confirm('Clear all conversation history?')) {
                    setChatHistory([]);
                  }
                }}
                className="text-xs text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 flex items-center gap-1"
              >
                <TrashIcon className="h-3 w-3" />
                <span>Clear</span>
              </button>
            </div>
            
            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-80 overflow-y-auto custom-scrollbar">
              {chatHistory.map((chat) => (
                <div key={chat.id} className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(chat.timestamp).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                      </span>
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-1.5 py-0.5 rounded">
                        {chat.language}
                      </span>
                    </div>
                    <button 
                      onClick={() => {
                        setChatHistory(prevHistory => 
                          prevHistory.filter(item => item.id !== chat.id)
                        );
                      }}
                      className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                      aria-label="Delete conversation"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center text-xs text-gray-700 dark:text-gray-300 mb-1.5">
                        <MicrophoneIcon className="h-3 w-3 text-gray-500 mr-1.5" />
                        <span className="font-medium">Your Question</span>
                      </div>
                      <audio src={chat.questionAudio} controls className="w-full h-7" controlsList="nodownload" />
                    </div>
                    
                    <div>
                      <div className="flex items-center text-xs text-gray-700 dark:text-gray-300 mb-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        <span className="font-medium">AI Response</span>
                      </div>
                      <audio src={chat.responseAudio} controls className="w-full h-7" controlsList="nodownload" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto py-4">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              KrishiMitra • AI for Indian Farmers
            </div>
            
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
