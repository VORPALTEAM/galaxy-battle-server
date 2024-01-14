import * as THREE from 'three';
import { Signal } from "../utils/events/Signal.js";
import { FighterCreateData, ObjectUpdateData } from "../data/Types.js";
import { GameObject, GameObjectParams } from "./GameObject.js";
import { MyMath } from 'src/utils/MyMath.js';

export type BattleShipParams = GameObjectParams & {
}

export type BattleShipState = 'idle' | 'move' | 'fight' | 'starAttack' | 'dead';

export class BattleShip extends GameObject {
    protected _attackTimer: number;
    protected _state: BattleShipState;
    protected _attackObject: GameObject;
    // events
    onAttack = new Signal();

    constructor(aParams: BattleShipParams) {
        super(aParams);
        this._attackTimer = 3;
        this._state = 'idle';
    }

    get state(): BattleShipState {
        return this._state;
    }

    jumpTo(aPosition: THREE.Vector3, aDuration = 1000) {
        this._state = 'move';
        this.lookAt(aPosition);
        this._mesh.position.x = aPosition.x;
        this._mesh.position.y = aPosition.y;
        this._mesh.position.z = aPosition.z;
        setTimeout(() => {
            this._state = 'idle';
        }, 2000);
    }

    attackTarget(aAttackObject: GameObject) {
        this._attackObject = aAttackObject;
        this._state = 'fight';
        this.lookAt(this._attackObject.position);
        this.onAttack.dispatch(this, this._attackObject);
        setTimeout(() => {
            this._state = 'idle';
        }, 1500);
    }

    getCreateData(): FighterCreateData {
        return {
            type: 'BattleShip',
            owner: this.owner,
            hp: this.hp,
            id: this.id,
            radius: this.radius,
            attackRadius: this._attackParams.radius,
            pos: {
                x: this._mesh.position.x,
                y: this._mesh.position.y,
                z: this._mesh.position.z,
            },
            q: {
                x: this._mesh.quaternion.x,
                y: this._mesh.quaternion.y,
                z: this._mesh.quaternion.z,
                w: this._mesh.quaternion.w
            }
        };
    }

    getUpdateData(): ObjectUpdateData {
        return {
            id: this.id,
            hp: this._hp,
            pos: {
                x: this._mesh.position.x,
                y: this._mesh.position.y,
                z: this._mesh.position.z,
            },
            q: {
                x: this._mesh.quaternion.x,
                y: this._mesh.quaternion.y,
                z: this._mesh.quaternion.z,
                w: this._mesh.quaternion.w
            }
        };
    }

    update(dt: number) {
        
    }

    free(): void {
        this._attackObject = null;
        this.onAttack.removeAll();
        super.free();
    }

}