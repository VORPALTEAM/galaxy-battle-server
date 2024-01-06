import { Signal } from "../utils/events/Signal.js";
import { ObjectUpdateData, StarCreateData } from "../data/Types.js";
import { GameObject, GameObjectParams } from "./GameObject.js";

export type StarParams = GameObjectParams & {
    isTopStar: boolean,
    fightersSpawnDeltaPos: { x: number, y: number }[]
}

const FIGHTER_SPAWN_PERIOD = 40;
const ATTACK_PERIOD = 1;

export class Star extends GameObject {
    protected _timerFighterSpawn: number;
    protected _isTopStar: boolean;
    protected _fightersSpawnDeltaPos: { x: number, y: number }[];
    protected _attackTimer = 0;
    // events
    /**
     * f( Star, spawnDeltaPos: {x, y} )
     */
    onFighterSpawn = new Signal();
    onAttack = new Signal();
    
    constructor(aParams: StarParams) {
        super(aParams);
        this._isTopStar = aParams.isTopStar;
        this._fightersSpawnDeltaPos = aParams.fightersSpawnDeltaPos;
        this._timerFighterSpawn = 3;
    }

    private spawnFighters() {
        for (let i = 0; i < this._fightersSpawnDeltaPos.length; i++) {
            const dPos = this._fightersSpawnDeltaPos[i];
            this.onFighterSpawn.dispatch(this, dPos);
        }
    }

    private attack() {
        this.onAttack.dispatch(this);
    }

    private updateFighterSpawn(dt: number) {
        this._timerFighterSpawn -= dt;
        if (this._timerFighterSpawn <= 0) {
            this._timerFighterSpawn = FIGHTER_SPAWN_PERIOD;
            this.spawnFighters();
        }
    }

    private updateAttack(dt: number) {
        this._attackTimer -= dt;
        if (this._attackTimer <= 0) {
            this._attackTimer = ATTACK_PERIOD;
            this.attack();
        }
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
        return {
            id: this.id,
            hp: this.hp
        };
    }

    update(dt: number) {
        this.updateAttack(dt);
        this.updateFighterSpawn(dt);
    }

}