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

export class PlanetLaserManager implements ILogger {
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

    private getLaserTargetsFor(aPlayerWalletId: string): GameObject[] {
        let res: GameObject[] = [];
        this._objects.forEach(obj => {
            const isEnemy = obj.owner != aPlayerWalletId;
            if ((isEnemy && !obj.isImmortal) || obj instanceof Star) {
                res.push(obj);
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

    laserAttack(aClient: Client, aDamage: number) {
        let planet = this.getPlanetByPlayer(aClient.walletId);
        if (!planet) return;
        const origin = planet.position.clone();
        let dir = planet.getDirrection();

        // const damage = planet.laserDamage;
        const damage = aDamage;
        let rayLen = 500;

        // let raycaster = new THREE.Raycaster(planet.position, dir, 0, rayLen);
        let objects = this.getLaserTargetsFor(planet.owner);

        objects.sort((a, b) => {
            const dist1 = planet.position.distanceTo(a.position);
            const dist2 = planet.position.distanceTo(b.position);
            return dist1 - dist2;
        });

        // ray marching
        let checked: number[] = [];

        for (let i = 0; i < rayLen; i++) {
            let m = dir.clone().multiplyScalar(i);
            let p = origin.clone().add(m);
            let isBreak = false;

            // check objects
            for (let j = 0; j < objects.length; j++) {
                if (checked.indexOf(j) >= 0) continue;

                const obj = objects[j];
                const objDist = obj.mesh.position.distanceTo(p);

                if (objDist <= obj.radius) {

                    checked.push(j);

                    if (obj instanceof Star) {
                        rayLen = planet.position.distanceTo(p);
                        // this.logDebug(`laser to Star, new len = ${rayLen}`);
                        isBreak = true;
                        break;
                    }
                    else {
                        obj.damage({
                            damage: damage,
                            isCrit: false,
                            isMiss: false
                        });
                    }

                }
            }

            if (isBreak) break;
        }

        let data: PlanetLaserData = {
            planetId: planet.id,
            pos: planet.position,
            dir: dir,
            length: rayLen
        }
        this.onLaserAttack.dispatch(this, data);

    }

    free() {
        // this._field = null;
        this._objects.clear();
        this._objects = null;
    }

}