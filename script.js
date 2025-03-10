
document.addEventListener('DOMContentLoaded', function() {
console.log("DOM fully loaded");

// Application state
let grid = [];
let isDragging = false;
let isCrosshairVisible = true;
let isHoopVisible = true;
let currentBitmapFont = null;
let textElements = [];

// DOM Elements
const gridWidthInput = document.getElementById('gridWidth');
const gridHeightInput = document.getElementById('gridHeight');
const cellSizeInput = document.getElementById('cellSize');
const drawColorInput = document.getElementById('drawColor');
const createGridBtn = document.getElementById('createGridBtn');
const clearGridBtn = document.getElementById('clearGridBtn');
const toggleCrosshairBtn = document.getElementById('toggleCrosshairBtn');
const toggleHoopBtn = document.getElementById('toggleHoopBtn');
const pixelGrid = document.getElementById('pixelGrid');
const gridContainer = document.getElementById('gridContainer');
const toggleTextModeBtn = document.getElementById('toggleTextMode');
const textInputContainer = document.getElementById('textInputContainer');
const addTextElementBtn = document.getElementById('addTextElementBtn');
const textElementsContainer = document.getElementById('textElementsContainer');
const drawAllTextBtn = document.getElementById('drawAllTextBtn');

// Font defaults
const DEFAULT_FONT_SIZE = 16;

console.log("Add Text Element Button:", addTextElementBtn);

// Create an off-screen canvas for font rendering
const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d', { alpha: true });

// Function to toggle cell fill
function toggleCellFill(cell) {
    if (!cell.classList.contains('filled')) {
        cell.classList.add('filled');
        cell.style.backgroundColor = drawColorInput.value;
    } else {
        cell.classList.remove('filled');
        cell.style.backgroundColor = '';
    }
}

// Function to clear grid
function clearGrid() {
    const cells = document.querySelectorAll('.cell.filled');
    cells.forEach(cell => {
        cell.classList.remove('filled');
        cell.style.backgroundColor = '';
    });
}

// Function to toggle crosshair
function toggleCrosshair() {
    isCrosshairVisible = !isCrosshairVisible;
    updateCrosshair();
}

// Function to toggle hoop outline
function toggleHoop() {
    isHoopVisible = !isHoopVisible;
    updateHoopOutline();
}

// Function to update crosshair
function updateCrosshair() {
    const width = parseInt(gridWidthInput.value);
    const height = parseInt(gridHeightInput.value);
    
    // Calculate center position
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    
    // Remove existing crosshair classes
    document.querySelectorAll('.cell.crosshair-h, .cell.crosshair-v').forEach(cell => {
        cell.classList.remove('crosshair-h', 'crosshair-v');
    });
    
    if (isCrosshairVisible) {
        // Add crosshair to middle row
        for (let x = 0; x < width; x++) {
            if (grid[centerY] && grid[centerY][x]) {
                grid[centerY][x].classList.add('crosshair-h');
            }
        }
        
        // Add crosshair to middle column
        for (let y = 0; y < height; y++) {
            if (grid[y] && grid[y][centerX]) {
                grid[y][centerX].classList.add('crosshair-v');
            }
        }
    }
}

// Function to update the elliptical hoop outline
function updateHoopOutline() {
    const width = parseInt(gridWidthInput.value);
    const height = parseInt(gridHeightInput.value);
    
    // Remove existing hoop outline classes
    document.querySelectorAll('.cell.hoop-outline').forEach(cell => {
        cell.classList.remove('hoop-outline');
    });
    
    if (!isHoopVisible) return;
    
    // Calculate center position
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    
    // Calculate radius for the ellipse (80% of grid dimensions)
    const rx = Math.floor(width * 0.5);  // 40% of width as x-radius
    const ry = Math.floor(height * 0.5); // 40% of height as y-radius
    
    // Add hoop outline to appropriate cells
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Ellipse equation: (x-h)²/a² + (y-k)²/b² = 1
            // where (h,k) is the center, a is x-radius, b is y-radius
            const normalizedX = (x - centerX) / rx;
            const normalizedY = (y - centerY) / ry;
            const distanceSquared = normalizedX * normalizedX + normalizedY * normalizedY;
            
            // Check if the point is close to the ellipse boundary
            // Value close to 1 means it's on the ellipse
            // Using a smaller tolerance (0.03) for a thinner outline
            if (Math.abs(distanceSquared - 1) < 0.03 && grid[y] && grid[y][x]) {
                grid[y][x].classList.add('hoop-outline');
            }
        }
    }
}

