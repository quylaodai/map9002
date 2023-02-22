class Map {
    constructor(config) {
        this._config = Object.assign(Object.create(null), config);
        const { gridSizeX, gridSizeY, gridWidth, gridHeight, spawners, obstacles, stopPoints } = config;
        this._config.startX = (gridSizeY - gridSizeX) / 2 * (gridWidth / 2);
        this._config.startY = (gridSizeX + gridSizeY) / 2 * (gridHeight / 2);
        this._config.spawners = spawners || {};
        this._config.obstacles = obstacles || {};
        this._config.stopPoints = stopPoints || [];
    }

    addObstacle(gridId) {
        this._config.obstacles[gridId] = 1;
    }
    addSpawner(gridId) {
        this._config.spawners[gridId] = 0;
    }
    addStopPoint(gridId) {
        this._config.stopPoints.push(gridId);
    }
    getConfig() {
        return this._config;
    }
    clear() {
        this._config.spawners = {};
        this._config.obstacles = {};
        this._config.stopPoints = [];
    }
    positionToGrid(x, y) {
        const X = Math.floor((x - this.startX) / this.gridWidth + (this.startY - y) / this.gridHeight);
        const Y = Math.floor((this.startY - y) / this.gridHeight - (x - this.startX) / this.gridWidth);
        return { X, Y };
    }
    gridToPosition(X, Y) {
        const x = this.startX + (X - Y) * this.gridWidth / 2;
        const y = this.startY - (X + Y) * this.gridHeight / 2;
        return { x, y };
    }
    gridCenterToPosition(grid, Y) {
        let X = grid;
        if (Y === undefined) {
            X = grid.X;
            Y = grid.Y;
        }
        const x = this.startX + (X - Y) * this.gridWidth / 2;
        const y = this.startY - (X + Y + 1) * this.gridHeight / 2;
        return { x, y };
    }
    idToGrid(gridId) {
        const X = gridId % this.gridSizeX;
        const Y = Math.floor(gridId / this.gridSizeX);
        return { X, Y }
    }
    gridToId(grid, Y) {
        let X = grid;
        if (typeof grid === 'object') {
            X = grid.X;
            Y = grid.Y;
        }
        return Y * this.gridSizeX + X;
    }
    isObstacle(point) {
        const gridId = (typeof point === "number") ? point : this.gridToId(point);
        return this._config.obstacles[gridId];
    }
}


module.exports = Map;
module.exports.Map = Map;