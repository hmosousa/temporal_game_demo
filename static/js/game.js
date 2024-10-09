document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const gameBoard = document.getElementById('game-board');
    const entities = gameData.ordered_entities;
    const resetButton = document.getElementById('reset-button');

    // Extract entity text from context
    const entityTexts = {};
    const contextElement = document.getElementById('context');
    const entitySpans = contextElement.querySelectorAll('.entity');
    entitySpans.forEach(span => {
        const entityId = span.className.split(' ')[1];
        entityTexts[entityId] = span.textContent;
    });

    // Set up game board layout
    gameBoard.style.display = 'grid';
    gameBoard.style.gridTemplateColumns = `auto repeat(${entities.length - 1}, 1fr)`;

    // Add rows to the game board
    entities.slice(1).forEach((rowEntity, rowIndex) => {
        // Add row header
        gameBoard.appendChild(createCell(entityTexts[rowEntity] || rowEntity, 'board-header row-header'));

        // Add cells
        entities.slice(0, -1).forEach((colEntity, colIndex) => {
            if (colIndex <= rowIndex) {
                const cell = createCell('', 'board-cell');
                cell.addEventListener('dragover', allowDrop);
                cell.addEventListener('drop', drop);
                cell.addEventListener('dblclick', emptyCell);
                gameBoard.appendChild(cell);
            } else {
                // Add empty cells for upper triangle
                gameBoard.appendChild(createCell('', 'empty-cell'));
            }
        });
    });

    // Add column headers at the bottom of the game board
    gameBoard.appendChild(createCell('', 'empty-cell'));
    entities.slice(0, -1).forEach(entity => {
        gameBoard.appendChild(createCell(`${entityTexts[entity] || entity}`, 'board-header column-header'));
    });

    // Set up reset button functionality
    resetButton.addEventListener('click', resetBoard);

    // Set up drag and drop for relation buttons
    const relationButtons = document.querySelectorAll('.relation-button');
    relationButtons.forEach(button => {
        button.addEventListener('dragstart', drag);
    });
});

// Helper function to create a cell element
function createCell(text, className) {
    const cell = document.createElement('div');
    cell.textContent = text;
    cell.className = className;
    return cell;
}

// Allow dropping of elements
function allowDrop(event) {
    event.preventDefault();
}

// Handle the start of dragging a relation button
function drag(event) {
    event.dataTransfer.setData('text', event.target.dataset.relation);
}

// Handle dropping a relation into a cell
function drop(event) {
    event.preventDefault();
    const relation = event.dataTransfer.getData('text');
    if (event.target.classList.contains('board-cell')) {
        event.target.textContent = relation;
    }
}

// Reset all cells in the game board
function resetBoard() {
    const cells = document.querySelectorAll('.board-cell');
    cells.forEach(cell => {
        cell.textContent = '';
    });
}

// Empty a cell when double-clicked
function emptyCell(event) {
    event.target.classList.contains('board-cell') && (event.target.textContent = '');
}