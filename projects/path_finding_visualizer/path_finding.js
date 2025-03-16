let gridSize = 30;
let grid = [];
let startPoint = null;
let endPoint = null;
let isDrawing = false;
let selectedMode = "start"; // Default mode: Draw walls
let isRunning = false;
let stopSearch = false;

const generateGrid = () => {
    gridSize = parseInt(document.getElementById("grid-size").value);
    const gridContainer = document.getElementById("grid-container");
    gridContainer.innerHTML = "";
    gridContainer.style.gridTemplateColumns = `repeat(${gridSize}, 30px)`;

    grid = [];
    for (let row = 0; row < gridSize; row++) {
        let rowArr = [];
        for (let col = 0; col < gridSize; col++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener("mousedown", () => startDrawing(row, col));
            cell.addEventListener("mouseenter", () => drawOrErase(row, col));
            cell.addEventListener("mouseup", stopDrawing);
            gridContainer.appendChild(cell);
            rowArr.push("");
        }
        grid.push(rowArr);
    }

    document.addEventListener("mouseup", stopDrawing); // Stop drawing when mouse is released
};

const setMode = (mode) => {
    selectedMode = mode;

    // Highlight the active mode button
    document.querySelectorAll(".mode-btn").forEach(btn => btn.classList.remove("active"));
    document.getElementById(`mode-${mode}`).classList.add("active");
};

const startDrawing = (row, col) => {
    isDrawing = true;
    handleCellAction(row, col);
};

const drawOrErase = (row, col) => {
    if (isDrawing) {
        handleCellAction(row, col);
    }
};

const stopDrawing = () => {
    isDrawing = false;
};

const handleCellAction = (row, col) => {
    const cell = document.querySelector(`[data-row='${row}'][data-col='${col}']`);

    if (selectedMode === "start") {
        // Clear previous start position in the grid
        if (startPoint) {
            const oldCell = document.querySelector(`[data-row='${startPoint.row}'][data-col='${startPoint.col}']`);
            oldCell.classList.remove("start");
            grid[startPoint.row][startPoint.col] = ""; // Clear old position
        }

        startPoint = { row, col };
        cell.classList.add("start");
        grid[row][col] = "S"; // Mark new position

    } else if (selectedMode === "end") {
        // Clear previous end position in the grid
        if (endPoint) {
            const oldCell = document.querySelector(`[data-row='${endPoint.row}'][data-col='${endPoint.col}']`);
            oldCell.classList.remove("end");
            grid[endPoint.row][endPoint.col] = ""; // Clear old position
        }

        endPoint = { row, col };
        cell.classList.add("end");
        grid[row][col] = "E"; // Mark new position

    } else if (selectedMode === "wall") {
        if (grid[row][col] === "") {
            cell.classList.add("wall");
            grid[row][col] = "W";
        }

    } else if (selectedMode === "erase") {
        if (grid[row][col] !== "") {
            cell.classList.remove("start", "end", "wall");
            grid[row][col] = ""; // Clear grid position
            if (startPoint && startPoint.row === row && startPoint.col === col) startPoint = null;
            if (endPoint && endPoint.row === row && endPoint.col === col) endPoint = null;
        }
    }
};

const clearGrid = () => {
    document.querySelectorAll(".cell").forEach(cell => {
        cell.classList.remove("wall");
        const row = cell.dataset.row;
        const col = cell.dataset.col;
        if (grid[row][col] !== "S" && grid[row][col] !== "E") {
            grid[row][col] = "";
        }
    });
};

const resetGrid = () => {
    startPoint = null;
    endPoint = null;
    generateGrid();
};

document.getElementById("speed").addEventListener("input", (e) => {
    document.getElementById("speed-value").innerText = e.target.value + "ms";
});

const runAlgorithm = () => {
    const selectedAlgorithm = document.getElementById("algorithm").value;
    if (!startPoint || !endPoint) {
        alert("Set start and end points first!");
        return;
    }
    isRunning = true;

    if (selectedAlgorithm === "bfs") {
        bfs();
    } else if (selectedAlgorithm === "dfs") {
        dfs();
    } else if (selectedAlgorithm === "dijkstra") {
        dijkstra();
    } else if (selectedAlgorithm === "astar") {
        astar();
    }
};

document.addEventListener("DOMContentLoaded", () => {
    let speed = 120 - parseInt(document.getElementById("speed").value);
    document.getElementById("speed-value").innerText = `${speed}ms`;
});

const stopAlgorithm = () => {
    if (isRunning) {
        stopSearch = true;
        document.querySelectorAll(".visited").forEach(cell => cell.classList.remove("visited"));
    }
};

