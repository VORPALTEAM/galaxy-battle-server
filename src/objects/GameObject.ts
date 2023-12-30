import * as THREE from 'three';
import { IUpdatable } from "../interfaces/IUpdatable.js";
import { ObjectCreateData, ObjectUpdateData } from "../data/Types.js";
import { MyMath } from '../utils/MyMath.js';

export type GameObjectParams = {
    owner: string,
    id: number,
    position: THREE.Vector3 | { x: number, y: number },
    radius: number,
    hp?: number,
    attackParams?: {
        radius: number,
        minDamage: number,
        maxDamage: number,
    }
    
}

export class GameObject implements IUpdatable {
    protected _mesh: THREE.Mesh;
    // owner wallet id
    private _owner: string;
    // game object id
    protected _id: number;
    // object radius
    private _radius: number;
    protected _hp: number;
    protected _attackParams: {
        radius: number,
        minDamage: number,
        maxDamage: number
    };

    constructor(aParams: GameObjectParams) {
        this.initMesh();

        this._owner = aParams.owner;
        this._id = aParams.id;

        if (aParams.position instanceof THREE.Vector3) {
            this._mesh.position.copy(aParams.position);
        }
        else {
            let pos = new THREE.Vector3(aParams.position.x, 0, aParams.position.y);
            this._mesh.position.copy(pos);
        }

        this._radius = aParams.radius;
        this.hp = aParams.hp || 0;
        this._attackParams = aParams.attackParams || null;

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

}