// Function to get default font size from filename
function getDefaultFontSize(filename) {
    let defaultSize = DEFAULT_FONT_SIZE;
    
    if (filename) {
        const fileNameWithoutExtension = filename.split('.')[0];
        const parts = fileNameWithoutExtension.split('_');
        
        // If filename has format "name_size" where size is a number
        if (parts.length >= 2 && !isNaN(parts[parts.length-1])) {
            const detectedSize = parseInt(parts[parts.length-1]);
            if (detectedSize >= 6 && detectedSize <= 72) {
                defaultSize = detectedSize;
            }
        }
    }
    
    return defaultSize;
}

// Function to organize fonts by size
function getFontsBySize() {
    // Create a map of fonts grouped by size
    const fontsBySize = new Map();
    
    // Process each font to extract its size and group accordingly
    availableFonts.forEach(font => {
        const size = getDefaultFontSize(font.filename);
        
        if (!fontsBySize.has(size)) {
            fontsBySize.set(size, []);
        }
        
        fontsBySize.get(size).push(font);
    });
    
    // Sort each group of fonts alphabetically
    fontsBySize.forEach((fonts, size) => {
        fonts.sort((a, b) => a.displayName.localeCompare(b.displayName));
    });
    
    // Return a sorted map (by size)
    return new Map([...fontsBySize.entries()].sort((a, b) => a[0] - b[0]));
}

// Function to create a grouped font dropdown with size headings
function createGroupedFontDropdown(selectElement, selectedFilename = null) {
    // Clear existing options
    selectElement.innerHTML = '';
    
    // Get fonts organized by size
    const fontsBySize = getFontsBySize();
    
    // Track the first font for default selection
    let firstFontFile = null;
    
    // Add each size group with its fonts
    fontsBySize.forEach((fonts, size) => {
        // Create and add the group heading
        const groupHeading = document.createElement('optgroup');
        groupHeading.label = `${size}px`;
        selectElement.appendChild(groupHeading);
        
        // Add fonts within this size group
        fonts.forEach(font => {
            const option = document.createElement('option');
            option.value = font.filename;
            option.textContent = font.displayName;
            option.style.fontFamily = font.name;
            
            // Store the first font for default selection
            if (firstFontFile === null) {
                firstFontFile = font.filename;
            }
            
            // Check if this font should be selected
            if (selectedFilename && selectedFilename === font.filename) {
                option.selected = true;
            }
            
            groupHeading.appendChild(option);
        });
    });
    
    return firstFontFile;
}

// Function to load a font from the folder
function loadFontFromFolder(filename) {
    // Construct the full path to the font file
    const fontPath = `fonts/${filename}`;
    
    // Create a FontFace object
    const fontFace = new FontFace('CustomFont', `url(${fontPath})`);
    
    // Load the font
    fontFace.load().then(function(loadedFace) {
        document.fonts.add(loadedFace);
        currentBitmapFont = 'CustomFont';
        
        // Get font name from the filename
        const selectedFont = availableFonts.find(font => font.filename === filename);
        const fontName = selectedFont ? selectedFont.displayName : filename;
        
        console.log(`Font "${fontName}" loaded successfully!`);
        toggleTextModeBtn.disabled = false;
    }).catch(function(error) {
        console.error('Error loading font:', error.message);
    });
}

// Function to load font for a specific text element
function loadFontForTextElement(elementId, fontInfo) {
    if (!fontInfo) return;
    
    // Construct font path
    const fontPath = `fonts/${fontInfo.filename}`;
    
    // Create a font ID specific to this element
    const fontFamily = `Font_${elementId}`;
    
    // Create a FontFace object
    const fontFace = new FontFace(fontFamily, `url(${fontPath})`);
    
    // Load the font
    fontFace.load().then(function(loadedFace) {
        document.fonts.add(loadedFace);
        
        // Find the element and update its font
        const element = textElements.find(el => el.id === elementId);
        if (element) {
            element.fontName = fontFamily;
            // Update the display
            drawAllText();
        }
    }).catch(function(error) {
        console.error('Error loading font for text element:', error);
        console.error('Error loading font: ' + error.message);
    });
}

