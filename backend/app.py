from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from logging.config import dictConfig
import cv2
import numpy as np
import json
import os
import base64
from typing import Dict, Optional
from dotenv import load_dotenv
import openai
import traceback
from datetime import datetime

# Load environment variables
load_dotenv()

# Configure logging BEFORE creating Flask app
dictConfig({
    'version': 1,
    'formatters': {
        'default': {
            'format': '[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
        'detailed': {
            'format': '[%(asctime)s] %(levelname)s [%(name)s.%(funcName)s:%(lineno)d] %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        }
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'stream': 'ext://sys.stdout',
            'formatter': 'default',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': 'ocr_api.log',
            'formatter': 'detailed',
        }
    },
    'root': {
        'level': 'WARNING',
        'handlers': ['console', 'file']
    }
})

# Initialize Flask app
app = Flask(__name__)


# Enable CORS for React frontend
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "https://localhost:5173"]}})
# Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'bmp', 'tiff', 'webp'}
app.config['JSON_SORT_KEYS'] = False  


class EnhancedPreprocessor:
    """Advanced preprocessing for better image quality"""
    
    @staticmethod
    def enhance_image(image_path: str, save_debug: bool = False) -> str:
        try:
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Cannot read image: {image_path}")
            
            # Get original dimensions
            height, width = image.shape[:2]
            
            # Upscale if image is small (improves OCR accuracy)
            if height < 1000 or width < 1000:
                scale = max(1500 / height, 1500 / width)
                new_width = int(width * scale)
                new_height = int(height * scale)
                image = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
                app.logger.info(f"Upscaled image from {width}x{height} to {new_width}x{new_height}")
            
            # Denoise while preserving details
            denoised = cv2.fastNlMeansDenoisingColored(image, None, h=6, hColor=6, 
                                                        templateWindowSize=7, searchWindowSize=21)
            
            # Enhance contrast using CLAHE on LAB color space
            lab = cv2.cvtColor(denoised, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
            l = clahe.apply(l)
            enhanced_lab = cv2.merge([l, a, b])
            enhanced = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
            
            # Slight sharpening
            kernel = np.array([[0, -0.5, 0], 
                              [-0.5, 3, -0.5], 
                              [0, -0.5, 0]])
            sharpened = cv2.filter2D(enhanced, -1, kernel)
            
            # Save enhanced image
            enhanced_path = image_path.replace('.', '_enhanced.')
            cv2.imwrite(enhanced_path, sharpened, [cv2.IMWRITE_JPEG_QUALITY, 95])
            
            if save_debug:
                app.logger.info(f"Enhanced image saved: {enhanced_path}")
            
            return enhanced_path
            
        except Exception as e:
            app.logger.error(f"Preprocessing error: {str(e)}")
            return image_path  


class GPTVisionExtractor:    
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("OpenAI API key is required")
        
        self.client = openai.OpenAI(api_key=api_key)
        app.logger.info("✅ GPT-4o Vision initialized")
    
    def encode_image_base64(self, image_path: str) -> str:
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    
    def extract_from_image(self, image_path: str, enhance: bool = True) -> Dict:
        try:
            start_time = datetime.now()
            
            if enhance:
                preprocessor = EnhancedPreprocessor()
                processed_path = preprocessor.enhance_image(image_path)
            else:
                processed_path = image_path
            
            # Encode image
            base64_image = self.encode_image_base64(processed_path)
            
            # Enhanced prompt with explicit field instructions
            prompt = """You are an expert AI trained to extract information from Indian government identity documents with 100% accuracy.

**TASK**: Analyze this ID card image and extract ALL visible information into a structured JSON format.

**DOCUMENT TYPES TO IDENTIFY**:
- Aadhaar Card: Contains "Government of India", "Unique Identification Authority", 12-digit number
- PAN Card: Contains "Permanent Account Number", "Income Tax Department", 10-character alphanumeric
- Driving License: Contains "Driving Licence", "Transport", state codes like TN, DL, etc.
- Voter ID: Contains "Election Commission"

**EXTRACTION RULES** (READ CAREFULLY):

1. **name**: Extract ONLY the person's actual name
   - EXCLUDE: "Government of India", "Permanent Account Number", "Indian Union", "Driving Licence", headers
   - Look for: The person's actual name (usually 2-4 words, appears prominently)
   - Examples: "Kuhan M", "Rajesh Kumar Singh", "Priya Sharma"

2. **father_name**: Look for prefixes like "S/O" (Son of), "D/O" (Daughter of), "C/O" (Care of), "W/O" (Wife of)
   - Often appears in address section or as separate field

3. **gender**: CRITICAL - Look very carefully for:
   - Explicit text: "MALE", "FEMALE", "M", "F", "Male", "Female"
   - May appear near DOB, photo, or in small text
   - In Aadhaar: Often appears as "MALE"/"FEMALE" below photo
   - In DL: May be abbreviated as "M" or "F"
   - Check ENTIRE image including small text and watermarks

4. **dob**: Date of Birth
   - Look for labels: "DOB:", "Date of Birth:", "Birth:", "D.O.B"
   - Formats: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
   - Convert ALL dates to DD/MM/YYYY format

5. **aadhar_number**: 12-digit Aadhaar number
   - Format: XXXX XXXX XXXX (with spaces) or 12 consecutive digits
   - Does NOT start with 0, 1, or 9
   - IGNORE VID (Virtual ID) which starts with 9

6. **pan_number**: 10-character PAN
   - Format: AAAAA9999A (5 letters + 4 numbers + 1 letter)
   - Example: ABCDE1234F

7. **dl_number**: Driving License number
   - State code + alphanumeric (e.g., TN67W20230001817, DL01234567890)

8. **address**: Full residential address
   - Include: Street, area, city, state, PIN code
   - Usually longest text block

9. **blood_group**: Blood type (common in DL)
   - Look for: A+, A-, B+, B-, O+, O-, AB+, AB-

10. **issue_date**: Document issue/issued date
    - Labels: "Issue Date:", "Issued:", "Date of Issue"

11. **validity** or **expiry_date**: Validity period
    - Labels: "Valid Till:", "Validity:", "Valid Upto"
    - Common in DL and some other IDs

12. **pin_code**: 6-digit postal code

13. **state**: State name

**IMPORTANT INSTRUCTIONS**:
- Read EVERY piece of text in the image, including small print, watermarks, and corners
- Gender and DOB are often missed - look extra carefully for these
- If a field is truly not visible, use null (not empty string)
- Double-check all numbers for accuracy
- Preserve original formatting for dates

**OUTPUT FORMAT**: Return ONLY a valid JSON object with these exact keys:
{
"document_type": "aadhar|pan|driving_license|voter_id|unknown",
"name": "string or null",
"father_name": "string or null",
"dob": "DD/MM/YYYY or null",
"gender": "Male|Female or null",
"aadhar_number": "XXXX XXXX XXXX or null",
"pan_number": "AAAAAXXXXAA or null",
"dl_number": "string or null",
"address": "string or null",
"blood_group": "string or null",
"issue_date": "DD/MM/YYYY or null",
"validity": "DD/MM/YYYY or null",
"pin_code": "6-digit or null",
"state": "string or null"
}

Analyze the image NOW and extract ALL information with maximum accuracy."""

            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}",
                                    "detail": "high" 
                                }
                            }
                        ]
                    }
                ],
                temperature=0,  
                max_tokens=1500,
                response_format={"type": "json_object"}
            )
            
            # Parse response
            result_text = response.choices[0].message.content
            extracted_data = json.loads(result_text)
            
            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds()
            
            # Clean up enhanced image if created
            if enhance and processed_path != image_path:
                try:
                    os.remove(processed_path)
                except:
                    pass
            
            app.logger.info(f"✅ Extraction successful in {processing_time:.2f}s - Type: {extracted_data.get('document_type')}")
            
            return {
                'status': 'success',
                'method': 'gpt4o_vision_direct',
                'processing_time_seconds': round(processing_time, 2),
                'extracted_data': extracted_data,
                'model_used': 'gpt-4o',
                'detail_level': 'high'
            }
            
        except json.JSONDecodeError as e:
            app.logger.error(f"JSON parsing error: {str(e)}")
            return {
                'status': 'error',
                'error_type': 'json_parse_error',
                'error_message': 'Failed to parse model response as JSON',
                'extracted_data': {}
            }
        except Exception as e:
            app.logger.error(f"Extraction error: {str(e)}\n{traceback.format_exc()}")
            return {
                'status': 'error',
                'error_type': 'extraction_error',
                'error_message': str(e),
                'extracted_data': {}
            }


