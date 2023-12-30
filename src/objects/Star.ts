import { Signal } from "../utils/events/Signal.js";
import { ObjectUpdateData, StarCreateData } from "../data/Types.js";
import { GameObject, GameObjectParams } from "./GameObject.js";

export type StarParams = GameObjectParams & {
    isTopStar: boolean
}

const FIGHTER_SPAWN_PERIOD = 60;

export class Star extends GameObject {
    protected _timerFighterSpawn: number;
    private _isTopStar: boolean;
    
    onFighterSpawn = new Signal();
    
    constructor(aParams: StarParams) {
        super(aParams);
        this._isTopStar = aParams.isTopStar;
        this._timerFighterSpawn = 3;
    }

    get isTopStar(): boolean {
        return this._isTopStar;
    }

    getCreateData(): StarCreateData {
        return {
            type: 'Star',
            owner: this.owner,
            hp: this.hp,
            id: this.id,
            radius: this.radius,
            pos: this._mesh.position,
        };
    }

    getUpdateData(): ObjectUpdateData {
        return null;
    }

    private updateFighterSpawn(dt: number) {
        this._timerFighterSpawn -= dt;
        if (this._timerFighterSpawn <= 0) {
            this._timerFighterSpawn = FIGHTER_SPAWN_PERIOD;
            this.onFighterSpawn.dispatch(this);
        }
    }

    update(dt: number) {
        this.updateFighterSpawn(dt);
    }

}