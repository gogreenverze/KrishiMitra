import { useState, useRef, useEffect } from 'react';

function App() {
  const [transcript, setTranscript] = useState('');
  const [responseAudio, setResponseAudio] = useState(null);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const audioRef = useRef(null);

  const languages = [
    'English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam',
    'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'Urdu'
  ];

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
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('audio', audioBlob, 'voice.webm');

          // Send to backend
          const response = await fetch(`http://localhost:8000/voice-ask/?language=${selectedLanguage}`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
          }

          const blob = await response.blob();
          const audioURL = URL.createObjectURL(blob);
          setResponseAudio(audioURL);

          // Auto-play the response
          if (audioRef.current) {
            audioRef.current.src = audioURL;
            audioRef.current.play();
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
    <main className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-4">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-green-600 p-4 text-white text-center">
          <h1 className="text-2xl font-bold">🌾 KrishiMitra Voice Assistant</h1>
          <p className="text-sm mt-1">Your multilingual farming companion</p>
        </div>

        <div className="p-6">
          {/* Language selector */}
          <div className="mb-4">
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
              Select Language:
            </label>
            <select
              id="language"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              disabled={recording || processing}
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          {/* Recording button */}
          <div className="flex justify-center my-8">
            {recording ? (
              <button
                onClick={stopRecording}
                className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-red-500 to-red-600 group-hover:from-red-500 group-hover:to-red-600 hover:text-white focus:ring-4 focus:outline-none focus:ring-red-300"
                disabled={processing}
              >
                <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-opacity-0">
                  🛑 Stop Recording
                </span>
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-green-500 to-green-600 group-hover:from-green-500 group-hover:to-green-600 hover:text-white focus:ring-4 focus:outline-none focus:ring-green-300"
                disabled={processing}
              >
                <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-opacity-0">
                  🎤 Start Speaking
                </span>
              </button>
            )}
          </div>

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
        </div>

        <div className="bg-gray-50 px-4 py-3 text-center text-xs text-gray-500">
          KrishiMitra - Powered by AI for Indian Farmers
        </div>
      </div>
    </main>
  );
}

export default App;
