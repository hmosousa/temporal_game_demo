document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const gameBoard = document.getElementById('game-board');
    const entities = gameData.ordered_entities.flatMap(entity => [`s ${entity}`, `e ${entity}`]);
    const resetButton = document.getElementById('reset-button');

    // Extract entity text from context
    const entityTexts = {};
    const contextElement = document.getElementById('context');
    const entitySpans = contextElement.querySelectorAll('.entity');
    entitySpans.forEach(span => {
        const entityId = span.className.split(' ')[1];
        entityTexts[`s ${entityId}`] = `s ${span.textContent}`;
        entityTexts[`e ${entityId}`] = `e ${span.textContent}`;
    });

    // Set up game board layout
    gameBoard.style.display = 'grid';
    gameBoard.style.gridTemplateColumns = `auto repeat(${entities.length - 2}, 1fr)`;

    // Add rows to the game board
    entities.slice(2).forEach((rowEntity, rowIndex) => {
        // Add row header
        gameBoard.appendChild(createCell(entityTexts[rowEntity] || rowEntity, 'board-header row-header'));

        const i = rowIndex + 1; // row index starting at 1
        const cellsToAdd = i % 2 === 1 ? i + 1 : i; // odd rows: i+1, even rows: i

        // Add cells
        entities.slice(0, -2).forEach((colEntity, colIndex) => {
            if (colIndex < cellsToAdd) {
                const cell = createCell('', 'board-cell');
                cell.addEventListener('dragover', allowDrop);
                cell.addEventListener('drop', drop);
                cell.addEventListener('dblclick', emptyCell);
                gameBoard.appendChild(cell);
            } else {
                gameBoard.appendChild(createCell('', 'empty-cell'));
            }
        });
    });

    // Add column headers at the bottom of the game board
    gameBoard.appendChild(createCell('', 'empty-cell'));
    entities.slice(0, -2).forEach(entity => {
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