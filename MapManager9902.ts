import { _decorator, Component, Node, Camera, JsonAsset } from 'cc';
const { ccclass, property } = _decorator;

import mapModule from "./map/Map9902.js";
const { Map } = mapModule;

@ccclass('MapManager9902')
export class MapManager9902 extends Component {
    @property(Node)
    bg: Node = null;

    @property(Node)
    character: Node = null;

    @property(Node)
    gridView: Node = null;

    @property(JsonAsset)
    mapConfigs: JsonAsset[] = [];

    _map: any = null;
    _config: any = null;

    onLoad(){
        this.node.on("CHANGE_MAP", this.changeMap, this);
    }

    start() {
        this.changeMap(0);
        window["map"] = this._map;
    }

    changeMap(index){
        this._config = this.mapConfigs[index].json;
        this._map = new Map(this._config);
        this.gridView && this.gridView.emit("SET_MAP", this._map);
    }

}

