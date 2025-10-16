# PaddleOCR Migration Guide

## Overview
This project has been migrated from **Tesseract.js** to **PaddleOCR.js** for improved OCR accuracy. PaddleOCR is known for its superior text recognition capabilities, especially for documents with varying quality.

## What Changed?

### 1. Dependencies
- **Removed**: `tesseract.js` (v6.0.1)
- **Using**: `@paddlejs-models/ocr` (v1.2.4) and `paddlejs` (v1.0.17) - already installed

### 2. New Files Created
- **`src/utils/paddleOCRService.js`**: A wrapper service for PaddleOCR that provides:
  - Easy initialization
  - Image preprocessing
  - Text recognition
  - Support for multiple image formats (File, Blob, URL, HTMLImageElement, HTMLCanvasElement)

### 3. Modified Files

#### `src/utils/documentUtils.js`
- Replaced Tesseract worker with PaddleOCR service
- Updated `processDocumentImage()` function
- Updated `testOCR()` function

#### `src/components/DocumentScanner.jsx`
- Replaced Tesseract import with PaddleOCR service
- Updated `performOCR()` function to use PaddleOCR

#### `package.json`
- Removed `tesseract.js` dependency

## How to Use PaddleOCR Service

### Basic Usage

```javascript
import paddleOCRService from './utils/paddleOCRService';

// Initialize (only needed once, but safe to call multiple times)
await paddleOCRService.init();

// Recognize text from an image
const text = await paddleOCRService.recognize(imageFile, {
  preprocess: true // Enable image preprocessing for better accuracy
});

console.log('Extracted text:', text);
```

### Supported Image Types

```javascript
// From File/Blob
const text1 = await paddleOCRService.recognize(fileInput.files[0]);

// From URL
const text2 = await paddleOCRService.recognize('https://example.com/image.jpg');

// From base64
const text3 = await paddleOCRService.recognize('data:image/png;base64,...');

// From HTMLImageElement
const img = document.getElementById('myImage');
const text4 = await paddleOCRService.recognize(img);

// From HTMLCanvasElement
const canvas = document.getElementById('myCanvas');
const text5 = await paddleOCRService.recognize(canvas);
```

### Options

```javascript
const text = await paddleOCRService.recognize(image, {
  preprocess: true,  // Enable/disable image preprocessing (default: true)
  // Additional PaddleOCR options can be added here
});
```

## Benefits of PaddleOCR

1. **Higher Accuracy**: PaddleOCR typically provides better text recognition, especially for:
   - Low-quality images
   - Documents with complex layouts
   - Mixed language content
   - Handwritten text (with appropriate models)

2. **Better Performance**: Optimized for modern web browsers

3. **Robust Detection**: Better at detecting text regions in images

4. **Active Development**: PaddleOCR is actively maintained with regular updates

## Image Preprocessing

The service includes automatic image preprocessing that:
- Resizes images to optimal dimensions (max 1600px)
- Converts to grayscale
- Applies adaptive thresholding
- Enhances contrast for better text detection

You can disable preprocessing by setting `preprocess: false` in options.

## Troubleshooting

### Issue: OCR not working
**Solution**: Make sure PaddleOCR is initialized before use:
```javascript
await paddleOCRService.init();
```

### Issue: Poor accuracy
**Solutions**:
1. Enable preprocessing: `{ preprocess: true }`
2. Ensure image quality is good (not too blurry, good lighting)
3. Try different image formats or resolutions

### Issue: Slow performance
**Solutions**:
1. Reduce image size before processing
2. The first OCR call may be slower due to model loading
3. Subsequent calls will be faster

## Testing

To test the OCR functionality:

```javascript
import { testOCR } from './utils/documentUtils';

// Test with a file
const result = await testOCR(imageFile);
console.log('Test result:', result);
```

## Migration Checklist

- [x] Removed Tesseract.js dependency
- [x] Created PaddleOCR service wrapper
- [x] Updated documentUtils.js
- [x] Updated DocumentScanner.jsx
- [x] Updated package.json
- [x] Uninstalled tesseract.js package

## Next Steps

1. **Test the application**: Upload various document types to verify OCR accuracy
2. **Fine-tune preprocessing**: Adjust preprocessing parameters if needed
3. **Monitor performance**: Check console logs for OCR processing times
4. **Optimize as needed**: Add caching or other optimizations based on usage patterns

## Resources

- [PaddleOCR GitHub](https://github.com/PaddlePaddle/PaddleOCR)
- [PaddleOCR.js Documentation](https://github.com/PaddlePaddle/Paddle.js)
- [@paddlejs-models/ocr NPM](https://www.npmjs.com/package/@paddlejs-models/ocr)

## Support

If you encounter any issues with the PaddleOCR integration, check:
1. Browser console for error messages
2. Network tab for model loading issues
3. Image quality and format compatibility