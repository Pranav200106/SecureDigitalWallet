# Secure Digital Wallet

This project implements a secure digital wallet application with document scanning, face authentication, and QR verification features. It leverages a Flask backend for OCR processing using GPT-4o Vision and a React frontend for the user interface.

## Features

*   **Document Scanning**: Scan government ID documents (Aadhaar, PAN, Driving License, Voter ID) using a camera or file upload.
*   **OCR Extraction**: Extract structured data from scanned documents using an optimized GPT-4o Vision API.
*   **Face Authentication**: Verify user identity by comparing a live face scan with the face extracted from the scanned ID document.
*   **QR Verification**: Generate and verify QR codes containing selected document attributes for secure sharing and verification.
*   **Admin Dashboard**: (If implemented) Manage users and documents.
*   **User Dashboard**: View and manage personal documents.
*   **Dark Mode**: Toggle between light and dark themes.

## Technologies Used

**Frontend:**
*   React
*   Vite
*   Material-UI (MUI)
*   Face-api.js (for face detection and recognition models)
*   Firebase (for authentication and potentially database)
*   QRCode.js (for QR code generation)

**Backend:**
*   Flask (Python web framework)
*   Flask-CORS
*   OpenAI GPT-4o Vision API (for advanced OCR)
*   OpenCV (for image preprocessing)
*   python-dotenv

## Setup Instructions

### Prerequisites

*   Node.js (LTS version recommended)
*   Python 3.8+
*   npm or Yarn
*   An OpenAI API Key

### 1. Clone the Repository

```bash
git clone https://github.com/Pranav200106/SecureDigitalWallet.git
cd SecureDigitalWallet
```

### 2. Backend Setup

Navigate to the `backend` directory, create a virtual environment, install dependencies, and set up environment variables.

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory and add your OpenAI API key:

```
OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
```

Run the Flask backend:

```bash
python app.py
```
The backend will run on `http://localhost:5000`.

### 3. Frontend Setup

Navigate to the `frontend` directory, install dependencies, and start the development server.

```bash
cd ../frontend
npm install # or yarn install
npm run dev # or yarn dev
```
The frontend will run on `http://localhost:5173`.

## API Endpoints (Backend)

*   `GET /`: API information (not used by frontend)
*   `GET /health`: Health check for API status.
*   `POST /extract-upload`: Upload an image file and extract document data.
*   `POST /extract-by-path`: Extract document data from an image specified by a server-side file path.

## Usage

1.  **Start Backend and Frontend**: Follow the setup instructions to get both services running.
2.  **Access Frontend**: Open your browser to `http://localhost:5173`.
3.  **Authentication**: Register or log in to access protected features.
4.  **Document Scanning**: Navigate to the document scanner to upload or capture an ID.
5.  **Face Authentication**: Proceed to face authentication to verify your identity.
6.  **Dashboard**: View your extracted document data.
7.  **QR Verification**: Generate QR codes for your document data or verify existing QR codes.

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## License

This project is licensed under the [MIT License](LICENSE).
