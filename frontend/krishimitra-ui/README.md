# KrishiMitra Voice Assistant UI

A Progressive Web App (PWA) for the KrishiMitra multilingual AI assistant for Indian farmers.

## Features

- Voice input using device microphone
- Automatic playback of voice responses
- Support for multiple Indian languages
- Progressive Web App capabilities for offline access
- Responsive design for mobile and desktop

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Run the development server:
   ```
   npm run dev
   ```

3. Build for production:
   ```
   npm run build
   ```

## Usage

1. Select your preferred language from the dropdown
2. Click "Start Speaking" and ask your farming question
3. Click "Stop Recording" when you're done speaking
4. Wait for the AI to process your question and listen to the response

## Technologies Used

- React
- Vite
- Tailwind CSS
- PWA (Progressive Web App)
- Web Audio API

## Backend Integration

This UI connects to the KrishiMitra backend API at `http://localhost:8000`. Make sure the backend server is running before using this application.
