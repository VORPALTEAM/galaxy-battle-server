import * as THREE from 'three';
import { Signal } from "../../monax/events/Signal.js";
import { ObjectUpdateData, PlanetLaserSkin, StarCreateData } from "../data/Types.js";
import { GameObject, GameObjectParams } from "./GameObject.js";

export type PlanetParams = GameObjectParams & {
    planetRadius: number,
    orbitCenter: THREE.Vector3, // planet orbit center
    orbitRadius: number, // planet orbit radius
    startOrbitAngle: number, // start orbit angle
    orbitRotationPeriod: number, // planet orbit rotation period in sec
    rotationPeriod: number, // planet rotation period in sec
    startAngle: number, // start planet angle
    laserSkin: PlanetLaserSkin
}

export class Planet extends GameObject {
    protected _laserSkin: PlanetLaserSkin;

    protected _orbitCenter: THREE.Vector3;
    protected _orbitRadius: number;
    protected _orbitRotationPeriod: number; // sec
    protected _rotationPeriod: number; // sec

    protected _orbitSpeed: number; // rad / sec
    protected _orbitAngle: number;
    protected _rotationSpeed: number;
    protected _angle: number;

    protected _speedFactor = 1;

    protected _aimRadius: number;

    constructor(aParams: PlanetParams) {
        super(aParams);
        this._className = 'Planet';

        this._laserSkin = aParams.laserSkin;
        this._orbitCenter = aParams.orbitCenter;
        this._orbitRadius = aParams.orbitRadius;
        this._orbitRotationPeriod = aParams.orbitRotationPeriod;
        this._rotationPeriod = aParams.rotationPeriod;

        this._orbitSpeed = (Math.PI * 2) / this._orbitRotationPeriod;
        this._orbitAngle = aParams.startOrbitAngle;

        this._rotationSpeed = (Math.PI * 2) / this._rotationPeriod;
        this._angle = aParams.startAngle;

        this._aimRadius = aParams.planetRadius * 2;

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

    get laserSkin(): PlanetLaserSkin {
        return this._laserSkin;
    }

    getDirrection(): THREE.Vector3 {
        let dir = new THREE.Vector3(0, 0, 1);
        dir.applyQuaternion(this.mesh.quaternion);
        return dir;
    }

    getFirePoint(): THREE.Vector3 {
        let dir = new THREE.Vector3(0, 0, 1);
        dir.applyQuaternion(this.mesh.quaternion).multiplyScalar(this._aimRadius);
        return this.position.clone().add(dir);
    }

    activateSniperSkill(aSpeedFactor: number, aTimeSec: number) {
        this._speedFactor = aSpeedFactor;
        setTimeout(() => {
            this._speedFactor = 1;
        }, aTimeSec * 1000);
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
        this._orbitAngle += this._orbitSpeed * this._speedFactor * dt;
        this.updatePosition();
        this._angle += this._rotationSpeed * this._speedFactor * dt;
        this.updateRotation();
    }

}