import { _decorator, Component, Node, Color,Graphics } from 'cc';
const { ccclass, property } = _decorator;

const OPACITY = 50;

const COLOR = {
    OBSTACLE: new Color(255, 0, 0, OPACITY),
    SPAWNER: new Color(0, 0, 255, OPACITY),
    STOP_POINT: new Color(255, 255, 0, OPACITY),
}

@ccclass('GridView9902')
export class GridView9902 extends Component {
    @property(Graphics)
    gridGraphic: Graphics = null;
    @property(Graphics)
    pathGraphic: Graphics = null;
    @property(Graphics)
    obstacleGraphics: Graphics = null;
    @property(Graphics)
    viewportGraphics: Graphics = null;
    @property(Node)
    labelHolder: Node = null;

    _map: any = null;
    _mapConfig: any = null;

    onLoad() {
        this.node.on("SET_MAP", this.setMap, this);

        this.node.on("SHOW_GRID", this.showGrid, this);
        this.node.on("SHOW_OBJECTS", this.showObjects, this);
        this.node.on("SHOW_PATH", this.showPath, this);

        this.node.on("DRAW_OBSTACLES", this.drawObstacles, this);
        this.node.on("DRAW_SPAWNERS", this.drawSpawner, this);
        this.node.on("DRAW_STOP_POINTS", this.drawStopPoints, this);
    }

    setMap(map) {
        this._map = map;
        this._mapConfig = this._map.getConfig();
        this._renderGrid();
    }
    showGrid(isShow){
        this.gridGraphic.node.active = isShow;
    }
    showObjects(isShow){
        this.obstacleGraphics.node.active = isShow;
    }
    showPath(isShow){
        this.pathGraphic.node.active = isShow;
    }

    _clearGraphics(){
        this.gridGraphic.clear();
        this.obstacleGraphics.clear();
        this.pathGraphic.clear();
        this.viewportGraphics.clear();
    }

    _renderBlock(gridOrX, Y, graphics, color) {
        let X = gridOrX;
        if (typeof gridOrX === "object") {
            X = gridOrX.X;
            Y = gridOrX.Y;
        }
        graphics.fillColor = color;
        const position = this._map.gridCenterToPosition(X, Y);
        const { gridWidth, gridHeight } = this._map;
        graphics.moveTo(position.x - gridWidth / 2, position.y);
        graphics.lineTo(position.x, position.y + gridHeight / 2);
        graphics.lineTo(position.x + gridWidth / 2, position.y);
        graphics.lineTo(position.x, position.y - gridHeight / 2);
        graphics.fill();
    }
    
    drawLine(p1, p2, lineWidth = 2, color = new Color(0, 255, 255, 20)) {
        this.pathGraphic.lineWidth = lineWidth;
        this.pathGraphic.strokeColor = color;
        let pos1 = this._map.gridCenterToPosition(p1.X, p1.Y);
        let pos2 = this._map.gridCenterToPosition(p2.X, p2.Y);
        this.pathGraphic.moveTo(pos1.x, pos1.y);
        this.pathGraphic.lineTo(pos2.x, pos2.y);
        this.pathGraphic.stroke();
    }
    _renderGrid() {
        this._clearGraphics();
        let { obstacles, spawners } = this._mapConfig;
        this.gridGraphic.clear();
        this._drawViewPort(720, 640)
        this._drawGridLines();
        // this._drawObstacles(obstacles);
        // this._drawSpawner(spawners);
    }
    _drawViewPort(screenWidth, screenHeight) {
        this.viewportGraphics.lineWidth = 2;
        this.viewportGraphics.strokeColor.fromHEX('#00ff00');
        this.viewportGraphics.rect(-screenWidth / 2, -screenHeight / 2, screenWidth, screenHeight);
        this.viewportGraphics.stroke();
    }
    _drawGridLines() {
        let { gridSizeX, gridSizeY, gridWidth, gridHeight, startX, startY } = this._mapConfig;
        // gridSizeX /= 3, gridSizeY /= 3, gridWidth *= 3, gridHeight *= 3;
        this.gridGraphic.lineWidth = 2;
        this.gridGraphic.strokeColor.fromHEX('#cd0000');
        for (let col = 0; col <= gridSizeX; col++) {
            let x = startX + col * gridWidth / 2;
            let y = startY - col * gridHeight / 2;
            this.gridGraphic.moveTo(x, y);
            this.gridGraphic.lineTo(x - gridWidth / 2 * gridSizeY, y - gridHeight / 2 * gridSizeY);
        }
        for (let row = 0; row <= gridSizeY; row++) {
            let x = startX - row * gridWidth / 2;
            let y = startY - row * gridHeight / 2;
            this.gridGraphic.moveTo(x, y);
            this.gridGraphic.lineTo(x + gridWidth / 2 * gridSizeX, y - gridHeight / 2 * gridSizeX);
        }
        this.gridGraphic.stroke();
    }

    drawObstacles(obstacles) {
        if (!obstacles) return;
        for (let id in obstacles) {
            const { X, Y } = this._map.idToGrid(id);
            this._renderBlock(X, Y, this.obstacleGraphics, COLOR.OBSTACLE);
        }
    }

    drawSpawner(spawners) {
        if (!spawners) return;
        Object.keys(spawners).forEach(id => {
            const { X, Y } = this._map.idToGrid(id);
            this._renderBlock(X, Y, this.obstacleGraphics, COLOR.SPAWNER);
        });
    }

    drawStopPoints(stopPoints) {
        if (!stopPoints) return;
        stopPoints.forEach(id => {
            const { X, Y } = this._map.idToGrid(id);
            for (let x = X - 1; x <= X + 1; x++) {
                for (let y = Y - 1; y <= Y + 1; y++) {
                    this._renderBlock(x, y, this.obstacleGraphics, COLOR.STOP_POINT);
                }
            }
        });
    }
}

