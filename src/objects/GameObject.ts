import * as THREE from 'three';
import { IUpdatable } from "../interfaces/IUpdatable.js";
import { ObjectCreateData, ObjectUpdateData } from "../data/Types.js";
import { MyMath } from '../utils/MyMath.js';
import { ILogger } from '../interfaces/ILogger.js';
import { LogMng } from '../utils/LogMng.js';

export type GameObjectParams = {
    owner: string,
    id: number,
    radius: number,
    position?: THREE.Vector3 | { x: number, y: number },
    hp?: number,
    isImmortal?: boolean,
    attackParams?: {
        radius: number,
        minDamage: number,
        maxDamage: number,
    }
    
}

export class GameObject implements IUpdatable, ILogger {
    protected _className: string;
    protected _mesh: THREE.Mesh;
    // owner wallet id
    private _owner: string;
    // game object id
    protected _id: number;
    // object radius
    private _radius: number;
    protected _hp: number;
    private _isImmortal = false;
    protected _attackParams: {
        radius: number,
        minDamage: number,
        maxDamage: number
    };

    constructor(aParams: GameObjectParams) {
        this.initMesh();

        this._owner = aParams.owner;
        this._id = aParams.id;

        if (aParams.position) {
            if (aParams.position instanceof THREE.Vector3) {
                this._mesh.position.copy(aParams.position);
            }
            else {
                let pos = new THREE.Vector3(aParams.position.x, 0, aParams.position.y);
                this._mesh.position.copy(pos);
            }
        }

        this._radius = aParams.radius;
        this.hp = aParams.hp || 0;
        this._isImmortal = aParams.isImmortal || false;
        this._attackParams = aParams.attackParams || null;

    }

    logDebug(aMsg: string, aData?: any): void {
        LogMng.debug(`${this._className}: ${aMsg}`, aData);
    }
    logWarn(aMsg: string, aData?: any): void {
        LogMng.warn(`${this._className}: ${aMsg}`, aData);
    }
    logError(aMsg: string, aData?: any): void {
        LogMng.error(`${this._className}: ${aMsg}`, aData);
    }

    protected initMesh() {
        let g = new THREE.BoxGeometry(1, 1, 1);
        this._mesh = new THREE.Mesh(g);
    }

    get owner(): string {
        return this._owner;
    }
    get id(): number {
        return this._id;
    }
    get radius(): number {
        return this._radius;
    }
    get hp(): number {
        return this._hp;
    }
    set hp(value: number) {
        let newHp = Math.max(0, value);
        this._hp = newHp;
    }
    get isImmortal() {
        return this._isImmortal;
    }
    get attackRadius() {
        return this._attackParams.radius;
    }
    get position(): THREE.Vector3 {
        return this._mesh.position.clone();
    }

    getAttackDamage(): number {
        return MyMath.randomInRange(this._attackParams.minDamage, this._attackParams.maxDamage);
    }

    lookAt(aTarget: THREE.Vector3) {
        // let p = new THREE.Vector3(aPoint.x, 0, aPoint.y);
        this._mesh.lookAt(aTarget);
    }

    lookByDir(aDir: THREE.Vector3) {
        let p = aDir.clone();
        p.add(this._mesh.position);
        this._mesh.lookAt(p);
    }

    moveTo(aPosition: { x: number, y: number }) {
        
    }

    getCreateData(): ObjectCreateData {
        return null;
    }

    getUpdateData(): ObjectUpdateData {
        return null;
    }

    update(dt: number) {
        
    }

    free() {
        this._mesh = null;
        this._attackParams = null;
    }

}