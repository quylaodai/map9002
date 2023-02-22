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
        const { startX, startY, gridWidth, gridHeight } = this._config;
        const X = Math.floor((x - startX) / gridWidth + (startY - y) / gridHeight);
        const Y = Math.floor((startY - y) / gridHeight - (x - startX) / gridWidth);
        return { X, Y };
    }
    gridToPosition(X, Y) {
        const { startX, startY, gridWidth, gridHeight } = this._config;
        const x = startX + (X - Y) * gridWidth / 2;
        const y = startY - (X + Y) * gridHeight / 2;
        return { x, y };
    }
    gridCenterToPosition(grid, Y) {
        const { startX, startY, gridWidth, gridHeight } = this._config;
        let X = grid;
        if (Y === undefined) {
            X = grid.X;
            Y = grid.Y;
        }
        const x = startX + (X - Y) * gridWidth / 2;
        const y = startY - (X + Y + 1) * gridHeight / 2;
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