// Function to preload fonts
function preloadFonts() {
    // Create a hidden div to preload fonts
    const preloadDiv = document.createElement('div');
    preloadDiv.style.visibility = 'hidden';
    preloadDiv.style.position = 'absolute';
    preloadDiv.style.top = '-9999px';
    preloadDiv.style.left = '-9999px';
    document.body.appendChild(preloadDiv);
    
    // Create promises for each font
    const fontPromises = availableFonts.map(font => {
        const fontPath = `fonts/${font.filename}`;
        const fontFace = new FontFace(font.name, `url(${fontPath})`);
        
        return fontFace.load().then(loadedFace => {
            document.fonts.add(loadedFace);
            
            // Add a sample text with this font
            const sampleText = document.createElement('div');
            sampleText.style.fontFamily = font.name;
            sampleText.textContent = font.displayName;
            preloadDiv.appendChild(sampleText);
            
            return loadedFace;
        }).catch(error => {
            console.error(`Error preloading font ${font.name}:`, error);
            return null;
        });
    });
    
    // Wait for all fonts to load
    Promise.all(fontPromises).then(loadedFonts => {
        console.log(`Preloaded ${loadedFonts.filter(f => f !== null).length} fonts`);
        
        // Remove the preload div after a short delay to ensure fonts are registered
        setTimeout(() => {
            document.body.removeChild(preloadDiv);
        }, 1000);
    });
}

// Function to toggle text mode
function toggleTextMode() {
    // Just toggle the text panel visibility - no longer checking for font
    textInputContainer.style.display = textInputContainer.style.display === 'none' || !textInputContainer.style.display ? 'block' : 'none';
    
    // If there are no text elements, add one by default
    if (textElements.length === 0 && currentBitmapFont) {
        addTextElement();
    }
}

// Helper function to calculate text starting position
function calculateTextStartPosition() {
    const width = parseInt(gridWidthInput.value);
    const height = parseInt(gridHeightInput.value);
    
    // Center position
    const centerX = Math.floor(width / 2) - 20; // Offset to left for left alignment
    const centerY = Math.floor(height / 2);
    
    // If there are existing text elements, place new ones below
    if (textElements.length > 0) {
        // Find the lowest Y position among text elements
        const lowestY = Math.max(...textElements.map(el => el.y));
        // Place new element 20px below the lowest element
        return { x: centerX, y: lowestY + 20 };
    }
    
    return { x: centerX, y: centerY };
}

// Function to create grid
function createGrid() {
    const width = parseInt(gridWidthInput.value);
    const height = parseInt(gridHeightInput.value);
    const cellSize = parseInt(cellSizeInput.value);
    
    // Reset grid
    pixelGrid.innerHTML = '';
    grid = [];
    
    // Set grid CSS
    pixelGrid.style.gridTemplateColumns = `repeat(${width}, ${cellSize}px)`;
    pixelGrid.style.gridTemplateRows = `repeat(${height}, ${cellSize}px)`;
    
    // Calculate center positions
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    
    // Create cells
    for (let y = 0; y < height; y++) {
        grid[y] = [];
        for (let x = 0; x < width; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            // Highlight every 5th column/row FROM CENTER
            if ((x - centerX) % 5 === 0) cell.classList.add('highlight-col');
            if ((y - centerY) % 5 === 0) cell.classList.add('highlight-row');
            
            cell.dataset.x = x;
            cell.dataset.y = y;
            
            // Add event listeners
            cell.addEventListener('mousedown', function(e) {
                isDragging = true;
                toggleCellFill(cell);
            });
            
            cell.addEventListener('mouseover', function(e) {
                if (isDragging) {
                    toggleCellFill(cell);
                }
            });
            
            pixelGrid.appendChild(cell);
            grid[y][x] = cell;
        }
    }
    
    // Set up crosshair position
    updateCrosshair();
    
    // Set up hoop outline
    updateHoopOutline();
    
    // Add mouse up event to stop dragging
    document.addEventListener('mouseup', function() {
        isDragging = false;
    });
    
    // Update any existing text elements with new grid boundaries
    if (textElements.length > 0) {
        textElements.forEach(element => {
            // Ensure positions are within new grid bounds
            element.x = Math.min(element.x, width - 1);
            element.y = Math.min(element.y, height - 1);
            
            // Update position displays
            updatePositionDisplay(element.id);
        });
        
        // Redraw text with new grid
        drawAllText();
    }
}

