import * as THREE from 'three';
import { ILogger } from "../interfaces/ILogger.js";
import { Star } from "../objects/Star.js";
import { LogMng } from "../utils/LogMng.js";
import { Field } from "../objects/Field.js";
import { GameObject } from "../objects/GameObject.js";
import { Signal } from "../utils/events/Signal.js";
import { Client } from "../models/Client.js";
import { Planet } from "../objects/Planet.js";
import { PlanetLaserData } from "../data/Types.js";

export class AbilsManager implements ILogger {
    protected _className = 'AbilsManager';
    protected _objects: Map<number, GameObject>;
    protected _thinkTimer = 0;
    onLaserAttack = new Signal();

    constructor(aObjects: Map<number, GameObject>) {
        this._objects = aObjects;
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

    private getEnemiesFor(aPlayerWalletId: string): {
        objects: GameObject[],
        meshes: THREE.Mesh[]
    } {
        let res: {
            objects: GameObject[],
            meshes: THREE.Mesh[]
        } = {
            objects: [],
            meshes: []
        }
        this._objects.forEach(obj => {
            const isEnemy = obj.owner != aPlayerWalletId;
            if (isEnemy && !obj.isImmortal && !(obj instanceof Star)) {
                res.objects.push(obj);
                res.meshes.push(obj.mesh);
            }
        });
        return res;
    }

    private getPlanetByPlayer(aOwner: string): Planet {
        let res: Planet;
        this._objects.forEach(obj => {
            const isEnemy = obj.owner != aOwner;
            if (!isEnemy && obj instanceof Planet) {
                res = obj;
            }
        });
        return res;
    }

    laserAttack(aClient: Client) {
        let planet = this.getPlanetByPlayer(aClient.walletId);
        if (!planet) return;
        let dir = planet.getDirrection();

        const damage = 200;

        let raycaster = new THREE.Raycaster(planet.position, dir, 0, 500);
        let objects = this.getEnemiesFor(planet.owner);
        const intersects = raycaster.intersectObjects(objects.meshes);
        for (let i = 0; i < intersects.length; i++) {
            let mesh = intersects[i].object;
            const id = objects.meshes.indexOf(mesh as any);
            let obj = objects.objects[id];
            obj.hp -= damage;
        }

        let data: PlanetLaserData = {
            planetId: planet.id,
            dir: dir
        }
        this.onLaserAttack.dispatch(this, data);

    }

    free() {
        // this._field = null;
        this._objects.clear();
        this._objects = null;
    }

}