# Initialize the extraction system
try:
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY not found in environment variables")
    
    extractor = GPTVisionExtractor(api_key=api_key)
    app.logger.info("✅ System initialization complete")
except Exception as e:
    app.logger.error(f"❌ Initialization failed: {str(e)}")
    extractor = None


def allowed_file(filename: str) -> bool:
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']


def create_error_response(message: str, error_type: str = 'error', status_code: int = 500, details: Optional[Dict] = None) -> tuple:
    response = {
        'status': 'error',
        'error_type': error_type,
        'error_message': message,
        'timestamp': datetime.now().isoformat()
    }
    if details:
        response.update(details)
    
    app.logger.error(f"{error_type}: {message}")
    return jsonify(response), status_code


# ==================== FLASK ENDPOINTS ====================

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "service": "Government ID OCR API",
        "version": "2.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "extract_upload": "/extract-upload (POST)",
            "extract_by_path": "/extract-by-path (POST)",
            "extract_predefined": "/extract-predefined (GET)",
            "batch_extract": "/batch-extract (POST)"
        },
        "documentation": "Send POST requests to /extract-upload with image file"
    }), 200


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Government ID OCR API',
        'version': '2.0',
        'extractor_ready': extractor is not None,
        'model': 'gpt-4o-vision',
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/extract-upload', methods=['POST'])
def extract_upload():
    """
    Extract data from uploaded image file
    
    Form Data:
        - file: Image file (required)
        - enhance: bool (optional, default: true)
    
    Returns:
        JSON with extracted document data
    """
    try:
        if extractor is None:
            return create_error_response(
                'Extraction system not initialized. Check OpenAI API key.',
                'initialization_error',
                500
            )
        
        # Validate file presence
        if 'file' not in request.files:
            return create_error_response(
                'No file provided in request',
                'missing_file',
                400
            )
        
        file = request.files['file']
        
        # Validate filename
        if file.filename == '' or file.filename is None:
            return create_error_response(
                'Empty filename',
                'invalid_filename',
                400
            )
        
        # Validate file extension
        if not allowed_file(file.filename):
            return create_error_response(
                f'File type not allowed. Allowed: {", ".join(app.config["ALLOWED_EXTENSIONS"])}',
                'invalid_file_type',
                400,
                {'filename': file.filename}
            )
        
        # Get enhancement preference
        enhance = request.form.get('enhance', 'true').lower() == 'true'
        
        # Save uploaded file securely
        filename = secure_filename(file.filename)
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        upload_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(upload_path)
        
        app.logger.info(f"Processing uploaded file: {filename}")
        
        # Process document
        result = extractor.extract_from_image(upload_path, enhance=enhance)
        
        # Add metadata
        result['uploaded_filename'] = filename
        result['timestamp'] = datetime.now().isoformat()
        
        # Clean up uploaded file
        try:
            os.remove(upload_path)
            app.logger.info(f"Cleaned up: {upload_path}")
        except Exception as e:
            app.logger.warning(f"Failed to delete upload: {str(e)}")
        
        status_code = 200 if result['status'] == 'success' else 500
        return jsonify(result), status_code
        
    except Exception as e:
        return create_error_response(
            str(e),
            'internal_error',
            500,
            {'traceback': traceback.format_exc()}
        )


