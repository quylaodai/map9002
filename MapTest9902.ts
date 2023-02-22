import { _decorator, Component, Node, Graphics, Vec3, Camera, UITransform, Color, Label, tween, JsonAsset, macro } from 'cc';
import mapModule from "./map/Map9902.js";

const { ccclass, property } = _decorator;
const { Map } = mapModule;

enum ActionType {
    NONE = 0,
    CREATE_OBSTACLE = 1,
    CREATE_SPAWNER = 2,
    ADD_STOP_POINT = 3,
    GEN_PATH = 4,
    FIND_SHORTED_PATH = 5
}
const OPACITY = 50;
const COLOR = {
    OBSTACLE: new Color(255, 0, 0, OPACITY),
    SPAWNER: new Color(0, 0, 255, OPACITY),
    STOP_POINT: new Color(255, 255, 0, OPACITY),
}
@ccclass('MapView')
export class MapView extends Component {
    @property(Node)
    eventManager: Node = null;
    @property({ type: Camera })
    camera = null;
    @property(Graphics)
    gridGraphic: Graphics = null;
    @property(Graphics)
    pathGraphic = null;
    @property(Graphics)
    obstacleGraphics = null;
    @property(Node)
    labelHolder: Node = null;
    @property(JsonAsset)
    mapConfigs: JsonAsset[] = [];
    @property(JsonAsset)
    fishInfo: JsonAsset = null;

    _hoverLabel: Label = null;
    mapData: any = null;
    _map: any = null;
    _mapConfig: any = null;

    _labels: any = {};
    _currentLabel: Node = null;

    _allPaths: any[] = [];
    _action = ActionType.NONE;
    _spawnerIds: number[] = [];
    _fishInfo: any = null;
    _p1: any = null;
    _p2: any = null;
    _points: any[] = [];
    isShowGraphics: boolean = true;
    _tweenCreateFishes: any = null;

    onLoad() {
        let mapConfig: any = { gridSizeX: 42, gridSizeY: 42, gridWidth: 72, gridHeight: 36 };
        if (this.mapConfigs) mapConfig = this.mapConfigs[0].json;
        if (this.fishInfo) this._fishInfo = this.fishInfo.json;
        this._map = new Map(mapConfig, this._fishInfo);
        this._hoverLabel = this._createLabel(0, 0);
        this.node.on(Node.EventType.MOUSE_DOWN, this.onMouseDown, this, false);
        this.node.on(Node.EventType.MOUSE_MOVE, this.onMouseMove, this, false);
        window['test'] = this;
        // map
        this.eventManager.on("CHANGE_MAP", this.changeMap, this);
        this.eventManager.on("ADD_OBSTACLE", this.addObstacles, this);
        this.eventManager.on("ADD_SPAWNER", this.addSpawner, this);
        this.eventManager.on("ADD_STOP_POINTS", this.addStopPoint, this);
        this.eventManager.on("CLEAR_MAP", this.clearMap, this);
        this.eventManager.on("EXPORT_MAP", this.exportMap, this);
        // fish
        this.eventManager.on("CREATE_FISHES", this.genFishes, this);
        this.eventManager.on("CLEAR_FISHES", this.clearFishes, this);
        // view
        this.eventManager.on("GEN_PATH", this.genPath, this);
        this.eventManager.on("FIND_SHORTED_PATH", this.findShortedPath, this);
        this.eventManager.on("CLEAR_PATH", this.clearPath, this);
    }

    start() {
        this._renderGrid();
        this.eventManager.emit("SET_MAP", this._map);
    }
    changeMap(id) {
        this.clearMap();
        let mapConfig = this.mapConfigs[id - 1].json;
        this._map = new Map(mapConfig, this._fishInfo);
        this.eventManager.emit("SET_MAP", this._map);
        this._renderGrid();
    }
    clearMap() {
        this._map.clear();
        this.obstacleGraphics.clear();
    }

    _renderGrid() {
        this._mapConfig = this._map.getConfig();
        let { obstacles, spawners, stopPoints } = this._mapConfig;
        this.gridGraphic.clear();
        this._drawViewPort(720, 720)
        this._drawGridLines();
        this._drawObstacles(obstacles);
        this._drawSpawner(spawners);
        // this._drawStopPoints(stopPoints);
        this._action = ActionType.NONE;
    }
    _drawViewPort(screenWidth, screenHeight) {
        this.gridGraphic.lineWidth = 4;
        this.gridGraphic.strokeColor = new Color(0,255,0,255);
        this.gridGraphic.rect(-screenWidth / 2, -screenHeight / 2, screenWidth, screenHeight);
        this.gridGraphic.stroke();
    }

