from flask import Blueprint, render_template, request, jsonify
import os
import uuid
import base64
import logging
import cv2
import numpy as np
from io import BytesIO
from PIL import Image
from .processor import GrabCutProcessor

# Set up logging
logger = logging.getLogger(__name__)

# Create blueprint
grabcut_bp = Blueprint("grabcut", __name__, url_prefix="/grabcut")

# Create processor instance
processor = GrabCutProcessor()


@grabcut_bp.route("/")
def index():
    """Render the GrabCut interface"""
    logger.info("Rendering GrabCut interface")
    return render_template("grabcut/index.html")


@grabcut_bp.route("/process", methods=["POST"])
def process():
    """Process image using GrabCut algorithm"""
    try:
        # Get request data
        data = request.get_json()
        if not data or "image" not in data or "rect" not in data:
            logger.error("Missing required data")
            return jsonify({"success": False, "error": "Missing required data"})

        # Load image
        if not processor.load_image(data["image"]):
            logger.error("Failed to load image")
            return jsonify({"success": False, "error": "Failed to load image"})

        # Set rectangle
        if not processor.set_rectangle(data["rect"]):
            logger.error("Invalid rectangle coordinates")
            return jsonify({"success": False, "error": "Invalid rectangle coordinates"})

        # Run GrabCut
        result_type = data.get("result_type", "normal")
        if not processor.run_grabcut(result_type):
            logger.error("GrabCut processing failed")
            return jsonify({"success": False, "error": "GrabCut processing failed"})

        # Get results
        results = processor.get_results()
        if not results:
            logger.error("Failed to get results")
            return jsonify({"success": False, "error": "Failed to get results"})

        logger.info("Successfully processed image")
        return jsonify(
            {
                "success": True,
                "result_image": results["result_image"],
                "mask_image": results["mask_image"],
            }
        )

    except Exception as e:
        logger.exception(f"Error processing image: {str(e)}")
        return jsonify({"success": False, "error": str(e)})


@grabcut_bp.route("/save", methods=["POST"])
def save():
    """Save processed results to files"""
    try:
        # Get request data
        data = request.get_json()
        if not data or "result_image" not in data or "mask_image" not in data:
            logger.error("Missing required data for saving")
            return jsonify({"success": False, "error": "Missing required data"})

        # Generate unique filenames
        timestamp = uuid.uuid4().hex[:8]
        result_filename = f"result_{timestamp}.png"
        mask_filename = f"mask_{timestamp}.png"

        # Create save directory if it doesn't exist
        save_dir = os.path.join("static", "uploads", "grabcut")
        os.makedirs(save_dir, exist_ok=True)

        # Save paths
        result_path = os.path.join(save_dir, result_filename)
        mask_path = os.path.join(save_dir, mask_filename)

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

        # Save mask image
        try:
            mask_data = data["mask_image"].split(",")[1]
            mask_bytes = base64.b64decode(mask_data)
            with open(mask_path, "wb") as f:
                f.write(mask_bytes)
        except Exception as e:
            logger.error(f"Failed to save mask image: {str(e)}")
            return jsonify(
                {"success": False, "error": f"Failed to save mask image: {str(e)}"}
            )

        logger.info(f"Successfully saved images: {result_path}, {mask_path}")
        return jsonify(
            {
                "success": True,
                "result_path": f"/static/uploads/grabcut/{result_filename}",
                "mask_path": f"/static/uploads/grabcut/{mask_filename}",
            }
        )

    except Exception as e:
        logger.exception(f"Error saving results: {str(e)}")
        return jsonify({"success": False, "error": str(e)})