// Function to move text element
function moveTextElement(id, direction) {
    const element = textElements.find(el => el.id === id);
    if (!element) return;
    
    const gridWidth = parseInt(gridWidthInput.value);
    const gridHeight = parseInt(gridHeightInput.value);
    
    switch (direction) {
        case 'up':
            element.y = Math.max(0, element.y - 1);
            break;
        case 'right':
            element.x = Math.min(gridWidth - 1, element.x + 1);
            break;
        case 'down':
            element.y = Math.min(gridHeight - 1, element.y + 1);
            break;
        case 'left':
            element.x = Math.max(0, element.x - 1);
            break;
    }
    
    // Update position display
    updatePositionDisplay(id);
    
    // Redraw the text immediately for real-time feedback
    drawAllText();
}

// Function to update position display
function updatePositionDisplay(id) {
    const element = textElements.find(el => el.id === id);
    if (!element) return;
    
    const posDisplay = document.getElementById(`pos-display-${id}`);
    if (posDisplay) {
        posDisplay.textContent = `${element.x}, ${element.y}`;
    }
}

// Function to add a new text element
function addTextElement() {
    console.log("Adding new text element");
    
    if (!currentBitmapFont) {
        alert('Please load a font first');
        return;
    }
    
    // Create a unique ID for the element
    const elementId = Date.now();
    
    // Calculate starting position near the center
    const startPosition = calculateTextStartPosition();
    
    // Get the first font in the list
    const defaultFont = availableFonts.length > 0 ? availableFonts[0] : null;
    
    // Get the default font size
    const defaultFontSize = defaultFont ? getDefaultFontSize(defaultFont.filename) : DEFAULT_FONT_SIZE;
    
    // Create element data object
    const textElement = {
        id: elementId,
        text: '',
        x: startPosition.x,
        y: startPosition.y,
        alignment: 'left',
        fontSize: defaultFontSize,
        fontName: currentBitmapFont,
        fontFile: defaultFont ? defaultFont.filename : '',
        collapsed: false
    };
    
    // Add to array
    textElements.push(textElement);
    
    // Create the DOM element
    const element = document.createElement('div');
    element.className = 'text-element';
    element.id = `text-element-${elementId}`;
    
    element.innerHTML = `
        <div class="text-element-header" data-id="${elementId}">
            <div class="text-element-title-container">
                <span class="collapse-indicator">▼</span>
                <h4 class="text-element-title" id="title-${elementId}">Text Element ${textElements.length}</h4>
            </div>
            <button class="delete-element-btn" data-id="${elementId}">
                <span>X</span>
            </button>
        </div>
        <div class="text-element-content">
            <div class="control-group">
                <label for="text-${elementId}">Text:</label>
                <input type="text" id="text-${elementId}" class="text-input-field" data-id="${elementId}" value="">
            </div>
            <div class="control-group">
                <label for="font-${elementId}">Font:</label>
                <div id="font-container-${elementId}"></div>
            </div>
            <div class="control-group">
                <label for="font-size-${elementId}">Size:</label>
                <input type="number" id="font-size-${elementId}" class="element-font-size" min="6" max="72" value="${textElement.fontSize}" data-id="${elementId}">
            </div>
            <div class="control-group">
                <label for="align-${elementId}">Align:</label>
                <select id="align-${elementId}" class="align-input" data-id="${elementId}">
                    <option value="left" selected>Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                </select>
            </div>
            <div class="control-label">Position:</div>
            <div class="position-display">
                Coordinates: <span id="pos-display-${elementId}" class="coords-display">${textElement.x}, ${textElement.y}</span>
            </div>
            <div class="direction-controls" data-id="${elementId}">
                <button class="direction-btn up" data-direction="up" data-id="${elementId}">↑</button>
                <button class="direction-btn left" data-direction="left" data-id="${elementId}">←</button>
                <button class="direction-btn right" data-direction="right" data-id="${elementId}">→</button>
                <button class="direction-btn down" data-direction="down" data-id="${elementId}">↓</button>
            </div>
        </div>
    `;
    
    // Add to container
    textElementsContainer.appendChild(element);
    
    // Create a select element for the font dropdown
    const fontSelect = document.createElement('select');
    fontSelect.id = `font-${elementId}`;
    fontSelect.className = 'font-select element-font-select';
    fontSelect.dataset.id = elementId.toString();
    
    // Add the font select dropdown to its container
    const fontContainer = document.getElementById(`font-container-${elementId}`);
    if (fontContainer) {
        fontContainer.appendChild(fontSelect);
        // Initialize the dropdown with grouped fonts
        createGroupedFontDropdown(fontSelect, textElement.fontFile);
    }
    
    // Add event listeners for input changes
    const textInput = document.getElementById(`text-${elementId}`);
    const fontSizeElement = document.getElementById(`font-size-${elementId}`);
    const alignInput = document.getElementById(`align-${elementId}`);
    const deleteBtn = element.querySelector('.delete-element-btn');
    const directionBtns = element.querySelectorAll('.direction-btn:not(.center)');
    const header = element.querySelector('.text-element-header');
    
    textInput.addEventListener('input', function(e) {
        const id = parseInt(e.target.dataset.id);
        const element = textElements.find(el => el.id === id);
        if (element) {
            element.text = e.target.value;
            
            // Update the title to show the text content
            const titleElement = document.getElementById(`title-${id}`);
            if (titleElement) {
                titleElement.textContent = e.target.value || `Text Element ${textElements.findIndex(el => el.id === id) + 1}`;
            }
            
            // Real-time update when text changes
            drawAllText();
        }
    });
    
    alignInput.addEventListener('change', function(e) {
        const id = parseInt(e.target.dataset.id);
        const element = textElements.find(el => el.id === id);
        if (element) {
            element.alignment = e.target.value;
            // Real-time update when alignment changes
            drawAllText();
        }
    });
    
    // Add event listener for font changes
    fontSelect.addEventListener('change', function(e) {
        const id = parseInt(e.target.dataset.id);
        const element = textElements.find(el => el.id === id);
        if (element) {
            // Store the filename
            element.fontFile = e.target.value;
            
            // Find the font object
            const selectedFont = availableFonts.find(font => font.filename === element.fontFile);
            
            // Update the font size based on the font's default size
            const defaultSize = getDefaultFontSize(element.fontFile);
            element.fontSize = defaultSize;
            
            // Update the font size input field
            const fontSizeElement = document.getElementById(`font-size-${id}`);
            if (fontSizeElement) {
                fontSizeElement.value = defaultSize;
            }
            
            // Load this font if needed
            loadFontForTextElement(id, selectedFont);
        }
    });
    
    // Add event listener for font size changes
    fontSizeElement.addEventListener('input', function(e) {
        const id = parseInt(e.target.dataset.id);
        const element = textElements.find(el => el.id === id);
        if (element) {
            element.fontSize = parseInt(e.target.value);
            // Real-time update when font size changes
            drawAllText();
        }
    });
    
    deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent triggering the header click
        const id = parseInt(this.dataset.id);
        deleteTextElement(id);
    });
    
    // Add event listeners for direction buttons with continuous movement
    let moveInterval = null;
    const moveDelay = 100; // milliseconds between movements
    
    function startContinuousMove(id, direction) {
        // Clear any existing interval first
        if (moveInterval) clearInterval(moveInterval);
        
        // Move once immediately
        moveTextElement(id, direction);
        
        // Set up interval for continuous movement
        moveInterval = setInterval(() => {
            moveTextElement(id, direction);
        }, moveDelay);
    }
    
    function stopContinuousMove() {
        if (moveInterval) {
            clearInterval(moveInterval);
            moveInterval = null;
        }
    }
    
    directionBtns.forEach(btn => {
        // Start moving on mousedown
        btn.addEventListener('mousedown', function(e) {
            const id = parseInt(this.dataset.id);
            const direction = this.dataset.direction;
            startContinuousMove(id, direction);
        });
        
        // Also start moving on touchstart (for mobile)
        btn.addEventListener('touchstart', function(e) {
            const id = parseInt(this.dataset.id);
            const direction = this.dataset.direction;
            startContinuousMove(id, direction);
        });
        
        // Stop moving on mouseup, mouseleave, and touchend
        btn.addEventListener('mouseup', stopContinuousMove);
        btn.addEventListener('mouseleave', stopContinuousMove);
        btn.addEventListener('touchend', stopContinuousMove);
    });
    
    // Add collapse/expand functionality
    header.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-element-btn')) return;
        
        const id = parseInt(this.dataset.id);
        const element = textElements.find(el => el.id === id);
        const content = this.nextElementSibling;
        const indicator = this.querySelector('.collapse-indicator');
        
        if (element) {
            element.collapsed = !element.collapsed;
            content.classList.toggle('collapsed', element.collapsed);
            indicator.textContent = element.collapsed ? '►' : '▼';
        }
    });
    
    // Focus the text input
    textInput.focus();
    
    // Load the element's specific font
    const selectedFont = availableFonts.find(font => font.filename === textElement.fontFile);
    if (selectedFont) {
        loadFontForTextElement(elementId, selectedFont);
    }
}

