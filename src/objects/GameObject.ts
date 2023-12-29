import * as THREE from 'three';
import { IUpdatable } from "../interfaces/IUpdatable.js";
import { ObjectCreateData, ObjectUpdateData } from "../data/Types.js";

export type GameObjectParams = {
    owner: string,
    id: number,
    position: THREE.Vector3 | { x: number, y: number },
    // lookAt?: THREE.Vector3 | { x: number, y: number },
    radius: number,
    hp?: number
}

export class GameObject implements IUpdatable {
    protected _mesh: THREE.Mesh;
    // owner wallet id
    owner: string;
    // game object id
    id: number;
    radius: number;
    hp: number;

    constructor(aParams: GameObjectParams) {
        this.initMesh();

        this.owner = aParams.owner;
        this.id = aParams.id;

        if (aParams.position instanceof THREE.Vector3) {
            this._mesh.position.copy(aParams.position);
        }
        else {
            let pos = new THREE.Vector3(aParams.position.x, 0, aParams.position.y);
            this._mesh.position.copy(pos);
        }

        this.radius = aParams.radius;
        this.hp = aParams.hp || 0;

    }

    protected initMesh() {
        let g = new THREE.BoxGeometry(1, 1, 1);
        this._mesh = new THREE.Mesh(g);
    }

    get position(): THREE.Vector3 {
        return this._mesh.position.clone();
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