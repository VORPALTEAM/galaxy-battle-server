import * as THREE from 'three';
import { Signal } from "../../monax/events/Signal.js";
import { AttackType, FighterCreateData, ObjectUpdateData } from "../data/Types.js";
import { GameObject, GameObjectParams } from "./GameObject.js";
import { MyMath } from '../../monax/MyMath.js';
import { FieldCell } from './FieldCell.js';

export type TowerParams = GameObjectParams & {
    lookDir?: THREE.Vector3,
    attackPeriod: number,
    rotationTime?: number,
    level?: number,
}

export type TowerState = 'idle' | 'rotateForJump' | 'fight' | 'dead';

export class Tower extends GameObject {
    protected _towerParams: TowerParams;
    protected _state: TowerState;
    protected _lookDir?: THREE.Vector3;
    protected _attackTimer: number;
    protected _attackType: AttackType;
    protected _isRayCreated = false;
    // rotation
    private _isTurning = false;
    // jump
    jumpTargetCell: FieldCell;
    // events
    onRotate = new Signal();
    /**
     * (sender, aPosition, jumpDur)
     */
    onJump = new Signal();
    /**
     * sender: SpaceShip, enemy: GameObject, type: AttackType
     */
    onAttack = new Signal();
    /**
     * (sender, attackObject)
     */
    onRayStart = new Signal();
    /**
     * (sender)
     */
    onRayStop = new Signal();

    constructor(aParams: TowerParams) {
        super(aParams);
        this._objectType = 'Tower';
        this._towerParams = aParams;
        this._lookDir = aParams.lookDir;
        // this.lookByDir(this._lookDir);
        this._attackTimer = 0;
        this._state = 'idle';
    }

    protected getAngleToPointInDeg(aPoint: THREE.Vector3) {
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

    protected refreshAttackTimer() {
        this._attackTimer = this._towerParams.attackPeriod;
    }
    
    get state(): TowerState {
        return this._state;
    }

    public get isTurning() {
        return this._isTurning;
    }

    get attackObject(): GameObject {
        return this._attackObject;
    }

    setState(aState: TowerState) {
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
        let t = this._towerParams.rotationTime * 1000;
        let rotateDur = anDeg >= 30 ? t : t * anDeg / 30;
        this.rotateToPoint(aCellPos, rotateDur);
        this._state = `rotateForJump`;
    }

    isReadyForAttack(): boolean {
        return this._attackTimer <= 0;
    }

    attackTarget(aAttackObject: GameObject, aAttackType: AttackType) {
        this._state = 'fight';
        this._attackObject = aAttackObject;
        this._attackType = aAttackType;
        // if (this._attackType == 'ray') {
        //     this.refreshAttackTimer();
        //     this._isRayCreated = false;
        // }
        // rotate to target
        // let anDeg = Math.abs(this.getAngleToPointInDeg(this._attackObject.position));
        // let t = this._towerParams.rotationTime * 1000;
        // let rotateDur = anDeg >= 30 ? t : t * anDeg / 30;
        // this.rotateToPoint(this._attackObject.position, rotateDur);
    }

    stopAttack() {
        this._state = 'idle';
        this._attackObject = null;
    }

    getCreateData(): FighterCreateData {
        return {
            type: this._objectType,
            owner: this.owner,
            hp: this.hp,
            shield: this.shield,
            id: this.id,
            radius: this.radius,
            attackRadius: this._attackParams.radius,
            pos: {
                x: this._mesh.position.x,
                y: this._mesh.position.y,
                z: this._mesh.position.z,
            },
            // lookDir: this._lookDir
        };
    }

    getUpdateData(): ObjectUpdateData {
        return {
            id: this.id,
            hp: this._hp,
            shield: this.shield
        };
    }

    updateAttack(dt: number) {

        if (!this._attackObject || this._attackObject.hp <= 0) {
            this.stopAttack();
            return;
        }

        if (this._attackTimer <= 0) {
            this.refreshAttackTimer();
            this.onAttack.dispatch(this, this._attackObject, this._attackType);
        }

    }

    private createRay() {
        this._isRayCreated = true;
        this.onRayStart.dispatch(this, this._attackObject);
    }

    private stopRay() {
        this._isRayCreated = false;
        this.onRayStop.dispatch(this);
    }

    update(dt: number) {
        
        if (this._attackTimer > 0) this._attackTimer -= dt;

        switch (this._state) {
            
            case 'fight':
                if (this.isTurning) break;
                // switch (this._attackType) {
                //     case 'ray':
                //         if (!this._isRayCreated) {
                //             this.createRay();
                //         }
                //         break;
                // }
                this.updateAttack(dt);
                break;
            
        }

    }

    free(): void {
        this._attackObject = null;
        this.onAttack.removeAll();
        super.free();
    }

}