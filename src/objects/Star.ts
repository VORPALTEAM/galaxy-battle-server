import { Signal } from "../utils/events/Signal.js";
import { ObjectUpdateData, StarCreateData } from "../data/Types.js";
import { GameObject, GameObjectParams } from "./GameObject.js";

export type StarParams = GameObjectParams & {
    isTopStar: boolean,
    fightersSpawnDeltaPos: { x: number, y: number }[]
}

const FIGHTER_SPAWN_PERIOD = 40;

export class Star extends GameObject {
    protected _timerFighterSpawn: number;
    protected _isTopStar: boolean;
    protected _fightersSpawnDeltaPos: { x: number, y: number }[];

    /**
     * f( Star, spawnDeltaPos: {x, y} )
     */
    onFighterSpawn = new Signal();
    
    constructor(aParams: StarParams) {
        super(aParams);
        this._isTopStar = aParams.isTopStar;
        this._fightersSpawnDeltaPos = aParams.fightersSpawnDeltaPos;
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

    private spawnFighters() {
        for (let i = 0; i < this._fightersSpawnDeltaPos.length; i++) {
            const dPos = this._fightersSpawnDeltaPos[i];
            this.onFighterSpawn.dispatch(this, dPos);
        }
    }

    private updateFighterSpawn(dt: number) {
        this._timerFighterSpawn -= dt;
        if (this._timerFighterSpawn <= 0) {
            this._timerFighterSpawn = FIGHTER_SPAWN_PERIOD;
            this.spawnFighters();
        }
    }

    update(dt: number) {
        this.updateFighterSpawn(dt);
    }

}