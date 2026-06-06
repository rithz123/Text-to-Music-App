#
Text-to-Music Generation App
A full-stack AI application that converts descriptive text prompts into audio tracks using a React.js frontend and Python backend powered by the MusicGen model.
Tech Stack

Frontend: React.js, JavaScript, HTML, CSS, Vite
Backend: Python, FastAPI, Google Colab, Ngrok
AI Model: MusicGen by Meta (via AudioCraft)

Features

Text prompt to audio generation
Real-time API communication between React frontend and FastAPI backend
Seamless audio playback in the browser
Clean, responsive user interface

How it works

User enters a text description on the React frontend
Frontend sends a POST request to the FastAPI backend
Backend passes the prompt to the MusicGen AI model
Generated audio is returned and played in the browser