// Stop search when user interacts with grid
document.getElementById("grid-container").addEventListener("mousedown", stopAlgorithm);

function getSpeed() {
    return 120 - parseInt(document.getElementById("speed").value);
};

// A* Algorithm
const astar = async () => {
    if (!startPoint || !endPoint) {
        alert("Set start and end points first!");
        return;
    }

    stopSearch = false;
    const openSet = [];
    const closedSet = new Set();
    const cameFrom = new Map();

    const startNode = { row: startPoint.row, col: startPoint.col, g: 0, h: 0, f: 0 };
    const endNode = { row: endPoint.row, col: endPoint.col };

    openSet.push(startNode);

    const getNeighbors = (node) => {
        const { row, col } = node;
        const neighbors = [];

        const directions = [
            { dr: -1, dc: 0 }, // Up
            { dr: 1, dc: 0 },  // Down
            { dr: 0, dc: -1 }, // Left
            { dr: 0, dc: 1 }   // Right
        ];

        for (const { dr, dc } of directions) {
            const newRow = row + dr;
            const newCol = col + dc;

            if (
                newRow >= 0 && newRow < gridSize &&
                newCol >= 0 && newCol < gridSize &&
                grid[newRow][newCol] !== "W" // Avoid walls
            ) {
                neighbors.push({ row: newRow, col: newCol });
            }
        }

        return neighbors;
    };

    const heuristic = (node) => {
        return Math.abs(node.row - endNode.row) + Math.abs(node.col - endNode.col); // Manhattan Distance
    };

    while (openSet.length > 0) {
        if (stopSearch) {
            console.log("Algorithm stopped by user.");
            return;
        }

        openSet.sort((a, b) => a.f - b.f);
        const currentNode = openSet.shift();
        const key = `${currentNode.row},${currentNode.col}`;

        if (currentNode.row === endNode.row && currentNode.col === endNode.col) {
            await reconstructPath(cameFrom, currentNode, getSpeed());
            return;
        }

        closedSet.add(key);

        for (const neighbor of getNeighbors(currentNode)) {
            const neighborKey = `${neighbor.row},${neighbor.col}`;

            if (closedSet.has(neighborKey)) continue;

            const gScore = currentNode.g + 1;

            let foundInOpenSet = openSet.find(n => n.row === neighbor.row && n.col === neighbor.col);

            if (!foundInOpenSet || gScore < foundInOpenSet.g) {
                neighbor.g = gScore;
                neighbor.h = heuristic(neighbor);
                neighbor.f = neighbor.g + neighbor.h;
                cameFrom.set(neighborKey, currentNode);

                if (!foundInOpenSet) {
                    openSet.push(neighbor);
                    await visualizeSearch(neighbor.row, neighbor.col, getSpeed());
                }
            }
        }
    }

    alert("No path found!");
};

const visualizeSearch = async (row, col, speed) => {
    if (stopSearch) return;

    const cell = document.querySelector(`[data-row='${row}'][data-col='${col}']`);
    if (grid[row][col] !== "S" && grid[row][col] !== "E") {
        cell.classList.add("visited");
        await new Promise(resolve => setTimeout(resolve, speed));
    }
};

const reconstructPath = async (cameFrom, currentNode, speed) => {
    let path = [];
    let key = `${currentNode.row},${currentNode.col}`;

    while (cameFrom.has(key)) {
        path.push(currentNode);
        currentNode = cameFrom.get(key);
        key = `${currentNode.row},${currentNode.col}`;
    }

    path.reverse();

    for (const node of path) {
        if (stopSearch) return;

        if (grid[node.row][node.col] !== "S" && grid[node.row][node.col] !== "E") {
            const cell = document.querySelector(`[data-row='${node.row}'][data-col='${node.col}']`);
            cell.classList.remove("visited");
            cell.classList.add("path");
            await new Promise(resolve => setTimeout(resolve, speed));
        }
    }
    isRunning = false;
};

