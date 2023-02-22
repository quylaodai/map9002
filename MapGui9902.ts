import { _decorator, Component, Node, Label, Vec3, Camera ,UITransform, Color} from 'cc';

const { ccclass, property } = _decorator;
const dat = globalThis.dat;
const guiWidth = 150;

enum ActionType {
    NONE = 0,
    CREATE_OBSTACLE = 1,
    CREATE_SPAWNER = 2,
    ADD_STOP_POINT = 3,
    GEN_PATH = 4,
    FIND_SHORTED_PATH = 5
}

@ccclass('MapGui9902')
export class MapGui9902 extends Component {
    @property(Camera)
    camera: Camera = null;
    @property(Node)
    gridView: Node = null;
    @property(Node)
    gridNode: Node = null;
    @property(Node)
    objectNode: Node = null;
    @property(Node)
    pathNode: Node = null;
    @property(Node)
    background: Node = null;
    @property(Node)
    labelHolder: Node = null;

    _viewControls: any = null;
    _viewGui: any = null;

    _mapControls: any = null;
    _mapGui: any = null;
    _hoverLabel: Label = null;
    _action = ActionType.NONE;
    _map: any = null;

    onLoad() {
        this._viewControls = {
            Grid: true,
            Object: true,
            Path: true,
            Background: true,
            Gun: false,
            "Gen Path": () => { this.node.emit("GEN_PATH") },
            "Find Shorted Path": () => { this.node.emit("FIND_SHORTED_PATH") },
            "Clear Paths": () => { this.node.emit("CLEAR_PATH") },
        }
        this._mapControls = {
            "Select Map": "Map 1",
            "Add Obstacle": () => { this.addObstacles(); },
            "Add Spawner": () => { this.addSpawner(); },
            "Add StopPoint": () => { this.addStopPoint(); },
            "Export Map": () => { this.exportMap(); },
            "Clear Map": () => { this.node.emit("CLEAR_MAP"); },
        }
        this.node.on("SET_MAP", this.setMap, this);
        this.background.on(Node.EventType.MOUSE_DOWN, this.onMouseDown, this, false);
        this.background.on(Node.EventType.MOUSE_MOVE, this.onMouseMove, this, false);
    }
    setMap(map){
        this._map = map;
        this.gridView && this.gridView.emit("SET_MAP", this._map);
    }
    start(){
        this._createViewGui();
        for (let key in this._viewControls) {
            this._updateView(key, this._viewControls[key]);
        }
        this._createMapGui();
        this._hoverLabel = this._createLabel(0, 0);
    }
    _createViewGui() {
        const gui = new dat.GUI({ name: "View", width: 150 });
        gui.domElement.parentElement.style.zIndex = 1000;
        this._viewGui = gui.addFolder("View");
        for (let key in this._viewControls) {
            this._viewGui.add(this._viewControls, key).onChange(value => {
                if (typeof this._viewControls[key] !== 'function') {
                    this._viewControls[key] = value;
                }
                this._updateView(key, value);
                this._viewGui.close();
            });
        }
    }
    _updateView(key, value) {
        switch (key) {
            case "Grid":
                this.gridView.emit("SHOW_GRID", value);
                return;
            case "Path":
                this.gridView.emit("SHOW_PATH", value);
                return;
            case "Object":
                this.gridView.emit("SHOW_OBJECTS", value);
                return;
            case "Background":
                this.node.emit("SHOW_BACKGROUND", this._viewControls.Background);
                return;
        }
    }

    _createMapGui() {
        this._mapGui = new dat.GUI({ name: "Map", width: guiWidth });
        const mapFolder = this._mapGui.addFolder('Map');
        for (let key in this._mapControls) {
            if (key === "Select Map") {
                mapFolder.add(this._mapControls, key, ["Map 1", "Map 2"]).onChange(value => {
                    const mapId = value.slice(3);
                    this.node.emit("CHANGE_MAP", mapId);
                    this.node.emit("CLEAR_PATH");
                    mapFolder.close();
                })
            } else {
                mapFolder.add(this._mapControls, key).onChange(() => mapFolder.close());
            }
        }
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
            // case ActionType.GEN_PATH: return this._genPath(gridPos);
            // case ActionType.FIND_SHORTED_PATH: return this._findShortedPart(gridPos);
        }
    }
    _addObstacles(grid) {
        const gridId = this._map.gridToId(grid);
        this._map.addObstacle(gridId);
        this.gridView.emit("DRAW_OBSTACLES", gridId);
        
        const label = this._createLabel(grid.X, grid.Y);
        this.objectNode.addChild(label.node);
        label.node._uiProps.colorDirty = true;
    }
    _addSpawner(grid) {
        const gridId = this._map.gridToId(grid);
        this._map.addSpawner(gridId);
        this.gridView.emit("DRAW_SPAWNERS", gridId);

        const label = this._createLabel(grid.X, grid.Y);
        this.objectNode.addChild(label.node);
        label.node._uiProps.colorDirty = true;
    }
    _addStopPoint(grid) {
        const gridId = this._map.gridToId(grid);
        this._map.addStopPoint(gridId);
        this.gridView.emit("DRAW_STOP_POINTS",gridId);

        const label = this._createLabel(grid.X, grid.Y);
        this.objectNode.addChild(label.node);
        label.node._uiProps.colorDirty = true;
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

}

