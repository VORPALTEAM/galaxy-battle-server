import * as THREE from 'three';
import { Signal } from "../utils/events/Signal.js";
import { FighterCreateData, ObjectUpdateData } from "../data/Types.js";
import { GameObject, GameObjectParams } from "./GameObject.js";
import { MyMath } from '../utils/MyMath.js';
import { FieldCell } from './FieldCell.js';

export type FighterParams = GameObjectParams & {
    lookDir: THREE.Vector3
}

export type FighterState = 'idle' | 'prepareForJump' | 'move' | 'fight' | 'starAttack' | 'dead';

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

    private updateRotationToTarget(aTargetPos: THREE.Vector3, dt: number) {
        let qStart = this.mesh.quaternion.clone();
        this.lookAt(aTargetPos);
        let qTarget = this.mesh.quaternion.clone();
        this.mesh.quaternion.copy(qStart);
        const t = 1 / 50;
        let q = qStart.slerp(qTarget, t);
        this.mesh.quaternion.copy(q);
    }

    private getAngleToPointInDeg(aPoint: THREE.Vector3) {
        const objectPosition = this.mesh.position.clone();
        // Вектор, указывающий от объекта к точке
        const direction = aPoint.clone().sub(objectPosition).normalize();
        // Вектор, направленный вдоль оси z (направление взгляда объекта)
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(this.mesh.quaternion);
        // let look = this.mesh.localToWorld(forward);
        // Рассчитываем угол между векторами
        return MyMath.toDeg( MyMath.angleBetweenATan(forward.x, forward.y, direction.x, direction.y) );
        // return Math.atan2(direction.y, direction.x) - Math.atan2(look.y, look.x);
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

    rotateToPoint(aParams: {
        point: THREE.Vector3,
        duration?: number
    }) {
        this._isTurning = true;
        this.lookAt(aParams.point);
        const dur = aParams.duration > 0 ? aParams.duration : 0;
        setTimeout(() => {
            this._isTurning = false;
        }, dur);
        this.onRotate.dispatch(this, aParams.point, dur);
    }

    rotateToCellForJump(aCellPos: THREE.Vector3) {
        let an = this.getAngleToPointInDeg(aCellPos);
        let rotateDur = an > 30 ? 1 : an / 30;
        rotateDur *= 1000;
        this.rotateToPoint({
            point: aCellPos,
            duration: rotateDur
        });
        this._state = `prepareForJump`;
    }

    isReadyForAttack(): boolean {
        return this._atkTimer <= 0;
    }

    moveTo(aPosition: THREE.Vector3, aDuration = 1000) {
        this._state = 'move';
        // this.lookAt(aParams.position);
        this._mesh.position.x = aPosition.x;
        this._mesh.position.y = aPosition.y;
        this._mesh.position.z = aPosition.z;
        setTimeout(() => {
            this._state = 'idle';
        }, aDuration);
        this.onJump.dispatch(this, aPosition, aDuration);
    }

    attackTarget(aAttackObject: GameObject) {
        this._state = 'move';
        this._attackObject = aAttackObject;

        let an = this.getAngleToPointInDeg(this._attackObject.position);

        // this.rotateToPoint({
        //     point: this._attackObject.position,
        //     duration: an > 30 ? 1 : an / 30,
        // }).then(() => {
        //     this._state = 'fight';
        //     this.onAttack.dispatch(this, this._attackObject);
        //     setTimeout(() => {
        //         this._state = 'idle';
        //     }, 1500);
        // });
        
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
            // }
        };
    }

    update(dt: number) {
        switch (this._state) {

            case 'fight':
                // rotate to target
                this.updateRotationToTarget(this._attackObject.position, dt);
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