@app.route('/extract-by-path', methods=['POST'])
def extract_by_path():
    """
    Extract data from image specified by file path
    
    JSON Body:
        {
            "image_path": "/absolute/path/to/image.jpg",
            "enhance": true  # optional
        }
    
    Returns:
        JSON with extracted document data
    """
    try:
        if extractor is None:
            return create_error_response(
                'Extraction system not initialized. Check OpenAI API key.',
                'initialization_error',
                500
            )
        
        # Parse JSON request
        data = request.get_json()
        
        if not data or 'image_path' not in data:
            return create_error_response(
                'Missing "image_path" in request body',
                'missing_parameter',
                400
            )
        
        image_path = data['image_path']
        enhance = data.get('enhance', True)
        
        # Validate image exists
        if not os.path.exists(image_path):
            return create_error_response(
                f'Image not found at path: {image_path}',
                'file_not_found',
                404,
                {'image_path': image_path}
            )
        
        # Process document
        app.logger.info(f"Processing image from path: {image_path}")
        result = extractor.extract_from_image(image_path, enhance=enhance)
        
        # Add metadata
        result['image_path'] = image_path
        result['timestamp'] = datetime.now().isoformat()
        
        status_code = 200 if result['status'] == 'success' else 500
        return jsonify(result), status_code
        
    except Exception as e:
        return create_error_response(
            str(e),
            'internal_error',
            500,
            {'traceback': traceback.format_exc()}
        )


# ==================== ERROR HANDLERS ====================

@app.errorhandler(413)
def request_entity_too_large(error):
    return create_error_response(
        'File size exceeds maximum limit of 16MB',
        'file_too_large',
        413
    )


@app.errorhandler(400)
def bad_request(error):
    return create_error_response(
        'Bad request - invalid parameters or malformed data',
        'bad_request',
        400
    )


@app.errorhandler(404)
def not_found(error):
    return create_error_response(
        'Endpoint not found',
        'not_found',
        404
    )


@app.errorhandler(500)
def internal_server_error(error):
    return create_error_response(
        'Internal server error occurred',
        'internal_server_error',
        500
    )


@app.errorhandler(Exception)
def handle_unexpected_error(error):
    app.logger.error(f"Unexpected error: {str(error)}\n{traceback.format_exc()}")
    return create_error_response(
        'An unexpected error occurred',
        'unexpected_error',
        500,
        {'error_details': str(error)}
    )


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000, threaded=True)
