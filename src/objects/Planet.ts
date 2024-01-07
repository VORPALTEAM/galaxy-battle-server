import { Signal } from "../utils/events/Signal.js";
import { ObjectUpdateData, StarCreateData } from "../data/Types.js";
import { GameObject, GameObjectParams } from "./GameObject.js";

export type PlanetParams = GameObjectParams & {
    orbitCenter: THREE.Vector3, // planet orbit center
    orbitRadius: number, // planet orbit radius
    startOrbitAngle: number, // start orbit angle
    orbitRotationPeriod: number, // planet orbit rotation period in sec
    rotationPeriod: number, // planet rotation period in sec
    startAngle: number, // start planet angle
}

export class Planet extends GameObject {
    protected _orbitCenter: THREE.Vector3;
    protected _orbitRadius: number;
    protected _orbitRotationPeriod: number; // sec
    protected _rotationPeriod: number; // sec

    protected _orbitSpeed: number; // rad / sec
    protected _orbitAngle: number;
    protected _rotationSpeed: number;
    protected _angle: number;


    constructor(aParams: PlanetParams) {
        super(aParams);
        this._className = 'Planet';

        this._orbitCenter = aParams.orbitCenter;
        this._orbitRadius = aParams.orbitRadius;
        this._orbitRotationPeriod = aParams.orbitRotationPeriod;
        this._rotationPeriod = aParams.rotationPeriod;

        this._orbitSpeed = (Math.PI * 2) / this._orbitRotationPeriod;
        this._orbitAngle = aParams.startOrbitAngle;

        this._rotationSpeed = (Math.PI * 2) / this._rotationPeriod;
        this._angle = aParams.startAngle;

        this.updatePosition();
        // this.updateRotation();

    }

    protected updatePosition() {
        this._mesh.position.x = this._orbitCenter.x + Math.cos(this._orbitAngle) * this._orbitRadius;
        this._mesh.position.y = this._orbitCenter.y;
        this._mesh.position.z = this._orbitCenter.z + Math.sin(this._orbitAngle) * this._orbitRadius;
        // this.logDebug(`updatePosition:`, {
        //     orbitCenter: this._orbitCenter,
        //     orbitAngle: this._orbitAngle,
        //     orbitRadius: this._orbitRadius,
        //     pos: this._mesh.position
        // });
    }

    protected updateRotation() {
        this._mesh.rotation.y = this._angle;
    }

    getCreateData(): StarCreateData {
        return {
            id: this.id,
            type: 'Planet',
            owner: this.owner,
            radius: this.radius,
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
        this._orbitAngle += this._orbitSpeed * dt;
        this.updatePosition();
        this._angle += this._rotationSpeed * dt;
        this.updateRotation();
    }

}