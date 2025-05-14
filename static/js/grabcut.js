// Canvas and drawing state
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let isDrawing = false;
let startX, startY;
let currentRect = null;
let originalImage = null;
let scaleFactor = 1;

// UI Elements
const imageInput = document.getElementById('imageInput');
const resetBtn = document.getElementById('resetBtn');
const runBtn = document.getElementById('runBtn');
const resultType = document.getElementById('resultType');
const resultImage = document.getElementById('resultImage');
const maskImage = document.getElementById('maskImage');
const saveBtn = document.getElementById('saveBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');

// Constants
const MAX_SIZE = 800;  // Maximum dimension for the canvas
const MIN_RECT_SIZE = 20;  // Minimum rectangle size in pixels

// Update status message
function updateStatus(message) {
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = message;
        console.log("Status:", message);  // Also log to console for debugging
    }
}

// Sidebar toggle
function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
    if (sidebar.classList.contains('collapsed')) {
        sidebarToggle.classList.remove('fa-chevron-left');
        sidebarToggle.classList.add('fa-chevron-right');
    } else {
        sidebarToggle.classList.remove('fa-chevron-right');
        sidebarToggle.classList.add('fa-chevron-left');
    }
}

// Initialize canvas
function setupCanvas(image) {
    // Calculate dimensions to fit within MAX_SIZE while maintaining aspect ratio
    const aspectRatio = image.width / image.height;
    let width, height;
    
    if (image.width > image.height) {
        width = Math.min(image.width, MAX_SIZE);
        height = width / aspectRatio;
    } else {
        height = Math.min(image.height, MAX_SIZE);
        width = height * aspectRatio;
    }
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Calculate scale factor for coordinate conversion
    scaleFactor = image.width / width;
    
    // Draw image on canvas
    ctx.drawImage(image, 0, 0, width, height);
    
    // Store original image for later use
    originalImage = image;
    
    // Enable buttons
    resetBtn.disabled = false;
    runBtn.disabled = false;
    resultType.disabled = false;
    
    updateStatus('Image loaded. Draw a rectangle around the object.');
}

// Handle image upload
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    updateStatus('Loading image...');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            setupCanvas(img);
        };
        img.onerror = function() {
            updateStatus('Error loading image. Please try another file.');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Reset canvas to initial state
function resetCanvas() {
    if (!originalImage) return;
    
    // Clear canvas and redraw original image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    
    // Reset state
    currentRect = null;
    isDrawing = false;
    
    // Hide results
    resultImage.style.display = 'none';
    maskImage.style.display = 'none';
    saveBtn.disabled = true;
    
    updateStatus('Rectangle cleared. Draw a new selection.');
}

// Mouse event handlers
canvas.addEventListener('mousedown', function(e) {
    if (!originalImage) return;
    
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    
    // Clamp coordinates to canvas bounds
    startX = Math.max(0, Math.min(startX, canvas.width));
    startY = Math.max(0, Math.min(startY, canvas.height));
    
    isDrawing = true;
    canvas.classList.add('drawing');
});

canvas.addEventListener('mousemove', function(e) {
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    let currentX = e.clientX - rect.left;
    let currentY = e.clientY - rect.top;
    
    // Clamp coordinates to canvas bounds
    currentX = Math.max(0, Math.min(currentX, canvas.width));
    currentY = Math.max(0, Math.min(currentY, canvas.height));
    
    // Redraw canvas with original image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    
    // Draw rectangle
    const width = currentX - startX;
    const height = currentY - startY;
    
    // Draw semi-transparent fill
    ctx.fillStyle = 'rgba(0, 123, 255, 0.2)';
    ctx.fillRect(startX, startY, width, height);
    
    // Draw dashed border
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(startX, startY, width, height);
    ctx.setLineDash([]);
});

canvas.addEventListener('mouseup', function(e) {
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    let endX = e.clientX - rect.left;
    let endY = e.clientY - rect.top;
    
    // Clamp coordinates to canvas bounds
    endX = Math.max(0, Math.min(endX, canvas.width));
    endY = Math.max(0, Math.min(endY, canvas.height));
    
    // Calculate rectangle dimensions
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    
    // Ensure minimum size
    if (width < MIN_RECT_SIZE || height < MIN_RECT_SIZE) {
        resetCanvas();
        updateStatus('Rectangle too small. Please draw a larger rectangle.');
        return;
    }
    
    // Store rectangle coordinates (scaled to original image size)
    currentRect = {
        x: Math.min(startX, endX) * scaleFactor,
        y: Math.min(startY, endY) * scaleFactor,
        width: width * scaleFactor,
        height: height * scaleFactor
    };
    
    // Draw final rectangle
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    
    // Draw solid border
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;
    ctx.strokeRect(
        currentRect.x / scaleFactor,
        currentRect.y / scaleFactor,
        currentRect.width / scaleFactor,
        currentRect.height / scaleFactor
    );
    
    isDrawing = false;
    canvas.classList.remove('drawing');
    
    updateStatus('Selection complete. Click "Run GrabCut" to process.');
});

// Run GrabCut algorithm
async function runGrabCut() {
    if (!originalImage || !currentRect) {
        alert('Please upload an image and draw a rectangle first.');
        return;
    }
    
    try {
        // Show loading overlay
        loadingOverlay.style.display = 'flex';
        updateStatus('Processing image...');
        
        // Get image data
        const imageData = originalImage.src;
        
        // Prepare request data
        const data = {
            image: imageData,
            rect: currentRect,
            result_type: document.getElementById('resultType').value
        };
        
        // Send request to server
        const response = await fetch('/grabcut/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Processing failed');
        }
        
        // Display results
        resultImage.src = result.result_image;
        maskImage.src = result.mask_image;
        
        resultImage.style.display = 'block';
        maskImage.style.display = 'block';
        saveBtn.disabled = false;
        
        updateStatus('Processing complete. You can save the results.');
        
    } catch (error) {
        console.error('Error:', error);
        updateStatus('Error: ' + error.message);
        alert('Error processing image: ' + error.message);
    } finally {
        // Hide loading overlay
        loadingOverlay.style.display = 'none';
    }
}

// Update result type and reprocess if needed
function updateResultType() {
    if (resultImage.style.display !== 'none') {
        runGrabCut();
    }
}

// Save processed result
async function saveResult() {
    if (!resultImage.src || !maskImage.src) {
        alert('No result to save');
        return;
    }
    
    try {
        // Show loading overlay
        loadingOverlay.style.display = 'flex';
        updateStatus('Saving images...');
        
        // Prepare request data
        const data = {
            result_image: resultImage.src,
            mask_image: maskImage.src,
            result_type: resultType.value
        };
        
        // Send request to server
        const response = await fetch('/grabcut/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Saving failed');
        }
        
        updateStatus('Images saved successfully!');
        alert('Images saved successfully!');
        
    } catch (error) {
        console.error('Error:', error);
        updateStatus('Error: ' + error.message);
        alert('Error saving images: ' + error.message);
    } finally {
        // Hide loading overlay
        loadingOverlay.style.display = 'none';
    }
}

// Add event listeners
imageInput.addEventListener('change', handleImageUpload);
resetBtn.addEventListener('click', resetCanvas);
runBtn.addEventListener('click', runGrabCut);
saveBtn.addEventListener('click', saveResult);
sidebarToggle.addEventListener('click', toggleSidebar);