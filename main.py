import os
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask, render_template, request

# Import blueprints (you'll need to create these for bw_converter and segmentation)
from modules.grabcut.routes import grabcut_bp
# from modules.bw_converter.routes import bw_converter_bp
# from modules.segmentation.routes import segmentation_bp

def create_app():
    app = Flask(__name__)

    # Logging setup
    if not os.path.exists('logs'):
        os.makedirs('logs')
    file_handler = RotatingFileHandler('logs/app.log', maxBytes=1024*1024, backupCount=10)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('IPV application startup')

    # Upload folders
    upload_dirs = [
        'uploads',
        'uploads/grabcut',
        'uploads/bw_converter',
        'uploads/segmentation'
    ]
    for directory in upload_dirs:
        if not os.path.exists(directory):
            os.makedirs(directory)
            app.logger.info(f'Created upload directory: {directory}')
    app.config['UPLOAD_FOLDER'] = 'uploads'

    # Register blueprints
    app.register_blueprint(grabcut_bp, url_prefix='/grabcut')
    # app.register_blueprint(bw_converter_bp, url_prefix='/bw_converter')
    # app.register_blueprint(segmentation_bp, url_prefix='/segmentation')

    # Main index route
    @app.route('/')
    def index():
        return render_template('index.html')

    # Error handlers
    @app.errorhandler(404)
    def not_found_error(error):
        if request.path.startswith('/.well-known/'):
            return '', 404
        app.logger.error(f'Page not found: {request.path}')
        return render_template('404.html'), 404

    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f'Server Error: {error}')
        return render_template('500.html'), 500

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
