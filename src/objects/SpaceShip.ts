import * as THREE from 'three';
import { Signal } from "../utils/events/Signal.js";
import { FighterCreateData, ObjectUpdateData } from "../data/Types.js";
import { GameObject, GameObjectParams } from "./GameObject.js";
import { MyMath } from '../utils/MyMath.js';
import { FieldCell } from './FieldCell.js';

export type SpaceShipParams = GameObjectParams & {
    lookDir: THREE.Vector3,
    attackPeriod: number,
    rotationTime: number,
    prepareJumpTime: number,
    jumpTime: number
}

export type SpaceShipState = 'idle' | 'rotateForJump' | 'jump' | 'fight' | 'starAttack' | 'dead';

export class SpaceShip extends GameObject {
    protected _shipParams: SpaceShipParams;
    protected _attackTimer: number;
    protected _state: SpaceShipState;
    protected _attackObject: GameObject;
    protected _atkTimer: number;
    protected _lookDir: THREE.Vector3;

    // rotation
    private _isTurning = false;
    
    // jump
    jumpTargetCell: FieldCell;

    // events
    onRotate = new Signal();
    onJump = new Signal();
    onAttack = new Signal();

    constructor(aParams: SpaceShipParams) {
        super(aParams);
        this._shipParams = aParams;
        this._lookDir = aParams.lookDir;
        this.lookByDir(this._lookDir);
        this._attackTimer = 3;
        this._atkTimer = 0;
        this._state = 'idle';
    }

    private getAngleToPointInDeg(aPoint: THREE.Vector3) {
        const objectPosition = this.mesh.position.clone();
        const direction = aPoint.clone().sub(objectPosition).normalize();
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(this.mesh.quaternion);
        let res = MyMath.angleBetweenACos(
            { x: forward.x, y: forward.z },
            { x: direction.x, y: direction.z }
        );
        return MyMath.toDeg(res);
    }
    
    get state(): SpaceShipState {
        return this._state;
    }

    public get isTurning() {
        return this._isTurning;
    }

    get attackObject(): GameObject {
        return this._attackObject;
    }

    setState(aState: SpaceShipState) {
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
        let t = this._shipParams.rotationTime * 1000;
        let rotateDur = anDeg >= 30 ? t : t * anDeg / 30;
        this.rotateToPoint(aCellPos, rotateDur);
        this._state = `rotateForJump`;
    }

    isReadyForAttack(): boolean {
        return this._atkTimer <= 0;
    }

    jumpTo(aPosition: THREE.Vector3) {
        this._state = 'jump';
        const preTime = this._shipParams.prepareJumpTime * 1000;
        const jumpDur = this._shipParams.jumpTime * 1000;
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
        let t = this._shipParams.rotationTime * 1000;
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
            lookDir: this._lookDir
        };
    }

    getUpdateData(): ObjectUpdateData {
        return {
            id: this.id,
            hp: this._hp
        };
    }

    updateAttack(dt: number) {
        if (!this._attackObject || this._attackObject.hp <= 0) {
            this._attackObject = null;
            this._state = 'idle';
            return;
        }
        if (this._atkTimer <= 0) {
            this._atkTimer = this._shipParams.attackPeriod;
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