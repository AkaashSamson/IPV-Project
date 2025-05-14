from flask import Blueprint, render_template, request, jsonify
import os
import uuid
import base64
import logging
import cv2
import numpy as np
from io import BytesIO
from PIL import Image
from .processor import BWConverterProcessor

# Set up logging
logger = logging.getLogger(__name__)

# Create blueprint
bw_converter_bp = Blueprint("bw_converter", __name__, url_prefix="/bw-converter")

# Create processor instance
processor = BWConverterProcessor()


@bw_converter_bp.route("/")
def index():
    """Render the B&W Converter interface"""
    logger.info("Rendering B&W Converter interface")
    return render_template("bw_converter/index.html")


@bw_converter_bp.route("/convert", methods=["POST"])
def convert():
    """Convert image to B&W using selected method"""
    try:
        # Get request data
        data = request.get_json()
        if not data or "image" not in data or "method" not in data:
            logger.error("Missing required data")
            return jsonify({"success": False, "error": "Missing required data"})

        # Load image
        if not processor.load_image(data["image"]):
            logger.error("Failed to load image")
            return jsonify({"success": False, "error": "Failed to load image"})

        # Convert to B&W
        method = data["method"]
        if not processor.convert_to_bw(method):
            logger.error(f"B&W conversion failed with method: {method}")
            return jsonify(
                {
                    "success": False,
                    "error": f"B&W conversion failed with method: {method}",
                }
            )

        # Get result
        result = processor.get_result()
        if not result:
            logger.error("Failed to get result")
            return jsonify({"success": False, "error": "Failed to get result"})

        logger.info(f"Successfully converted image using {method} method")
        return jsonify(
            {"success": True, "result_image": result["result_image"], "method": method}
        )

    except Exception as e:
        logger.exception(f"Error converting image: {str(e)}")
        return jsonify({"success": False, "error": str(e)})


@bw_converter_bp.route("/save", methods=["POST"])
def save():
    """Save processed B&W image"""
    try:
        # Get request data
        data = request.get_json()
        if not data or "result_image" not in data:
            logger.error("Missing required data for saving")
            return jsonify({"success": False, "error": "Missing required data"})

        # Generate unique filename
        timestamp = uuid.uuid4().hex[:8]
        method = data.get("method", "custom")
        result_filename = f"bw_{method}_{timestamp}.png"

        # Create save directory if it doesn't exist
        save_dir = os.path.join("static", "uploads", "bw_converter")
        os.makedirs(save_dir, exist_ok=True)

        # Save path
        result_path = os.path.join(save_dir, result_filename)

        # Save result image
        try:
            result_data = data["result_image"].split(",")[1]
            result_bytes = base64.b64decode(result_data)
            with open(result_path, "wb") as f:
                f.write(result_bytes)
        except Exception as e:
            logger.error(f"Failed to save result image: {str(e)}")
            return jsonify(
                {"success": False, "error": f"Failed to save result image: {str(e)}"}
            )

        logger.info(f"Successfully saved B&W image: {result_path}")
        return jsonify(
            {
                "success": True,
                "result_path": f"/static/uploads/bw_converter/{result_filename}",
            }
        )

    except Exception as e:
        logger.exception(f"Error saving results: {str(e)}")
        return jsonify({"success": False, "error": str(e)})
