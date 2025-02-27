// Wait for the document to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");
    
    // Application state
    let grid = [];
    let isDragging = false;
    let isCrosshairVisible = false;
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
    
    // Function to load bitmap font
    function loadBitmapFont(e) {
        const file = e.target.files[0];
        if (!file) return;
        
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
        
        // Create cells
        for (let y = 0; y < height; y++) {
            grid[y] = [];
            for (let x = 0; x < width; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                
                // Highlight every 5th row/column
                if ((x + 1) % 5 === 0) cell.classList.add('highlight-col');
                if ((y + 1) % 5 === 0) cell.classList.add('highlight-row');
                
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
        
        // Add mouse up event to stop dragging
        document.addEventListener('mouseup', function() {
            isDragging = false;
        });
        
        // Update position input max values based on grid size
        // Update any existing text elements with new grid boundaries
        if (textElements.length > 0) {
            textElements.forEach(element => {
                const xInput = document.getElementById(`x-${element.id}`);
                const yInput = document.getElementById(`y-${element.id}`);
                
                if (xInput) xInput.max = width - 1;
                if (yInput) yInput.max = height - 1;
                
                // Ensure positions are within new grid bounds
                element.x = Math.min(element.x, width - 1);
                element.y = Math.min(element.y, height - 1);
                
                if (xInput) xInput.value = element.x;
                if (yInput) yInput.value = element.y;
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
    
    // Function to add a new text element
    function addTextElement() {
        console.log("Adding new text element");
        
        if (!currentBitmapFont) {
            alert('Please load a font first');
            return;
        }
        
        // Create a unique ID for the element
        const elementId = Date.now();
        
        // Create element data object
        const textElement = {
            id: elementId,
            text: '',
            x: Math.floor(parseInt(gridWidthInput.value) / 2),
            y: Math.floor(parseInt(gridHeightInput.value) / 2),
            alignment: 'center',
            fontSize: parseInt(fontSizeInput.value)
        };
        
        // Add to array
        textElements.push(textElement);
        
        // Create the DOM element
        const element = document.createElement('div');
        element.className = 'text-element';
        element.id = `text-element-${elementId}`;
        
        element.innerHTML = `
            <div class="text-element-header">
                <h4 class="text-element-title">Text Element ${textElements.length}</h4>
                <button class="delete-element-btn" data-id="${elementId}">Delete</button>
            </div>
            <div class="control-group">
                <label for="text-${elementId}">Text:</label>
                <input type="text" id="text-${elementId}" class="text-input-field" data-id="${elementId}" value="">
            </div>
            <div class="position-controls">
                <div class="control-group">
                    <label for="x-${elementId}">X:</label>
                    <input type="number" id="x-${elementId}" class="x-input" min="0" max="${parseInt(gridWidthInput.value) - 1}" value="${textElement.x}" data-id="${elementId}">
                </div>
                <div class="control-group">
                    <label for="y-${elementId}">Y:</label>
                    <input type="number" id="y-${elementId}" class="y-input" min="0" max="${parseInt(gridHeightInput.value) - 1}" value="${textElement.y}" data-id="${elementId}">
                </div>
                <div class="control-group">
                    <label for="align-${elementId}">Align:</label>
                    <select id="align-${elementId}" class="align-input" data-id="${elementId}">
                        <option value="left">Left</option>
                        <option value="center" selected>Center</option>
                        <option value="right">Right</option>
                    </select>
                </div>
            </div>
        `;
        
        // Add to container
        textElementsContainer.appendChild(element);
        
        // Add event listeners for input changes
        const textInput = document.getElementById(`text-${elementId}`);
        const xInput = document.getElementById(`x-${elementId}`);
        const yInput = document.getElementById(`y-${elementId}`);
        const alignInput = document.getElementById(`align-${elementId}`);
        const deleteBtn = element.querySelector('.delete-element-btn');
        
        textInput.addEventListener('input', function(e) {
            const id = parseInt(e.target.dataset.id);
            const element = textElements.find(el => el.id === id);
            if (element) element.text = e.target.value;
        });
        
        xInput.addEventListener('input', function(e) {
            const id = parseInt(e.target.dataset.id);
            const element = textElements.find(el => el.id === id);
            if (element) element.x = parseInt(e.target.value);
        });
        
        yInput.addEventListener('input', function(e) {
            const id = parseInt(e.target.dataset.id);
            const element = textElements.find(el => el.id === id);
            if (element) element.y = parseInt(e.target.value);
        });
        
        alignInput.addEventListener('change', function(e) {
            const id = parseInt(e.target.dataset.id);
            const element = textElements.find(el => el.id === id);
            if (element) element.alignment = e.target.value;
        });
        
        deleteBtn.addEventListener('click', function(e) {
            const id = parseInt(e.target.dataset.id);
            deleteTextElement(id);
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
        
        // Redraw if needed
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
            
            // Draw the text at its position
            offscreenCtx.fillText(element.text, element.x, element.y);
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
    
    // Create initial grid
    createGrid();
});