// Function to delete a text element
function deleteTextElement(id) {
    // Remove from array
    textElements = textElements.filter(el => el.id !== id);
    
    // Remove from DOM
    const element = document.getElementById(`text-element-${id}`);
    if (element) {
        element.remove();
    }
    
    // Clear grid and redraw remaining text elements
    clearGrid();
    drawAllText();
}

// Function to draw all text elements
function drawAllText() {
    if (textElements.length === 0) {
        return;
    }
    
    // Clear grid first
    clearGrid();
    
    // Use canvas to render text and get pixel data
    const gridWidth = parseInt(gridWidthInput.value);
    const gridHeight = parseInt(gridHeightInput.value);
    
    // Set canvas size to match grid dimensions
    offscreenCanvas.width = gridWidth;
    offscreenCanvas.height = gridHeight;
    
    // Clear canvas
    offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    
    // Draw each text element to the canvas
    textElements.forEach(element => {
        if (!element.text) return; // Skip empty text
        
        // Set font and text properties
        offscreenCtx.fillStyle = 'black';
        offscreenCtx.font = `${element.fontSize}px ${element.fontName || currentBitmapFont}`;
        offscreenCtx.textBaseline = 'top';
        offscreenCtx.textAlign = element.alignment;
        
        // Calculate x position based on alignment
        let xPos = element.x;
        if (element.alignment === 'center') {
            // No adjustment needed for center alignment
        } else if (element.alignment === 'right') {
            // No adjustment needed for right alignment
        }
        
        // Draw the text at its position
        offscreenCtx.fillText(element.text, xPos, element.y);
    });
    
    // Get image data
    const imageData = offscreenCtx.getImageData(0, 0, gridWidth, gridHeight);
    const pixels = imageData.data;
    
    // Draw pixels to grid with a moderate threshold
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            // Calculate index in pixel array (4 values per pixel: R,G,B,A)
            const index = (y * gridWidth + x) * 4;
            
            // Use a moderate threshold that worked well in earlier versions
            if (pixels[index + 3] > 50) {
                if (grid[y] && grid[y][x]) {
                    const cell = grid[y][x];
                    cell.classList.add('filled');
                    cell.style.backgroundColor = drawColorInput.value;
                }
            }
        }
    }
}

