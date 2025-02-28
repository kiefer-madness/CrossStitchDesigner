// Wait for the document to be fully loaded
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
    const fontFileInput = document.getElementById('fontFile');
    const fontSizeInput = document.getElementById('fontSize');
    const toggleTextModeBtn = document.getElementById('toggleTextMode');
    const textInputContainer = document.getElementById('textInputContainer');
    const addTextElementBtn = document.getElementById('addTextElementBtn');
    const textElementsContainer = document.getElementById('textElementsContainer');
    const drawAllTextBtn = document.getElementById('drawAllTextBtn');
    
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
    
    // Function to load bitmap font
    function loadBitmapFont(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Parse filename to extract font size if in format "fontname_size"
        const fileName = file.name;
        if (fileName) {
            const fileNameWithoutExtension = fileName.split('.')[0];
            const parts = fileNameWithoutExtension.split('_');
            
            // If filename has format "name_size" where size is a number
            if (parts.length >= 2 && !isNaN(parts[parts.length-1])) {
                const detectedSize = parseInt(parts[parts.length-1]);
                if (detectedSize >= 8 && detectedSize <= 72) {
                    fontSizeInput.value = detectedSize;
                    console.log(`Font size detected from filename: ${detectedSize}px`);
                }
            }
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                // Create a font face from the TTF data
                const fontFace = new FontFace('CustomFont', e.target.result);
                
                // Add the font to the document
                fontFace.load().then(function(loadedFace) {
                    document.fonts.add(loadedFace);
                    currentBitmapFont = 'CustomFont';
                    alert('Font loaded successfully!');
                    toggleTextModeBtn.disabled = false;
                }).catch(function(error) {
                    alert('Error loading font: ' + error.message);
                });
            } catch (error) {
                alert('Error processing font: ' + error.message);
            }
        };
        reader.readAsArrayBuffer(file);
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
        }
    }
    
    // Function to toggle text mode
    function toggleTextMode() {
        if (currentBitmapFont) {
            textInputContainer.style.display = textInputContainer.style.display === 'none' || !textInputContainer.style.display ? 'block' : 'none';
            
            // If there are no text elements, add one by default
            if (textElements.length === 0) {
                addTextElement();
            }
        } else {
            alert('Please load a font first');
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
        
        // Create element data object
        const textElement = {
            id: elementId,
            text: '',
            x: startPosition.x,
            y: startPosition.y,
            alignment: 'left',
            fontSize: parseInt(fontSizeInput.value),
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
        
        // Add event listeners for input changes
        const textInput = document.getElementById(`text-${elementId}`);
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
        
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent triggering the header click
            const id = parseInt(e.target.dataset.id);
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
                const id = parseInt(e.target.dataset.id);
                const direction = e.target.dataset.direction;
                startContinuousMove(id, direction);
            });
            
            // Also start moving on touchstart (for mobile)
            btn.addEventListener('touchstart', function(e) {
                const id = parseInt(e.target.dataset.id);
                const direction = e.target.dataset.direction;
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
                indicator.classList.toggle('collapsed', element.collapsed);
            }
        });
        
        // Focus the text input
        textInput.focus();
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
        if (!currentBitmapFont || textElements.length === 0) {
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
            offscreenCtx.font = `${element.fontSize}px ${currentBitmapFont}`;
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
    
    // Attach event listeners
    createGridBtn.addEventListener('click', createGrid);
    clearGridBtn.addEventListener('click', clearGrid);
    toggleCrosshairBtn.addEventListener('click', toggleCrosshair);
    toggleHoopBtn.addEventListener('click', toggleHoop);
    fontFileInput.addEventListener('change', loadBitmapFont);
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
    
    // Create initial grid and turn on crosshair
    createGrid();
    updateCrosshair();
});