// BFS Algorithm
const bfs = async () => {
    if (!startPoint || !endPoint) {
        alert("Set start and end points first!");
        return;
    }

    stopSearch = false;
    isRunning = true;
    const queue = [{ row: startPoint.row, col: startPoint.col }];
    const cameFrom = new Map();
    const visited = new Set();
    visited.add(`${startPoint.row},${startPoint.col}`);

    const getNeighbors = (row, col) => {
        return [
            { row: row - 1, col }, // Up
            { row: row + 1, col }, // Down
            { row, col: col - 1 }, // Left
            { row, col: col + 1 }  // Right
        ].filter(({ row, col }) =>
            row >= 0 && row < gridSize &&
            col >= 0 && col < gridSize &&
            grid[row][col] !== "W" && // Avoid walls
            !visited.has(`${row},${col}`)
        );
    };

    while (queue.length > 0) {
        if (stopSearch) {
            console.log("BFS stopped by user.");
            return;
        }

        const { row, col } = queue.shift();
        const key = `${row},${col}`;

        // If we reach the end, reconstruct the path
        if (row === endPoint.row && col === endPoint.col) {
            await reconstructPath(cameFrom, { row, col }, getSpeed());
            return;
        }

        for (const neighbor of getNeighbors(row, col)) {
            const neighborKey = `${neighbor.row},${neighbor.col}`;
            if (!visited.has(neighborKey)) {
                visited.add(neighborKey);
                cameFrom.set(neighborKey, { row, col });
                queue.push(neighbor);
                await visualizeSearch(neighbor.row, neighbor.col, getSpeed());
            }
        }
    }

    alert("No path found!");
};

// DFS Algorithm
const dfs = async () => {
    if (!startPoint || !endPoint) {
        alert("Set start and end points first!");
        return;
    }

    stopSearch = false;
    isRunning = true;
    const stack = [{ row: startPoint.row, col: startPoint.col }];
    const cameFrom = new Map();
    const visited = new Set();
    visited.add(`${startPoint.row},${startPoint.col}`);

    const getNeighbors = (row, col) => {
        return [
            { row: row - 1, col }, // Up
            { row: row + 1, col }, // Down
            { row, col: col - 1 }, // Left
            { row, col: col + 1 }  // Right
        ].filter(({ row, col }) =>
            row >= 0 && row < gridSize &&
            col >= 0 && col < gridSize &&
            grid[row][col] !== "W" && // Avoid walls
            !visited.has(`${row},${col}`)
        );
    };

    while (stack.length > 0) {
        if (stopSearch) {
            console.log("DFS stopped by user.");
            return;
        }

        const { row, col } = stack.pop();
        const key = `${row},${col}`;

        // If we reach the end, reconstruct the path
        if (row === endPoint.row && col === endPoint.col) {
            await reconstructPath(cameFrom, { row, col }, getSpeed());
            return;
        }

        for (const neighbor of getNeighbors(row, col)) {
            const neighborKey = `${neighbor.row},${neighbor.col}`;
            if (!visited.has(neighborKey)) {
                visited.add(neighborKey);
                cameFrom.set(neighborKey, { row, col });
                stack.push(neighbor);
                await visualizeSearch(neighbor.row, neighbor.col, getSpeed());
            }
        }
    }

    alert("No path found!");
};

// Djikstra's Algorithm
const dijkstra = async () => {
    if (!startPoint || !endPoint) {
        alert("Set start and end points first!");
        return;
    }

    stopSearch = false;
    isRunning = true;
    const pq = [{ row: startPoint.row, col: startPoint.col, cost: 0 }]; // Priority Queue
    const cameFrom = new Map();
    const distances = new Map();
    distances.set(`${startPoint.row},${startPoint.col}`, 0);

    const getNeighbors = (row, col) => {
        return [
            { row: row - 1, col }, // Up
            { row: row + 1, col }, // Down
            { row, col: col - 1 }, // Left
            { row, col: col + 1 }  // Right
        ].filter(({ row, col }) =>
            row >= 0 && row < gridSize &&
            col >= 0 && col < gridSize &&
            grid[row][col] !== "W" // Avoid walls
        );
    };

    while (pq.length > 0) {
        if (stopSearch) {
            console.log("Dijkstra stopped by user.");
            return;
        }

        // Sort priority queue by cost (smallest cost first)
        pq.sort((a, b) => a.cost - b.cost);
        const { row, col, cost } = pq.shift();
        const key = `${row},${col}`;

        // If we reach the end, reconstruct the path
        if (row === endPoint.row && col === endPoint.col) {
            await reconstructPath(cameFrom, { row, col }, getSpeed());
            return;
        }

        for (const neighbor of getNeighbors(row, col)) {
            const neighborKey = `${neighbor.row},${neighbor.col}`;
            const newCost = cost + 1; // In an unweighted grid, all moves have cost 1

            if (!distances.has(neighborKey) || newCost < distances.get(neighborKey)) {
                distances.set(neighborKey, newCost);
                cameFrom.set(neighborKey, { row, col });
                pq.push({ row: neighbor.row, col: neighbor.col, cost: newCost });
                await visualizeSearch(neighbor.row, neighbor.col, getSpeed());
            }
        }
    }

    alert("No path found!");
};

// Generate default grid on load
generateGrid();
