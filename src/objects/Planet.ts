import * as THREE from 'three';
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
    laserDamage: number
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

    private _laserDamage: number;
    
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

        this._laserDamage = aParams.laserDamage;

        this.updatePosition();
        this.updateRotation();

    }

    protected updatePosition() {
        this.mesh.position.x = this._orbitCenter.x + Math.cos(this._orbitAngle) * this._orbitRadius;
        this.mesh.position.y = this._orbitCenter.y;
        this.mesh.position.z = this._orbitCenter.z + Math.sin(this._orbitAngle) * this._orbitRadius;
    }

    protected updateRotation() {
        this.mesh.rotation.y = this._angle;
    }

    get laserDamage(): number {
        return this._laserDamage;
    }

    getDirrection(): THREE.Vector3 {
        let dir = new THREE.Vector3(0, 0, 1);
        dir.applyQuaternion(this.mesh.quaternion);
        return dir;
    }

    getCreateData(): StarCreateData {
        return {
            id: this.id,
            type: 'Planet',
            owner: this.owner,
            radius: this.radius,
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
        this._orbitAngle += this._orbitSpeed * dt;
        this.updatePosition();
        this._angle += this._rotationSpeed * dt;
        this.updateRotation();
    }

}