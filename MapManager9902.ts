import { _decorator, Component, Node, tween, JsonAsset , v3, sp} from 'cc';
const { ccclass, property } = _decorator;

import mapModule from "./map/Map9902.js";
const { Map } = mapModule;

@ccclass('MapManager9902')
export class MapManager9902 extends Component {
    @property(Node)
    bg: Node = null;

    @property(Node)
    viewport: Node = null;

    @property(Node)
    character: Node = null;

    @property(JsonAsset)
    mapConfigs: JsonAsset[] = [];

    _map: any = null;
    _config: any = null;
    _tweenCharacter: any = null;
    _tweenViewport: any = null;
    _keyFrames: any = null;
    _spine: any = null;

    onLoad(){
        this.node.on("CHANGE_MAP", this.changeMap, this);
        this.node.on("MOVE", this.move, this);
        this._spine = this.character.getComponent(sp.Skeleton);
    }

    start() {
        this.changeMap(1);
        window["map"] = this._map;
    }

    changeMap(id){
        this._config = this.mapConfigs[id - 1].json;
        this._map = new Map(this._config);
        this.node.emit("SET_MAP", this._map);
    }

    move(path){
        path = this._map.convertToGridPath(path);
        this._keyFrames = this._getKeyFrames(path);
        this._moveCharacter();
        this._moveViewPort();
    }

    _moveCharacter() {
        const keyFrames = this._keyFrames;
        this.character.setPosition(keyFrames[0].position);

        this._tweenCharacter = tween(this.character);
        keyFrames.forEach((frame, index) => {
            const { position, dur, skin, scaleX } = frame;
            if (index > 0) {
                this._tweenCharacter
                    .call(() => {
                        this.character.scale = v3(scaleX, 1, 1);
                        this._spine.setSkin(skin);
                    })
                    .to(dur, { position })
            }
        });
        this._tweenCharacter.call(() => {
            this._tweenCharacter = null;
        }).start();
    }
    _moveViewPort(){
        const keyFrames = this._keyFrames;
        const viewPortFrames = keyFrames.map(frame =>{
            let newFrames: any = {};
            newFrames.dur = frame.dur;
            newFrames.position = v3(-frame.position.x,-frame.position.y);
            return newFrames;
        })
        this.viewport.setPosition(viewPortFrames[0].position);

        this._tweenViewport = tween(this.viewport);
        viewPortFrames.forEach((frame, index) => {
            const { position, dur } = frame;
            if (index > 0) {
                this._tweenViewport.to(dur, { position })
            }
        });
        this._tweenViewport.call(() => {
            this._tweenViewport = null;
        }).start();
    }
    _getKeyFrames(path) {
        let dx = 0, dy = 0, timeStep = 1; // *test
        const frames = [];
        const startFrame: any = {};
        const startPos = this._map.gridCenterToPosition(path[0]);
        startFrame.position = v3(startPos.x + dx, startPos.y + dy);
        startFrame.dur = 0;
        startFrame.skin = this._getSkin(path[0], path[1]);
        startFrame.scaleX = this._getScaleX(path[0], path[1]);
        frames.push(startFrame);
        for (let index = 1; index < path.length; index++) {
            const frame: any = {};
            let p1 = path[index - 1];
            let p2 = path[index];
            if (p1.X === p2.X && p1.Y === p2.Y) {
                continue;
            }
            if (p1.X !== p2.X && p1.Y !== p2.Y) {
                console.error("invalid line", p1, p2);
            }
            const endPoint = this._map.gridCenterToPosition(p2);
            let distance = Math.abs(p2.X - p1.X + p2.Y - p1.Y);
            frame.dur = distance * timeStep;
            frame.position = v3(endPoint.x + dx, endPoint.y + dy);
            frame.skin = this._getSkin(p1, p2);
            frame.scaleX = this._getScaleX(p1, p2);
            frames.push(frame);
        }
        // console.error(frames);
        return frames;
    }
    _getSkin(p1, p2) {
        if ((p1.Y > p2.Y) || (p1.X > p2.X)) return "Back"; // down 
        if ((p1.Y < p2.Y) || (p1.X < p2.X)) return "Front";
        debugger;
    }
    _getScaleX(p1, p2) {
        return (p1.X === p2.X) ? 1 : -1;
    }

}

