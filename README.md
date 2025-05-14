# IPV Project - Image Processing Tools

A comprehensive web application featuring various image processing tools implemented with Flask and OpenCV. This project provides a user-friendly interface for different computer vision techniques.

## Available Tools

### GrabCut Segmentation
- Extract objects from images by drawing a bounding box
- Two segmentation modes:
  - Normal segmentation
  - Colored foreground with black and white background
- Automatic mask generation
- Save both segmentation result and mask

### B&W Converter
- Transform color images to grayscale using various techniques:
  - Luminosity (BT.709)
  - Average
  - Lightness
  - Green Channel
  - Luma (BT.601)
  - Custom weights

## Requirements

- Python 3.11+
- Flask 3.0.2
- OpenCV 4.9.0.80
- NumPy 1.26.4
- PIL (Pillow) 10.2.0
- Werkzeug 3.0.1

## Project Structure

```
IPV Project/
├── app.py              # Flask application
├── requirements.txt    # Python dependencies
├── static/            # Static files
│   └── uploads/       # Uploaded and processed images
└── templates/         # HTML templates
    └── index.html     # Main application template
```

## Notes

- Maximum file size: 16MB
- Supported image formats: PNG, JPG, JPEG
- The application automatically resizes large images for better performance
- All processing is done server-side for better accuracy
