# GrabCut Image Segmentation Web App

A modern web application for image segmentation using OpenCV's GrabCut algorithm. This application allows users to upload images, draw bounding boxes around objects, and perform segmentation with a beautiful, user-friendly interface.

## Features

- Modern, responsive UI built with Tailwind CSS
- Real-time bounding box drawing
- Two segmentation modes:
  - Normal segmentation
  - Colored foreground with black and white background
- Automatic mask generation
- Save both segmentation result and mask
- Loading indicators and error handling
- Mobile-friendly design

## Setup

1. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python app.py
```

4. Open your browser and navigate to `http://localhost:5000`

## Usage

1. Click "Choose Image" to upload an image
2. Draw a rectangle around the object you want to segment by clicking and dragging
3. Click "Run GrabCut" to perform the segmentation
4. Choose between normal segmentation or colored foreground with BW background
5. Click "Save Result" to save both the segmentation result and mask
6. Use "Reset" to start over with the same image

## Technical Details

- Backend: Flask
- Frontend: HTML5, JavaScript, Tailwind CSS
- Image Processing: OpenCV (cv2)
- File Handling: Pillow (PIL)

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
