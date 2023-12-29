import * as THREE from 'three';
import { Signal } from "../utils/events/Signal.js";
import { FighterCreateData, ObjectUpdateData } from "../data/Types.js";
import { GameObject, GameObjectParams } from "./GameObject.js";

export type FighterParams = GameObjectParams & {

}

export type FighterState = 'idle' | 'move' | 'fight' | 'starAttack' | 'dead';

export class Fighter extends GameObject {
    protected _timerShot: number;
    protected _state: FighterState;
    
    
    constructor(aParams: FighterParams) {
        super(aParams);
        this._timerShot = 3;
        this._state = 'idle';
    }

    get state(): FighterState {
        return this._state;
    }

    moveTo(aPosition: THREE.Vector3) {
        this._state = 'move';
        this.lookAt(aPosition);
        this._mesh.position.x = aPosition.x;
        this._mesh.position.y = aPosition.y;
        this._mesh.position.z = aPosition.z;
        setTimeout(() => {
            this._state = 'idle';
        }, 2000);
    }

    getCreateData(): FighterCreateData {
        return {
            type: 'FighterShip',
            owner: this.owner,
            hp: this.hp,
            id: this.id,
            radius: this.radius,
            pos: this._mesh.position,
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
            pos: this._mesh.position,
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

}