// Function to initialize fonts
function initializeFonts() {
    // Sort fonts alphabetically by displayName (initial sort)
    availableFonts.sort((a, b) => a.displayName.localeCompare(b.displayName));
    
    // Load the first font as default
    if (availableFonts.length > 0) {
        loadFontFromFolder(availableFonts[0].filename);
    }
}

// Attach event listeners
createGridBtn.addEventListener('click', createGrid);
clearGridBtn.addEventListener('click', clearGrid);
toggleCrosshairBtn.addEventListener('click', toggleCrosshair);
toggleHoopBtn.addEventListener('click', toggleHoop);
toggleTextModeBtn.addEventListener('click', toggleTextMode);

if (addTextElementBtn) {
    addTextElementBtn.addEventListener('click', function() {
        console.log("Button clicked");
        addTextElement();
    });
    console.log("Attached event listener to Add Text Element button");
} else {
    console.error("Add Text Element button not found");
}

if (drawAllTextBtn) {
    drawAllTextBtn.addEventListener('click', drawAllText);
} else {
    console.error("Draw All Text button not found");
}

// Initialize fonts and setup
preloadFonts();
initializeFonts();

// Create initial grid and turn on crosshair
createGrid();
updateCrosshair();

// Enable text mode by default
// Set a small timeout to ensure fonts are loaded before enabling text mode
setTimeout(() => {
    toggleTextMode();
    // Add the first text element automatically
    if (textElements.length === 0) {
        addTextElement();
    }
}, 500);
});// Wait for the document to be fully loaded