import * as THREE from 'three';
import { Signal } from "../utils/events/Signal.js";
import { FighterCreateData, ObjectUpdateData } from "../data/Types.js";
import { GameObject, GameObjectParams } from "./GameObject.js";
import { MyMath } from '../utils/MyMath.js';
import { FieldCell } from './FieldCell.js';

const ATTACK_PERIOD = 1;
const ROTATION_TIME = 1;
const PREPARE_JUMP_TIME = 0.5;
const JUMP_TIME = 1;

export type FighterParams = GameObjectParams & {
    lookDir: THREE.Vector3
}

export type FighterState = 'idle' | 'rotateForJump' | 'jump' | 'fight' | 'starAttack' | 'dead';

export class Fighter extends GameObject {
    protected _attackTimer: number;
    protected _state: FighterState;
    private _attackObject: GameObject;
    private _atkTimer: number;
    private _lookDir: THREE.Vector3;

    // rotation
    private _isTurning = false;
    
    // jump
    jumpTargetCell: FieldCell;

    // events
    onRotate = new Signal();
    onJump = new Signal();
    onAttack = new Signal();

    constructor(aParams: FighterParams) {
        super(aParams);
        this._lookDir = aParams.lookDir;
        this.lookByDir(this._lookDir);
        this._attackTimer = 3;
        this._atkTimer = 0;
        this._state = 'idle';
    }

    private getAngleBetweenVectors(v: { x: number; y: number }, w: { x: number; y: number }): number {
        const dotProduct = v.x * w.x + v.y * w.y;
        const lengthV = Math.sqrt(v.x ** 2 + v.y ** 2);
        const lengthW = Math.sqrt(w.x ** 2 + w.y ** 2);
        const cosTheta = dotProduct / (lengthV * lengthW);
        const thetaRad = Math.acos(cosTheta);
        const thetaDeg = THREE.MathUtils.radToDeg(thetaRad);
        return thetaDeg;
    }


    private getAngleToPointInDeg(aPoint: THREE.Vector3) {
        const objectPosition = this.mesh.position.clone();
        const direction = aPoint.clone().sub(objectPosition).normalize();
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(this.mesh.quaternion);
        // this.logDebug(`forward:`, forward);

        let res = this.getAngleBetweenVectors(
            { x: forward.x, y: forward.z },
            { x: direction.x, y: direction.z }
        );

        // return MyMath.toDeg(MyMath.angleBetweenATan(forward.x, forward.z, direction.x, direction.z));
        return res;
    }
    
    get state(): FighterState {
        return this._state;
    }

    public get isTurning() {
        return this._isTurning;
    }

    get attackObject(): GameObject {
        return this._attackObject;
    }

    setState(aState: FighterState) {
        this._state = aState;
    }

    rotateToPoint(aPoint: THREE.Vector3, aDuration: number) {
        this._isTurning = true;
        this.lookAt(aPoint);
        const dur = aDuration;
        setTimeout(() => {
            this._isTurning = false;
        }, dur);
        this.onRotate.dispatch(this, aPoint, dur);
    }

    rotateToCellForJump(aCellPos: THREE.Vector3) {
        let anDeg = Math.abs(this.getAngleToPointInDeg(aCellPos));
        let t = ROTATION_TIME * 1000;
        let rotateDur = anDeg >= 30 ? t : t * anDeg / 30;
        this.rotateToPoint(aCellPos, rotateDur);
        this._state = `rotateForJump`;
    }

    isReadyForAttack(): boolean {
        return this._atkTimer <= 0;
    }

    jumpTo(aPosition: THREE.Vector3) {
        this._state = 'jump';
        const preTime = PREPARE_JUMP_TIME * 1000;
        const jumpDur = JUMP_TIME * 1000;
        setTimeout(() => {
            try {
                this.onJump.dispatch(this, aPosition, jumpDur);
            } catch (error) {
            }
        }, preTime);
        setTimeout(() => {
            try {
                this._mesh.position.x = aPosition.x;
                this._mesh.position.y = aPosition.y;
                this._mesh.position.z = aPosition.z;
            } catch (error) {
            }
        }, preTime + jumpDur / 2);
        setTimeout(() => {
            try {
                this._state = 'idle';
            } catch (error) {
            }
        }, preTime + jumpDur);
    }

    attackTarget(aAttackObject: GameObject) {
        this._state = 'fight';
        this._attackObject = aAttackObject;
        // rotate to target
        let anDeg = Math.abs(this.getAngleToPointInDeg(this._attackObject.position));
        let t = ROTATION_TIME * 1000;
        let rotateDur = anDeg >= 30 ? t : t * anDeg / 30;
        this.rotateToPoint(this._attackObject.position, rotateDur);
    }

    stopAttack() {
        this._state = 'idle';
        this._attackObject = null;
    }

    getCreateData(): FighterCreateData {
        return {
            type: 'FighterShip',
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
            // q: {
            //     x: this._mesh.quaternion.x,
            //     y: this._mesh.quaternion.y,
            //     z: this._mesh.quaternion.z,
            //     w: this._mesh.quaternion.w
            // },
            lookDir: this._lookDir
        };
    }

    getUpdateData(): ObjectUpdateData {
        return {
            id: this.id,
            hp: this._hp,
            // pos: {
            //     x: this._mesh.position.x,
            //     y: this._mesh.position.y,
            //     z: this._mesh.position.z,
            // },
            // q: {
            //     x: this._mesh.quaternion.x,
            //     y: this._mesh.quaternion.y,
            //     z: this._mesh.quaternion.z,
            //     w: this._mesh.quaternion.w
            // }
        };
    }

    updateAttack(dt: number) {
        if (!this._attackObject || this._attackObject.hp <= 0) {
            this._attackObject = null;
            this._state = 'idle';
            return;
        }
        if (this._atkTimer <= 0) {
            this._atkTimer = ATTACK_PERIOD;
            this.onAttack.dispatch(this, this._attackObject);
        }
    }

    update(dt: number) {

        if (this._atkTimer > 0) this._atkTimer -= dt;

        switch (this._state) {

            case 'fight':
                if (this.isTurning) break;
                // rotate to target
                this.updateAttack(dt);
                break;
            
            default:
                break;
        }

    }

    free(): void {
        this._attackObject = null;
        this.onAttack.removeAll();
        super.free();
    }

}