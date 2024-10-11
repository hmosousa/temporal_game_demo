document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const gameBoard = document.getElementById('game-board');
    const entities = gameData.ordered_entities.flatMap(entity => [`s ${entity}`, `e ${entity}`]);
    const resetButton = document.getElementById('reset-button');
    const solveButton = document.getElementById('solve-button');

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

    // Set up solve button functionality
    solveButton.addEventListener('click', solveBoard);

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
        computeTemporalClosure();
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

// Updated function to get the index map
function getIdxMap(nEntities) {
    const n = nEntities - 1;
    const maxId = Math.floor(4 * ((n * n + n) / 2));
    let row = 0;
    let col = 0;
    let nItems = 2;
    const idxMap = {};

    for (let idx = 0; idx < maxId; idx++) {
        if (col >= nItems) {
            row++;
            col = 0;

            if (row % 2 === 0) {
                nItems += 2;
            }
        }

        idxMap[idx] = [row, col];
        col++;
    }

    return idxMap;
}

// Update the getCurrentAnnotation function
function getCurrentAnnotation() {
    const cells = document.querySelectorAll('.board-cell');
    const timeline = [];
    const entities = gameData.ordered_entities;
    const idxMap = getIdxMap(entities.length);

    cells.forEach((cell, index) => {
        if (cell.textContent) {
            const [row, col] = idxMap[index];
            timeline.push({
                relation: cell.textContent,
                source: `${row % 2 === 0 ? 'start' : 'end'} ${entities[Math.floor((row + 2) / 2)]}`,
                target: `${col % 2 === 0 ? 'start' : 'end'} ${entities[Math.floor((col) / 2)]}`
            });
        }
    });

    return timeline;
}

// Add this function to send the annotation and update the board
function computeTemporalClosure() {
    const currentAnnotation = getCurrentAnnotation();

    fetch('/api/temporal_closure', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timeline: currentAnnotation }),
    })
        .then(response => response.json())
        .then(data => {
            updateBoardWithClosure(data.timeline);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

// Update this function to update the board with the computed closure
function updateBoardWithClosure(timeline) {
    const cells = document.querySelectorAll('.board-cell');
    const entities = gameData.ordered_entities;
    const idxMap = getIdxMap(entities.length);

    timeline.forEach(item => {
        const sourceIndex = entities.indexOf(item.source.split(' ')[1]);
        const targetIndex = entities.indexOf(item.target.split(' ')[1]);
        const sourceType = item.source.split(' ')[0];
        const targetType = item.target.split(' ')[0];

        let rowIndex = (sourceIndex - 1) * 2 + (sourceType === 'end' ? 1 : 0);
        let colIndex = targetIndex * 2 + (targetType === 'end' ? 1 : 0);

        // Check if the (rowIndex, colIndex) pair exists in idxMap
        let cellIndex = Object.keys(idxMap).find(key =>
            idxMap[key][0] === rowIndex && idxMap[key][1] === colIndex
        );

        // If not found, invert the relation
        if (cellIndex === undefined) {

            let rowIndex = (targetIndex - 1) * 2 + (targetType === 'end' ? 1 : 0);
            let colIndex = sourceIndex * 2 + (sourceType === 'end' ? 1 : 0);

            cellIndex = Object.keys(idxMap).find(key =>
                idxMap[key][0] === rowIndex && idxMap[key][1] === colIndex
            );

            // Invert the relation
            item.relation = invertRelation(item.relation);
        }

        if (cellIndex !== undefined) {
            cells[cellIndex].textContent = item.relation;
        }
    });
}

// Add this helper function to invert relations
function invertRelation(relation) {
    const inversionMap = {
        '<': '>',
        '>': '<',
        '=': '=',
        '-': '-'
    };
    return inversionMap[relation] || relation;
}

// Add this function to solve the board
function solveBoard() {
    fetch('/api/data')
        .then(response => response.json())
        .then(data => {
            const timeline = data.timeline;
            const entities = data.ordered_entities;
            const idxMap = getIdxMap(entities.length);
            const cells = document.querySelectorAll('.board-cell');

            timeline.forEach(item => {
                const sourceIndex = entities.indexOf(item.source.split(' ')[1]);
                const targetIndex = entities.indexOf(item.target.split(' ')[1]);
                const sourceType = item.source.split(' ')[0];
                const targetType = item.target.split(' ')[0];

                let rowIndex = (sourceIndex - 1) * 2 + (sourceType === 'end' ? 1 : 0);
                let colIndex = targetIndex * 2 + (targetType === 'end' ? 1 : 0);

                let cellIndex = Object.keys(idxMap).find(key =>
                    idxMap[key][0] === rowIndex && idxMap[key][1] === colIndex
                );

                if (cellIndex !== undefined) {
                    cells[cellIndex].textContent = item.relation;
                }
            });

            computeTemporalClosure(); // Compute closure after solving
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}