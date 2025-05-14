import cv2
import numpy as np
import base64
import logging
import re
from io import BytesIO
from PIL import Image

# Set up logging
logger = logging.getLogger(__name__)


class GrabCutProcessor:
    def __init__(self):
        """Initialize the GrabCut processor"""
        self.img = None
        self.mask = None
        self.binary_mask = None
        self.result = None
        self.result_normal = None
        self.result_bw = None
        self.rect = None

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

            # Convert from PIL's RGB to OpenCV's BGR
            self.img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

            # Reset state
            self.mask = None
            self.binary_mask = None
            self.result = None
            self.result_normal = None
            self.result_bw = None
            self.rect = None

            logger.info(f"Loaded image with dimensions: {self.img.shape}")
            return True
        except Exception as e:
            logger.exception(f"Error loading image: {str(e)}")
            return False

    def set_rectangle(self, rect):
        """Set rectangle for GrabCut"""
        try:
            # Extract rectangle coordinates
            x = int(rect["x"])
            y = int(rect["y"])
            w = int(rect["width"])
            h = int(rect["height"])

            # Validate rectangle
            if (
                x < 0
                or y < 0
                or w <= 0
                or h <= 0
                or x + w > self.img.shape[1]
                or y + h > self.img.shape[0]
            ):
                logger.error(f"Invalid rectangle: {rect}")
                return False

            self.rect = (x, y, w, h)
            logger.info(f"Set rectangle: {self.rect}")
            return True
        except Exception as e:
            logger.exception(f"Error setting rectangle: {str(e)}")
            return False

    def run_grabcut(self, result_type="normal"):
        """Run GrabCut algorithm on the image"""
        try:
            if self.img is None or self.rect is None:
                logger.error("Image or rectangle not set")
                return False

            # Initialize mask
            self.mask = np.zeros(self.img.shape[:2], dtype=np.uint8)

            # Define background and foreground models
            bgd_model = np.zeros((1, 65), np.float64)
            fgd_model = np.zeros((1, 65), np.float64)

            # Run GrabCut
            try:
                cv2.grabCut(
                    self.img,
                    self.mask,
                    self.rect,
                    bgd_model,
                    fgd_model,
                    5,  # Number of iterations
                    cv2.GC_INIT_WITH_RECT,
                )
            except Exception as e:
                logger.exception(f"Error in GrabCut algorithm: {str(e)}")
                return False

            # Create binary mask for foreground
            self.binary_mask = np.where(
                (self.mask == 1) + (self.mask == 3), 255, 0
            ).astype("uint8")

            # Alternative approach for result_normal:
            self.result_normal = np.zeros_like(self.img)
            for i in range(self.binary_mask.shape[0]):
                for j in range(self.binary_mask.shape[1]):
                    if self.binary_mask[i, j] > 0:
                        self.result_normal[i, j] = self.img[i, j]

            # The result_normal is now in BGR format, which is correct for OpenCV
            # Then for the BW background
            self.result_bw = self._create_bw_background()

            # Set result based on type
            self.result = (
                self.result_normal if result_type == "normal" else self.result_bw
            )

            # No additional color conversion needed here
            logger.info(f"Completed GrabCut processing with result type: {result_type}")
            return True
        except Exception as e:
            logger.exception(f"Error running GrabCut: {str(e)}")
            return False

    def _create_bw_background(self):
        """Create result with colored foreground and black & white background"""
        try:
            # Create grayscale version as the base
            gray_img = cv2.cvtColor(self.img, cv2.COLOR_BGR2GRAY)
            result = cv2.cvtColor(gray_img, cv2.COLOR_GRAY2BGR)

            # Direct pixel copy for foreground
            mask = self.binary_mask > 0
            result[mask] = self.img[mask]

            return result
        except Exception as e:
            logger.exception(f"Error creating B&W background: {str(e)}")
            return self.img.copy()

    def get_results(self):
        try:
            if self.result is None or self.binary_mask is None:
                logger.error("No results available")
                return None

            # Log color samples for debugging
            if self.result.shape[0] > 10 and self.result.shape[1] > 10:
                sample_pixel_bgr = self.result[10, 10]
                logger.debug(f"Sample BGR pixel before conversion: {sample_pixel_bgr}")

            # Convert from BGR to RGB for web display
            # result_rgb = cv2.cvtColor(self.result, cv2.COLOR_BGR2RGB)

            # Properly encode as PNG image
            _, result_buffer = cv2.imencode(".png", self.result)
            result_b64 = base64.b64encode(result_buffer).decode("utf-8")

            # Convert mask to base64
            _, mask_buffer = cv2.imencode(".png", self.binary_mask)
            mask_b64 = base64.b64encode(mask_buffer).decode("utf-8")

            return {
                "result_image": f"data:image/png;base64,{result_b64}",
                "mask_image": f"data:image/png;base64,{mask_b64}",
            }
        except Exception as e:
            logger.exception(f"Error getting results: {str(e)}")
            return None
