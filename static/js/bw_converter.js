// Canvas and state
let originalCanvas = document.getElementById('originalCanvas');
let ctx = originalCanvas.getContext('2d');
let originalImage = null;

// UI Elements
const imageInput = document.getElementById('imageInput');
const convertBtn = document.getElementById('convertBtn');
const saveBtn = document.getElementById('saveBtn');
const resultImage = document.getElementById('resultImage');
const loadingOverlay = document.getElementById('loadingOverlay');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const methodDescription = document.getElementById('methodDescription');

// Method cards
const methodCards = {
    'luminosity': document.getElementById('methodLuminosity'),
    'average': document.getElementById('methodAverage'),
    'lightness': document.getElementById('methodLightness'),
    'green_channel': document.getElementById('methodGreen'),
    'luma': document.getElementById('methodLuma'),
    'custom': document.getElementById('methodCustom')
};

// Current state
let currentMethod = 'luminosity';
let currentResult = null;

// Constants
const MAX_SIZE = 800;  // Maximum dimension for display

// Method descriptions
const methodDescriptions = {
    'luminosity': `
        <p class="text-gray-700">
            The <strong>Luminosity Method (BT.709)</strong> is the industry standard for converting RGB to grayscale. It applies different weights to each color channel based on human perception:
        </p>
        <pre class="bg-gray-100 p-2 rounded mt-2">Grayscale = 0.2989 * R + 0.5870 * G + 0.1140 * B</pre>
        <p class="text-gray-700 mt-2">
            This method recognizes that the human eye is most sensitive to green light, followed by red, and then blue.
        </p>
    `,
    'average': `
        <p class="text-gray-700">
            The <strong>Average Method</strong> is the simplest approach to grayscale conversion. It simply takes the average of the three color channels:
        </p>
        <pre class="bg-gray-100 p-2 rounded mt-2">Grayscale = (R + G + B) / 3</pre>
        <p class="text-gray-700 mt-2">
            While straightforward, this method doesn't account for human perception of brightness, which varies by color.
        </p>
    `,
    'lightness': `
        <p class="text-gray-700">
            The <strong>Lightness Method</strong> creates grayscale by averaging the lightest and darkest color values:
        </p>
        <pre class="bg-gray-100 p-2 rounded mt-2">Grayscale = (max(R, G, B) + min(R, G, B)) / 2</pre>
        <p class="text-gray-700 mt-2">
            This method preserves extreme values but may lose mid-tone differentiation.
        </p>
    `,
    'green_channel': `
        <p class="text-gray-700">
            The <strong>Green Channel Method</strong> simply extracts the green channel from the RGB image:
        </p>
        <pre class="bg-gray-100 p-2 rounded mt-2">Grayscale = G</pre>
        <p class="text-gray-700 mt-2">
            This works surprisingly well because green typically contains the most luminance information and closely matches human brightness perception.
        </p>
    `,
    'luma': `
        <p class="text-gray-700">
            The <strong>Luma Method (BT.601)</strong> is an older standard for converting RGB to grayscale, used in older video systems:
        </p>
        <pre class="bg-gray-100 p-2 rounded mt-2">Grayscale = 0.299 * R + 0.587 * G + 0.114 * B</pre>
        <p class="text-gray-700 mt-2">
            Slightly different from the BT.709 standard, it gives more weight to red and less to blue.
        </p>
    `,
    'custom': `
        <p class="text-gray-700">
            The <strong>Custom Method</strong> demonstrates how you can create your own weighted conversion:
        </p>
        <pre class="bg-gray-100 p-2 rounded mt-2">Grayscale = 0.25 * R + 0.5 * G + 0.25 * B</pre>
        <p class="text-gray-700 mt-2">
            This example uses equal weights for red and blue with more emphasis on green.
        </p>
    `
};

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
    originalCanvas.width = width;
    originalCanvas.height = height;
    
    // Draw image on canvas
    ctx.drawImage(image, 0, 0, width, height);
    
    // Store original image for later use
    originalImage = image;
    
    // Enable convert button
    convertBtn.disabled = false;
    
    updateStatus('Image loaded. Choose a conversion method and click "Convert to B&W".');
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

// Select conversion method
function selectMethod(method) {
    // Update UI
    for (const key in methodCards) {
        methodCards[key].classList.remove('selected');
    }
    methodCards[method].classList.add('selected');
    
    // Update current method
    currentMethod = method;
    
    // Update description
    methodDescription.innerHTML = methodDescriptions[method];
    
    // If we already have a result, convert again with new method
    if (originalImage && resultImage.style.display !== 'none') {
        convertImage();
    }
}

// Convert image to B&W
async function convertImage() {
    if (!originalImage) {
        alert('Please upload an image first.');
        return;
    }
    
    try {
        // Show loading overlay
        loadingOverlay.style.display = 'flex';
        updateStatus('Converting image...');
        
        // Get image data
        const imageData = originalImage.src;
        
        // Prepare request data
        const data = {
            image: imageData,
            method: currentMethod
        };
        
        // Send request to server
        const response = await fetch('/bw-converter/convert', {
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
            throw new Error(result.error || 'Conversion failed');
        }
        
        // Display result
        resultImage.src = result.result_image;
        resultImage.style.display = 'block';
        
        // Store current result
        currentResult = result.result_image;
        
        // Enable save button
        saveBtn.disabled = false;
        
        updateStatus('Conversion complete!');
        
    } catch (error) {
        console.error('Error:', error);
        updateStatus('Error: ' + error.message);
        alert('Error converting image: ' + error.message);
    } finally {
        // Hide loading overlay
        loadingOverlay.style.display = 'none';
    }
}

// Save processed result
async function saveResult() {
    if (!currentResult) {
        alert('No result to save');
        return;
    }
    
    try {
        // Show loading overlay
        loadingOverlay.style.display = 'flex';
        updateStatus('Saving image...');
        
        // Prepare request data
        const data = {
            result_image: currentResult,
            method: currentMethod
        };
        
        // Send request to server
        const response = await fetch('/bw-converter/save', {
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
        
        updateStatus('Image saved successfully!');
        alert('Image saved successfully!');
        
    } catch (error) {
        console.error('Error:', error);
        updateStatus('Error: ' + error.message);
        alert('Error saving image: ' + error.message);
    } finally {
        // Hide loading overlay
        loadingOverlay.style.display = 'none';
    }
}

// Add event listeners
imageInput.addEventListener('change', handleImageUpload);
convertBtn.addEventListener('click', convertImage);
saveBtn.addEventListener('click', saveResult);
sidebarToggle.addEventListener('click', toggleSidebar);

// Method selection event listeners
for (const method in methodCards) {
    methodCards[method].addEventListener('click', () => selectMethod(method));
}

// Initialize with default method
selectMethod('luminosity');