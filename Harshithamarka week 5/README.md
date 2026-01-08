#Infosys Springboard Batch 2 Project

This project consists of a FastAPI backend and a React (Vite) frontend.

## Prerequisites

- Node.js (v20+ recommended)
- Python (v3.8+)
- PostgreSQL (Ensure it is running and a database is configured if required by `database.py`)

## Getting Started

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. (Optional) Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend API will be available at `http://127.0.0.1:8000`.

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173` (or the port shown in the terminal).

## Project Structure

- `backend/`: FastAPI application code.
- `frontend/`: React application code (Vite).
- `login-register/`: Source folder for login/register components (integrated into frontend).
