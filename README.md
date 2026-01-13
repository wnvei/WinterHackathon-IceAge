 # Project name - SJECLearn

## Description
This project is a syllabus-governed exam preparation platform designed for SJEC college students. It helps students study only what is relevant by enforcing syllabus rules, identifying repeated questions and important topics using past exam data. The platform removes the need for students to rely on multiple AI tools or chatbots to verify syllabus relevance, importance, or answer correctness.

# Demo Video Link: <https://drive.google.com/file/d/1vB6Bqn-0kA1kaJU66AN7qoR0dlH2Qcqd/view?usp=drive_link>

## Features
- Automatically rejects out-of-syllabus questions
- Identifies frequently asked questions and important topics
- Generates answers strictly from approved academic notes

## Tech Stack
- React.js
- FastAPI
- Google Gemini API
- Python

## Google Technologies Used :
- **Google Gemini API** – To validate the questions against the syllabus topics and generate answers strictly from the notes

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- npm or pnpm package manager
- Git

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend/my-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. Build for production:
   ```bash
   npm run build
   # or
   pnpm build
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install fastapi uvicorn python-multipart
   ```

4. Set up environment variables:
   - Create a `.env` file in the backend directory
   - Add your Google Gemini API key:
     ```
     GOOGLE_API_KEY=your_api_key_here
     VITE_GEMINI_API_KEY=your_api_key_here
     ```

5. Run the backend server:
   ```bash
   uvicorn main:app --reload
   ```
   The API will be available at `http://localhost:8000`

### Running the Full Application
1. Ensure both frontend and backend servers are running
2. Frontend will be available at `http://localhost:5173` (or as shown in terminal)
3. Backend API will be available at `http://localhost:8000`
4. API documentation available at `http://localhost:8000/docs`

## Team Members
- Zaina - Frontend & Backend
- Snehal - Backend & Data Collection
- Mariam - UI/UX & Frontend
- Whetvin - Scripts & Backend 
