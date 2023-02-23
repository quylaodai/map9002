class PathGen {
    constructor(map){
        this._map = map;
        this._mapConfig = this._map.getConfig();
        this.grid = null;
        this._initGrid();
    }
    _initGrid(){
        if (this.grid) return;
        const { gridSizeX, gridSizeY } = this._mapConfig;
        this.grid = [];
        const grid = this.grid;
        for (let x = 0; x < gridSizeX; x++) {
            grid[x] = [];
            for (let y = 0; y < gridSizeY; y++) {
                let cell = grid[x][y] = new Cell(x, y);
                let id = this._map.gridToId(x, y);
                cell.canMove = this._map.isCanMove(id);
            }
        }
        for (let x = 0; x < gridSizeX; x++) {
            for (let y = 0; y < gridSizeY; y++) {
                this._updateNeighbors(grid[x][y]);
            }
        }
    }
    _updateNeighbors(cell) {
        const grid = this.grid;
        const x = cell.X;
        const y = cell.Y;
        cell.neighbors = [];
        if (y < grid.length - 1) cell.neighbors.push(grid[x][y + 1]);
        if (y > 0) cell.neighbors.push(grid[x][y - 1]);
        if (x < grid.length - 1) cell.neighbors.push(grid[x + 1][y]);
        if (x > 0) cell.neighbors.push(grid[x - 1][y]);
    }
    findPathAStar(start, end) {
        this._resetCellsInGrid();
        const grid = this.grid;
        start = (typeof start === 'number') ? this._map.idToGrid(start) : start;
        end = (typeof end === 'number') ? this._map.idToGrid(end) : end;
        this.startCell = grid[start.X][start.Y];
        this.endCell = grid[end.X][end.Y];

        const visited = this.visited = [];
        const unVisited = this.unVisited = [this.startCell]; 
        
        while(unVisited.length){
            let currentIndex = 0;
            let currentCell = unVisited[0];
            
            unVisited.forEach((cell, index) => {
                if (cell.totalCost <= currentCell.totalCost && cell.costToEnd < currentCell.costToEnd) {
                    currentCell = cell;
                    currentIndex = index;
                }
            });

            // found best path
            if (currentCell === this.endCell) return this._exportPath(currentCell);

            unVisited.splice(currentIndex, 1); 
            visited.push(currentCell);

            currentCell.neighbors.forEach(neighbor => {
                // check valid
                if (!neighbor.canMove && (neighbor !== this.endCell)) return;
                if (visited.includes(neighbor)) return;
                
                // evaluate 
                let costFromStart = currentCell.costFromStart + 1;
                if (!unVisited.includes(neighbor)) {
                    unVisited.push(neighbor);
                } else if (costFromStart >= neighbor.costFromStart) {
                    return;
                }
    
                neighbor.costFromStart = costFromStart;
                neighbor.costToEnd = this.heuristic(neighbor, end);
                neighbor.totalCost = neighbor.costFromStart + neighbor.costToEnd;
                neighbor.prev = currentCell;
            });
        }
        console.error("not found");
        return [];
    }
    _resetCellsInGrid() {
        const { gridSizeX, gridSizeY } = this._mapConfig;
        const grid = this.grid;
        for (let x = 0; x < gridSizeX; x++) {
            for (let y = 0; y < gridSizeY; y++) {
                let cell = grid[x][y];
                cell.costFromStart = 0;
                cell.costToEnd = 0;
                cell.totalCost = 0;
                cell.prev = null;
            }
        }
    }
    _exportPath(end){
        const path = [];
        let temp = end;
        while (temp.prev) {
            path.push(temp.prev);
            temp = temp.prev;
        }
        return path.map(cell => this._map.gridToId(cell)).reverse();
    }
    heuristic(position0, position1) {
        let d1 = Math.abs(position1.x - position0.x);
        let d2 = Math.abs(position1.y - position0.y);
    
        return d1 + d2;
    }
}

class Cell {
    constructor(X, Y) {
        this.X = X;
        this.Y = Y;
       
        this.costFromStart = 0;
        this.costToEnd = 0;

        this.totalCost = this.costFromStart + this.costToEnd;
        this.neighbors = [];
        this.prev = null;
    }
}

module.exports = {};
module.exports.PathGen = PathGen;