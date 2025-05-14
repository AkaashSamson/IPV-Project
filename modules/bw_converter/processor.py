import cv2
import numpy as np
import base64
import logging
from io import BytesIO
from PIL import Image

# Set up logging
logger = logging.getLogger(__name__)


class BWConverterProcessor:
    def __init__(self):
        """Initialize the B&W converter processor"""
        self.img = None
        self.result = None

    def load_image(self, image_data):
        """Load image from base64 data URL"""
        try:
            # Extract base64 data
            if "base64," in image_data:
                image_data = image_data.split("base64,")[1]

            # Decode base64 data
            image_bytes = base64.b64decode(image_data)

            # Open image
            img = Image.open(BytesIO(image_bytes))
            img = img.convert("RGB")

            # Convert to OpenCV format (BGR)
            self.img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

            # Reset state
            self.result = None

            logger.info(f"Loaded image with dimensions: {self.img.shape}")
            return True
        except Exception as e:
            logger.exception(f"Error loading image: {str(e)}")
            return False

    def convert_to_bw(self, method="luminosity"):
        """Convert image to black and white using specified method"""
        try:
            if self.img is None:
                logger.error("Image not loaded")
                return False

            # Different conversion methods
            if method == "average":
                # Average method: (R + G + B) / 3
                self.result = np.mean(self.img, axis=2).astype(np.uint8)

            elif method == "luminosity":
                # Luminosity method (BT.709): 0.2989 * R + 0.5870 * G + 0.1140 * B
                # Note: OpenCV uses BGR order
                self.result = cv2.cvtColor(self.img, cv2.COLOR_BGR2GRAY)

            elif method == "lightness":
                # Lightness method: (max(R,G,B) + min(R,G,B)) / 2
                max_channel = np.max(self.img, axis=2)
                min_channel = np.min(self.img, axis=2)
                self.result = ((max_channel + min_channel) / 2).astype(np.uint8)

            elif method == "green_channel":
                # Single channel extraction (Green)
                self.result = self.img[:, :, 1]

            elif method == "luma":
                # Luma method (BT.601): 0.299 * R + 0.587 * G + 0.114 * B
                # Convert weights for BGR: 0.114 * B + 0.587 * G + 0.299 * R
                b, g, r = cv2.split(self.img)
                self.result = (0.114 * b + 0.587 * g + 0.299 * r).astype(np.uint8)

            elif method == "custom":
                # Custom method (example: weighted channels, you can modify this)
                b, g, r = cv2.split(self.img)
                self.result = (0.25 * b + 0.5 * g + 0.25 * r).astype(np.uint8)

            else:
                logger.error(f"Unknown method: {method}")
                return False

            logger.info(f"Converted image to B&W using {method} method")
            return True
        except Exception as e:
            logger.exception(f"Error converting to B&W: {str(e)}")
            return False

    def get_result(self):
        """Get result as base64 encoded image"""
        try:
            if self.result is None:
                logger.error("No result available")
                return None

            # Properly encode as PNG image
            _, result_buffer = cv2.imencode(".png", self.result)
            result_b64 = base64.b64encode(result_buffer).decode("utf-8")

            return {"result_image": f"data:image/png;base64,{result_b64}"}
        except Exception as e:
            logger.exception(f"Error getting result: {str(e)}")
            return None
