import * as THREE from 'three';
import { GameObject, GameObjectParams } from "./GameObject.js";
import { ObjectCreateData, ObjectUpdateData } from '../data/Types.js';
import { MyMath } from '../utils/MyMath.js';
import { EaseUtils } from '../utils/EaseUtils.js';

const SPEED = 3; // missile speed pixels/second
const TURN_RATE = 3; // turn rate in degrees/frame
const WOBBLE_LIMIT = 5; // degrees
const WOBBLE_SPEED = 50; // milliseconds
const ACCEL = 10;

export type HomingMissileParams = GameObjectParams & {
    lookDir: THREE.Vector3,
    level: number,
    velocity: number,
    maxTurnRate: number,
    target?: GameObject
}

export type HomingMissileState = 'active' | 'passive' | 'dead';

/**
 * Model of Homing Missile
 */
export class HomingMissile extends GameObject {
    protected _params: HomingMissileParams;
    protected _state: HomingMissileState;
    protected _lookDir: THREE.Vector3;
    protected _maxVelocity: number;
    protected _velocity: THREE.Vector3;
    protected _target?: GameObject; // Позиция цели
    protected _maxTurnRate: number; // Максимальный угол поворота за обновление в радианах
    // protected _rotation: number;
    private _globalTurnFactor = 0;

    protected _wobble: number;
    protected _wobbleActive = false;
    protected _wobbleTime: number;
    protected _wobbleDir: number;

    constructor(aParams: HomingMissileParams) {
        super(aParams);
        this._params = aParams;
        this._lookDir = aParams.lookDir;
        this.lookByDir(this._lookDir);
        this._state = 'active';
        this._type = 'HomingMissile';

        this._maxVelocity = aParams.velocity;
        this._velocity = new THREE.Vector3();
        this._maxTurnRate = aParams.maxTurnRate;
        this._target = aParams.target;

        this._wobble = 0;
        this._wobbleActive = false;
        this._wobbleTime = .5;
        this._wobbleDir = MyMath.randomSign();

        this.updateDirection(0.01, true);
        
    }

    private getDirrection(): THREE.Vector3 {
        let dir = new THREE.Vector3(0, 0, 1);
        dir = dir.applyQuaternion(this._mesh.quaternion);
        return dir;
    }

    private updateDirection(dt: number, withLog = false) {

        if (this._target && this._target.hp > 0 && this._target.position) {

            let targetPos: THREE.Vector3;
            try {
                targetPos = this._target.position.clone();
            } catch (error) {
                this._target = null;
                return;
            }

            // Calculate the angle from the missile to the mouse cursor game.input.x
            // and game.input.y are the mouse position; substitute with whatever
            // target coordinates you need.
            let dir = this.getDirrection();
            let pos = this.position;
            let angle = dir.angleTo(targetPos.clone().sub(pos));
            const anFactor = Math.min(1, Math.PI / 6 / angle);

            let targetAngle = MyMath.angleBetweenVectors(
                { x: 1, y: 0 },
                { x: targetPos.x - pos.x, y: targetPos.z - pos.z }
            );

            if (withLog) {
                this.logDebug(`missile data:`, {
                    testAn1: MyMath.toDeg(MyMath.angleBetweenVectors({ x: 1, y: 0 }, { x: 0, y: 1 })),
                    testAn2: MyMath.toDeg(MyMath.angleBetweenVectors({ x: 1, y: 0 }, { x: 0, y: -1 })),
                    pos: pos,
                    dir: dir,
                    targetPos: targetPos,
                    currAngleY: MyMath.toDeg(this._mesh.rotation.y),
                    targetAngle: MyMath.toDeg(targetAngle),
                    angleTo: MyMath.toDeg(angle)
                });
            }

            const prevQuat = this._mesh.quaternion.clone();
            this.lookAt(targetPos);
            let targetQuaternion = this._mesh.quaternion.clone();
            // targetAngle = this._mesh.rotation.y;
            this._mesh.quaternion.copy(prevQuat);

            this._mesh.quaternion.slerp(targetQuaternion, dt * this._params.maxTurnRate * anFactor * this._globalTurnFactor);
            // this._mesh.rotation.y = targetAngle;

            // Add our "wobble" factor to the targetAngle to make the missile wobble
            // Remember that this.wobble is tweening (above)
            // targetAngle += MyMath.toRadian(this._wobble);

            // Gradually (this.TURN_RATE) aim the missile towards the target angle
            // if (this._mesh.rotation.y !== targetAngle) {
            //     // Calculate difference between the current angle and targetAngle
            //     var delta = targetAngle - this._mesh.rotation.y;

            //     // Keep it in range from -180 to 180 to make the most efficient turns.
            //     if (delta > Math.PI) delta -= Math.PI * 2;
            //     if (delta < -Math.PI) delta += Math.PI * 2;

            //     if (delta > 0) {
            //         // Turn clockwise
            //         this._mesh.rotation.y += TURN_RATE;
            //     } else {
            //         // Turn counter-clockwise
            //         this._mesh.rotation.y -= TURN_RATE;
            //     }

            //     // Just set angle to target angle if they are close
            //     if (Math.abs(delta) < MyMath.toRadian(TURN_RATE)) {
            //         this._mesh.rotation.y = targetAngle;
            //     }
            // }

        }

    }

    private getVectorVelocity(): THREE.Vector3 {
        let v = this.getDirrection();
        v.multiplyScalar(this._maxVelocity);
        return v;
    }

    private updateVelocity(dt: number) {
        let vel = this.getVectorVelocity();
        vel.multiplyScalar(dt * ACCEL);
        this._velocity.add(vel);
        this._velocity.clampLength(0, this._maxVelocity);
    }

    private updatePosition(dt: number) {
        this._mesh.position.x += this._velocity.x * dt;
        this._mesh.position.z += this._velocity.z * dt;
    }

    private updateWobble(dt: number) {
        this._wobbleTime += this._wobbleDir * dt;

        if (this._wobbleTime >= 1) {
            this._wobbleTime = 1;
            this._wobbleDir *= -1;
        }

        if (this._wobbleTime <= -1) {
            this._wobbleTime = -1;
            this._wobbleDir *= -1;
        }

        this._wobble = EaseUtils.easeInOutSine(this._wobbleTime) * WOBBLE_LIMIT;

    }

    getCreateData(): ObjectCreateData {
        return {
            type: this._type,
            owner: this.owner,
            hp: this.hp,
            shield: this.shield,
            id: this.id,
            radius: this.radius,
            attackRadius: this._attackParams.radius,
            pos: {
                x: this.mesh.position.x,
                y: this.mesh.position.y,
                z: this.mesh.position.z,
            },
            q: {
                x: this.mesh.quaternion.x,
                y: this.mesh.quaternion.y,
                z: this.mesh.quaternion.z,
                w: this.mesh.quaternion.w
            }
        };
    }

    getUpdateData(): ObjectUpdateData {
        return {
            id: this.id,
            pos: {
                x: this.mesh.position.x,
                y: this.mesh.position.y,
                z: this.mesh.position.z,
            },
            q: {
                x: this.mesh.quaternion.x,
                y: this.mesh.quaternion.y,
                z: this.mesh.quaternion.z,
                w: this.mesh.quaternion.w
            }
        };
    }

    update(dt: number) {
        this.updateWobble(dt);

        if (this._globalTurnFactor < 1) {
            this._globalTurnFactor += dt * .5;
            if (this._globalTurnFactor > 1) this._globalTurnFactor = 1;
        }
        this.updateDirection(dt);

        this.updateVelocity(dt);
        this.updatePosition(dt);
    }
    
}