    _drawGridLines() {
        let { gridSizeX, gridSizeY, gridWidth, gridHeight, startX, startY } = this._mapConfig;
        // gridSizeX /= 3, gridSizeY /= 3, gridWidth *= 3, gridHeight *= 3;
        this.gridGraphic.lineWidth = 1;
        this.gridGraphic.strokeColor.fromHEX('#ffffff');
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

    _drawObstacles(obstacles) {
        if (!obstacles) return;
        this._action = ActionType.CREATE_OBSTACLE;
        for (let id in obstacles) {
            const { X, Y } = this._map.idToGrid(id);
            this.renderBlock(X, Y);
        }
    }

    _drawSpawner(spawners) {
        if (!spawners) return;
        this._action = ActionType.CREATE_SPAWNER;
        Object.keys(spawners).forEach(id => {
            const { X, Y } = this._map.idToGrid(id);
            for (let x = X - 1; x <= X + 1; x++) {
                for (let y = Y - 1; y <= Y + 1; y++) {
                    this.renderBlock(x, y);
                }
            }
        });
    }

    _drawStopPoints(stopPoints) {
        if (!stopPoints) return;
        this._action = ActionType.ADD_STOP_POINT;
        stopPoints.forEach(id => {
            const { X, Y } = this._map.idToGrid(id);
            for (let x = X - 1; x <= X + 1; x++) {
                for (let y = Y - 1; y <= Y + 1; y++) {
                    this.renderBlock(x, y);
                }
            }
        });
    }

    _createLabel(X: number, Y: number): Label {
        const labelNode = new Node();
        this.labelHolder.addChild(labelNode);
        labelNode.active = true;
        labelNode._uiProps.colorDirty = true;
        const label = labelNode.addComponent(Label);
        label.string = X + "-" + Y;
        const pos = this._map.gridCenterToPosition(X, Y);
        labelNode.setPosition(pos.x, pos.y);
        label.fontSize = 16;
        label.color = new Color(255, 255, 255, 255);
        return label;
    }

    onMouseMove(ev) {
        const location = ev.getLocation(new Vec3());
        const worldPos = this.camera.screenToWorld(location, new Vec3());
        const localPos = this.node.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
        const { X, Y } = this._map.positionToGrid(localPos.x, localPos.y);
        if (X < 0 || Y < 0 || X > 30 || Y > 30) return;
        this._hoverLabel.string = X + "-" + Y;
        const pos = this._map.gridCenterToPosition(X, Y);
        this._hoverLabel.node.setPosition(pos.x, pos.y);
    }

    onMouseDown(ev) {
        const location = ev.getLocation(new Vec3());
        const worldPos = this.camera.screenToWorld(location, new Vec3());
        const localPos = this.node.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
        const gridPos = this._map.positionToGrid(localPos.x, localPos.y);

        switch (this._action) {
            case ActionType.NONE: return;
            case ActionType.CREATE_OBSTACLE: return this._addObstacles(gridPos);
            case ActionType.CREATE_SPAWNER: return this._addSpawner(gridPos);
            case ActionType.ADD_STOP_POINT: return this._addStopPoint(gridPos);
            case ActionType.GEN_PATH: return this._genPath(gridPos);
            case ActionType.FIND_SHORTED_PATH: return this._findShortedPart(gridPos);
        }
    }
    _addLabel(X, Y) {
        const label = this._createLabel(X, Y);
        this.pathGraphic.node.addChild(label.node);
        label.node._uiProps.colorDirty = true;
    }

    
    _addObstacles(grid) {
        const gridId = this._map.gridToId(grid);
        this._map.addObstacle(gridId);
        this.renderBlock(grid.X, grid.Y);
        const label = this._createLabel(grid.X, grid.Y);
        this.obstacleGraphics.node.addChild(label.node);
        label.node._uiProps.colorDirty = true;
    }
    _addSpawner(grid) {
        const gridId = this._map.gridToId(grid);
        this._map.addSpawner(gridId);
        this.renderBlock(grid.X, grid.Y);
        const label = this._createLabel(grid.X, grid.Y);
        this.obstacleGraphics.node.addChild(label.node);
        label.node._uiProps.colorDirty = true;
    }
    _addStopPoint(grid) {
        const gridId = this._map.gridToId(grid);
        this._map.addStopPoint(gridId);
        this.renderBlock(grid.X, grid.Y);
    }
    addObstacles() {
        this._action = ActionType.CREATE_OBSTACLE;
    }
    addSpawner() {
        this._action = ActionType.CREATE_SPAWNER;
    }
    addStopPoint() {
        this._action = ActionType.ADD_STOP_POINT;
    }
    genFishes() {
        this._action = ActionType.GEN_PATH;
        if (this._tweenCreateFishes) return;
        this._tweenCreateFishes = tween(this.node)
            .call(() => {
                const fishes = this._map.createFishes();
                fishes.forEach((fishData) => {
                    if (!fishData) return console.error("invalid fish data");
                    this.eventManager.emit("NEW_FISH", fishData);
                    this.drawPath(fishData.Position);
                })
            })
            .delay(3)
            .union()
            .repeatForever()
            .start();
    }
    clearFishes() {
        this._tweenCreateFishes && this._tweenCreateFishes.stop();
        this._tweenCreateFishes = null;
    }
    drawPath(Position) {
        const path = Position.map(id => this._map.idToGrid(id));
        this._allPaths.push(path);
        this.renderBlock(path[0].X, path[0].Y);
        this.renderBlock(path[path.length - 1].X, path[path.length - 1].Y);
        for (let index = 1; index < path.length; index++) {
            let prev = path[index - 1];
            let current = path[index];
            this.drawLine(prev, current, 4, new Color(0, 255, 255, 150));
        }
    }
    clearPath() {
        this.pathGraphic.clear();
        this.pathGraphic.node.removeAllChildren();
        this._points = [];
    }
    exportMap() {
        let config = this._map.getConfig();
        let dataStr = JSON.stringify(config);
        let dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        let exportFileDefaultName = 'mapConfig.json';
        
        let linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
    genPath() {
        this._action = ActionType.GEN_PATH;
        this._points = [];
    }
    _genPath2(point) {
        console.error(point);
        if (((point.X % 3) !== 1) || ((point.Y % 3) !== 1)) return;
        if (this._p1 === null) {
            this._p1 = point;
            this.renderBlock(point.X, point.Y);
            return;
        } else {
            this._p2 = point;
            this.renderBlock(point.X, point.Y);
            const path = this._map.getRandomPath(this._p1, this._p2);
            if (path) {
                this.clearPath();
                this.drawPath(path);
            }
            this._p1 = null;
            this._p2 = null;
        }
    }
    _genPath(point) {
        // if (((point.X % 3) !== 1) || ((point.Y % 3) !== 1)) return;
        console.error(point);
        if (this._points.length === 0) {
            this.clearPath();
            this._points.push(point);
            this.renderBlock(point.X, point.Y);
            return;
        }
       
        const p1 = this._points[this._points.length - 1];
        const p2 = point;
        if (p1.X === p2.X && p1.Y === p2.Y) return;

        this.renderBlock(point.X, point.Y);
        this._points.push(point);

        const fishData = this._map.getTestFish(p1, p2);
        if (fishData) {
            this.eventManager.emit("NEW_FISH", fishData);
            this.drawPath(fishData.Position);
        } else {
            debugger;
        }
    }
    findShortedPath() {
        this._action = ActionType.FIND_SHORTED_PATH;
        this._points = [];
    }
    _findShortedPart(point) {
        if (this._points.length === 0) {
            this.clearPath();
            this._points.push(point);
            this.renderBlock(point.X, point.Y);
            return;
        }

        let p1 = this._points[this._points.length - 1];
        let p2 = point;
        if (p1.X === p2.X && p1.Y === p2.Y) return;

        this.renderBlock(point.X, point.Y);
        const fishData = this._map.genFishAStar(p1, p2);
        if (fishData) {
            this._points.push(point);
            // this.eventManager.emit("NEW_FISH", fishData);
            this.drawPath(fishData.Position);
        } else {
            debugger;
        }
    }
}
