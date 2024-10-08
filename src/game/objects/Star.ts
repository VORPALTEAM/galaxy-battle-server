import { MyMath } from "../../monax/MyMath.js";
import { Signal } from "../../monax/events/Signal.js";
import { ObjectUpdateData, StarCreateData } from "../data/Types.js";
import { GameObject, GameObjectParams } from "./GameObject.js";

export type StarParams = GameObjectParams & {
    isTopStar: boolean,
    fightersSpawnDeltaPos: { x: number, y: number }[],
    linkorSpawnDeltaPos: { x: number, y: number }[],
    minusHpPerSec: number
}

const FIGHTER_SPAWN_START_DELAY = 0;
const FIGHTER_SPAWN_PERIOD = 60 / 2;

const BATTLESHIP_SPAWN_START_DELAY = 120 / 2;
const BATTLESHIP_SPAWN_PERIOD = 120 / 2;

const ATTACK_PERIOD = 1;

export class Star extends GameObject {
    protected _params: StarParams;
    protected _timerFighterSpawn: number;
    protected _timerBattleShipSpawn: number;
    protected _attackTimer = 0;
    isActive = true;
    // events
    /**
     * f( Star, spawnDeltaPos: {x, y} )
     */
    onFighterSpawn = new Signal();
    onLinkorSpawn = new Signal();
    onAttack = new Signal();
    
    constructor(aParams: StarParams) {
        super(aParams);
        this._objectType = 'Star';
        this._params = aParams;
        this._timerFighterSpawn = FIGHTER_SPAWN_START_DELAY;
        this._timerBattleShipSpawn = BATTLESHIP_SPAWN_START_DELAY;
    }

    private spawnFighters() {
        const deltaPos = this._params.fightersSpawnDeltaPos;
        if (!deltaPos) {
            this.logError(`spawnFighters: !deltaPos`);
            return;
        }
        for (let i = 0; i < deltaPos.length; i++) {
            const dPos = deltaPos[i];
            setTimeout(() => {
                if (!this.isActive) return;
                this.onFighterSpawn.dispatch(this, dPos);
            }, i * 250);
        }
    }

    private spawnLinkors() {
        const deltaPos = this._params.linkorSpawnDeltaPos;
        if (!deltaPos) {
            this.logError(`spawnLinkors: !deltaPos`);
            return;
        }
        for (let i = 0; i < deltaPos.length; i++) {
            const dPos = deltaPos[i];
            setTimeout(() => {
                if (!this.isActive) return;
                this.onLinkorSpawn.dispatch(this, dPos);
            }, i * MyMath.randomIntInRange(0, 500));
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

    private updateBattleShipSpawn(dt: number) {
        this._timerBattleShipSpawn -= dt;
        if (this._timerBattleShipSpawn <= 0) {
            this._timerBattleShipSpawn = BATTLESHIP_SPAWN_PERIOD;
            this.spawnLinkors();
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
        return this._params.isTopStar;
    }

    getCreateData(): StarCreateData {
        return {
            type: 'Star',
            owner: this.owner,
            hp: this.hp,
            id: this.id,
            radius: this.radius,
            pos: this._mesh.position,
            attackRadius: this.attackRadius
        };
    }

    getUpdateData(): ObjectUpdateData {
        return {
            id: this.id,
            hp: this.hp
        };
    }

    update(dt: number) {
        if (!this.isActive) return;
        this.updateAttack(dt);
        this.updateFighterSpawn(dt);
        this.updateBattleShipSpawn(dt);
        this._hp -= this._params.minusHpPerSec * dt;
    }

    free(): void {
        this.onFighterSpawn.removeAll();
        this.onLinkorSpawn.removeAll();
        this.onAttack.removeAll();
        super.free();
    }

}