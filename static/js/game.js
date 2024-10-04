document.addEventListener('DOMContentLoaded', () => {
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

    // Create game board
    gameBoard.style.display = 'grid';
    gameBoard.style.gridTemplateColumns = `auto repeat(${entities.length}, 1fr)`;

    // Add header row
    gameBoard.appendChild(createCell('', 'board-header corner-header'));
    entities.forEach(entity => {
        gameBoard.appendChild(createCell(entityTexts[entity] || entity, 'board-header column-header'));
    });

    // Add rows
    entities.forEach((rowEntity, rowIndex) => {
        // Add row header
        gameBoard.appendChild(createCell(entityTexts[rowEntity] || rowEntity, 'board-header row-header'));

        // Add cells
        entities.forEach((colEntity, colIndex) => {
            if (colIndex < rowIndex) {
                const cell = createCell('', 'board-cell');
                cell.addEventListener('dragover', allowDrop);
                cell.addEventListener('drop', drop);
                cell.addEventListener('dblclick', emptyCell);
                gameBoard.appendChild(cell);
            } else {
                // Add empty cells for diagonal and upper triangle
                gameBoard.appendChild(createCell('', 'empty-cell'));
            }
        });
    });

    // Set up reset button
    resetButton.addEventListener('click', resetBoard);

    // Set up drag and drop for relation buttons
    const relationButtons = document.querySelectorAll('.relation-button');
    relationButtons.forEach(button => {
        button.addEventListener('dragstart', drag);
    });
});

function createCell(text, className) {
    const cell = document.createElement('div');
    cell.textContent = text;
    cell.className = className;
    return cell;
}

function allowDrop(event) {
    event.preventDefault();
}

function drag(event) {
    event.dataTransfer.setData('text', event.target.dataset.relation);
}

function drop(event) {
    event.preventDefault();
    const relation = event.dataTransfer.getData('text');
    if (event.target.classList.contains('board-cell')) {
        event.target.textContent = relation;
    }
}

function resetBoard() {
    const cells = document.querySelectorAll('.board-cell');
    cells.forEach(cell => {
        cell.textContent = '';
    });
}

function emptyCell(event) {
    if (event.target.classList.contains('board-cell')) {
        event.target.textContent = '';
    }
}