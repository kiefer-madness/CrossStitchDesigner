document.addEventListener('DOMContentLoaded', function() {
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
    const toggleTextModeBtn = document.getElementById('toggleTextMode');
    const textInputContainer = document.getElementById('textInputContainer');
    const textInput = document.getElementById('textInput');
    const drawTextBtn = document.getElementById('drawTextBtn');
    
    // Application state
    let grid = [];
    let isDragging = false;
    let isCrosshairVisible = false;
    let currentBitmapFont = null;
    
    // Initialize
    createGridBtn.addEventListener('click', createGrid);
    clearGridBtn.addEventListener('click', clearGrid);
    toggleCrosshairBtn.addEventListener('click', toggleCrosshair);
    fontFileInput.addEventListener('change', loadBitmapFont);
    toggleTextModeBtn.addEventListener('click', toggleTextMode);
    drawTextBtn.addEventListener('click', drawText);
    
    // Create initial grid
    createGrid();
    
    // Functions
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
    }
    
    function toggleCellFill(cell) {
        if (!cell.classList.contains('filled')) {
            cell.classList.add('filled');
            cell.style.backgroundColor = drawColorInput.value;
        } else {
            cell.classList.remove('filled');
            cell.style.backgroundColor = '';
        }
    }
    
    function clearGrid() {
        const cells = document.querySelectorAll('.cell.filled');
        cells.forEach(cell => {
            cell.classList.remove('filled');
            cell.style.backgroundColor = '';
        });
    }
    
    function toggleCrosshair() {
        isCrosshairVisible = !isCrosshairVisible;
        updateCrosshair();
    }
    
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
    
    function loadBitmapFont(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                // For this example, assume a simple JSON format for the bitmap font
                // In a production app, you'd want to support multiple formats (.fnt, .bdf, etc.)
                const fontData = JSON.parse(e.target.result);
                currentBitmapFont = fontData;
                alert('Bitmap font loaded successfully!');
                toggleTextModeBtn.disabled = false;
            } catch (error) {
                alert('Error loading bitmap font: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
    
    function toggleTextMode() {
        if (currentBitmapFont) {
            textInputContainer.style.display = textInputContainer.style.display === 'none' || !textInputContainer.style.display ? 'block' : 'none';
        } else {
            alert('Please load a bitmap font first');
        }
    }
    
    function drawText() {
        if (!currentBitmapFont) {
            alert('Please load a bitmap font first');
            return;
        }
        
        const text = textInput.value;
        if (!text) {
            alert('Please enter some text to draw');
            return;
        }
        
        // This is a placeholder implementation
        // In a real app, you would parse the bitmap font file and render the text
        // For this example, let's just show how it might work with a simple mock
        
        // Mock font data (you'd get this from the loaded font file)
        const mockFont = {
            'A': [
                [0,1,0],
                [1,0,1],
                [1,1,1],
                [1,0,1],
                [1,0,1]
            ],
            'B': [
                [1,1,0],
                [1,0,1],
                [1,1,0],
                [1,0,1],
                [1,1,0]
            ],
            // Add more characters as needed
        };
        
        // Starting position
        let posX = 1;
        let posY = 1;
        
        // Clear grid first
        clearGrid();
        
        // Draw each character
        for (let i = 0; i < text.length; i++) {
            const char = text[i].toUpperCase();
            if (mockFont[char]) {
                drawCharacter(mockFont[char], posX, posY);
                posX += mockFont[char][0].length + 1; // Add space between characters
            } else {
                posX += 3; // Space for unknown characters
            }
        }
    }
    
    function drawCharacter(charData, startX, startY) {
        for (let y = 0; y < charData.length; y++) {
            for (let x = 0; x < charData[y].length; x++) {
                if (charData[y][x] === 1) {
                    const gridX = startX + x;
                    const gridY = startY + y;
                    
                    // Check if the position is within grid boundaries
                    if (gridY < grid.length && gridX < grid[0].length) {
                        const cell = grid[gridY][gridX];
                        cell.classList.add('filled');
                        cell.style.backgroundColor = drawColorInput.value;
                    }
                }
            }
        }
    }
});