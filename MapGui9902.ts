import { _decorator, Component, Node, UITransform, Vec3 } from 'cc';

const { ccclass, property } = _decorator;
const dat = globalThis.dat;
const guiWidth = 150;

@ccclass('MapGui9902')
export class MapGui9902 extends Component {
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

    _viewControls: any = null;
    _viewGui: any = null;

    _mapControls: any = null;
    _mapGui: any = null;

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
            "Add Obstacle": () => { this.node.emit("ADD_OBSTACLE"); },
            "Add Spawner": () => { this.node.emit("ADD_SPAWNER"); },
            "Export Map": () => { this.node.emit("EXPORT_MAP"); },
            "Clear Map": () => { this.node.emit("CLEAR_MAP"); },
        }
    }
    start(){
        this._createViewGui();
        for (let key in this._viewControls) {
            this._updateView(key, this._viewControls[key]);
        }
        this._createMapGui();
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

}

