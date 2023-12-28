import * as THREE from 'three';
import { IUpdatable } from "../interfaces/IUpdatable.js";
import { ObjectCreateData, ObjectUpdateData } from "../data/Types.js";
import { Vec2 } from "../utils/MyMath.js";

export type GameObjectParams = {
    owner: string,
    id: number,
    position: THREE.Vector3 | { x: number, y: number },
    radius: number,
    hp?: number
    
}

export class GameObject implements IUpdatable {
    // owner wallet id
    owner: string;
    // game object id
    id: number;
    position: THREE.Vector3;
    radius: number;
    hp: number;

    constructor(aParams: GameObjectParams) {
        this.owner = aParams.owner;
        this.id = aParams.id;
        if (aParams.position instanceof THREE.Vector3) {
            this.position = aParams.position;
        }
        else {
            this.position = new THREE.Vector3(aParams.position.x, aParams.position.y, 0);
        }
        this.radius = aParams.radius;
        this.hp = aParams.hp;
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