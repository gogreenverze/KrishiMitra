import { useState, useRef, useEffect, Fragment } from 'react';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MicrophoneIcon,
  StopIcon,
  ChevronDownIcon,
  GlobeAltIcon,
  WifiIcon,
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
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "loop", ease: "linear" }}
              className="text-2xl"
            >
              🌾
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-green-700 dark:text-green-400">KrishiMitra</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">AI Farming Assistant</p>
            </div>
          </div>
          
          {/* Online/Offline Indicator */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            
            {/* PWA Install Button */}
            {showInstallPrompt && (
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={async () => {
                  if (!deferredPrompt) return;
                  deferredPrompt.prompt();
                  const { outcome } = await deferredPrompt.userChoice;
                  setDeferredPrompt(null);
                  setShowInstallPrompt(false);
                }}
                className="flex items-center space-x-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1.5 rounded-full text-sm font-medium"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span>Install App</span>
              </motion.button>
            )}
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Hero Section */}
          <div className="relative bg-gradient-to-r from-green-600 to-green-700 dark:from-green-800 dark:to-green-900 p-6 sm:p-10">
            <div className="absolute inset-0 opacity-10">
              <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="url(#grid)" />
              </svg>
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
            </div>
            
            <div className="relative z-10 text-center">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-3xl sm:text-4xl font-bold text-white mb-4"
              >
                Your Multilingual Farming Assistant
              </motion.h2>
              <p className="text-green-100 max-w-2xl mx-auto">
                Ask questions in your language and get instant voice responses. KrishiMitra helps with farming advice, crop management, and agricultural best practices.
              </p>
            </div>
          </div>

          {/* Language selector */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <GlobeAltIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Select Your Language</h3>
              </div>
              
              <Menu as="div" className="relative inline-block text-left">
                <div>
                  <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">
                    {selectedLanguage}
                    <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
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
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-700 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1 max-h-60 overflow-y-auto">
                      {languages.map((lang) => (
                        <Menu.Item key={lang}>
                          {({ active }) => (
                            <button
                              onClick={() => setSelectedLanguage(lang)}
                              disabled={recording || processing || !isOnline}
                              className={`${active ? 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'} ${selectedLanguage === lang ? 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300' : ''} group flex w-full items-center px-4 py-2 text-sm`}
                            >
                              {selectedLanguage === lang && (
                                <CheckCircleIcon className="mr-3 h-5 w-5 text-green-500" aria-hidden="true" />
                              )}
                              {!selectedLanguage === lang && <div className="mr-3 w-5" />}
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
            
            <div className="flex flex-wrap gap-2 mt-4">
              {languages.map((lang) => (
                <motion.button
                  key={lang}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedLanguage(lang)}
                  disabled={recording || processing || !isOnline}
                  className={`py-2 px-4 text-sm font-medium rounded-full transition-all duration-200 ${selectedLanguage === lang
                    ? 'bg-green-600 dark:bg-green-700 text-white shadow-md'
                    : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                >
                  {lang}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Voice Interaction Section */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg mt-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Voice Assistant</h3>
              <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                Speak in {selectedLanguage} and get instant farming advice. Just tap the microphone button below.
              </p>
            </div>
            
            <div className="flex justify-center mb-8">
              <AnimatePresence mode="wait">
                {recording ? (
                  <motion.button
                    key="stop"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={stopRecording}
                    disabled={processing || !isOnline}
                    className="relative flex items-center justify-center h-24 w-24 rounded-full bg-red-600 dark:bg-red-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 rounded-full bg-red-600 dark:bg-red-700 animate-ping opacity-25"></div>
                    <StopIcon className="h-10 w-10" />
                  </motion.button>
                ) : (
                  <motion.button
                    key="start"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startRecording}
                    disabled={processing || !isOnline}
                    className="flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MicrophoneIcon className="h-10 w-10" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              {recording ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 dark:text-red-400 font-medium flex items-center justify-center space-x-2"
                >
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span>Recording... Speak now and tap the button when finished</span>
                </motion.div>
              ) : processing ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-blue-500 dark:text-blue-400 font-medium flex items-center justify-center space-x-2"
                >
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  <span>Processing your question...</span>
                </motion.div>
              ) : responseAudio ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-green-600 dark:text-green-400 font-medium flex items-center justify-center space-x-2"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>Response received and played!</span>
                </motion.div>
              ) : (
                <span>Tap the microphone to start speaking</span>
              )}
            </div>
          </div>

          {/* Offline notification */}
          {!isOnline && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-amber-50 dark:bg-amber-900 border border-amber-200 dark:border-amber-700 rounded-xl shadow-md mt-6 mx-6"
            >
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-amber-800 dark:text-amber-300">You're offline</h3>
                  <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">
                    You can view your conversation history, but new recordings require an internet connection.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Hidden audio element for playback */}
          <audio ref={audioRef} className="hidden" controls />
          
          {/* Chat History Section */}
          {chatHistory.length > 0 && (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg mt-6 mx-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                  <span className="mr-2">Conversation History</span>
                  <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {chatHistory.length}
                  </span>
                </h3>
                
                {chatHistory.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to clear all conversation history?')) {
                        setChatHistory([]);
                      }
                    }}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Clear All
                  </button>
                )}
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence>
                  {chatHistory.map((chat) => (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {new Date(chat.timestamp).toLocaleString()}
                          </span>
                          <span className="ml-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium px-2 py-0.5 rounded-full">
                            {chat.language}
                          </span>
                        </div>
                        <button 
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this conversation?')) {
                              setChatHistory(prevHistory => 
                                prevHistory.filter(item => item.id !== chat.id)
                              );
                            }
                          }}
                          className="text-xs text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 mb-2">
                            <div className="bg-green-100 dark:bg-green-900 p-1 rounded-full mr-2">
                              <MicrophoneIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="font-medium">Your Question</span>
                          </div>
                          <audio src={chat.questionAudio} controls className="w-full h-8" />
                        </div>
                        
                        <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
                          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 mb-2">
                            <div className="bg-blue-100 dark:bg-blue-900 p-1 rounded-full mr-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                              </svg>
                            </div>
                            <span className="font-medium">AI Response</span>
                          </div>
                          <audio src={chat.responseAudio} controls className="w-full h-8" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <footer className="bg-white dark:bg-gray-800 shadow-md mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 text-sm mb-4 md:mb-0">
              <span>KrishiMitra</span>
              <span>•</span>
              <span>Powered by AI for Indian Farmers</span>
            </div>
            
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
