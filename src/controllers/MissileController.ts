import * as THREE from 'three';
import { ILogger } from "../interfaces/ILogger.js";
import { LogMng } from "../utils/LogMng.js";
import { Field } from "../objects/Field.js";
import { GameObject } from "../objects/GameObject.js";
import { HomingMissile } from "../objects/HomingMissile.js";
import { IdGenerator } from "../utils/game/IdGenerator.js";
import { Client } from "../models/Client.js";
import { Planet } from "../objects/Planet.js";
import { MyMath } from "../utils/MyMath.js";
import { Game } from "./Game.js";
import { Star } from '../objects/Star.js';

export class MissileController implements ILogger {
    protected _className = 'MissileController';
    protected _game: Game;
    protected _objIdGen: IdGenerator;
    protected _field: Field;
    protected _objects: Map<number, GameObject>;
    protected _missiles: Map<number, HomingMissile>;

    constructor(aParams: {
        game: Game,
        objIdGen: IdGenerator,
        field: Field,
        objects: Map<number, GameObject>
    }) {
        this._game = aParams.game;
        this._objIdGen = aParams.objIdGen;
        this._field = aParams.field;
        this._objects = aParams.objects;
        this._missiles = new Map();
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

    private getTargetObjects(aOwner: string): GameObject[] {
        let res: GameObject[] = [];
        this._objects.forEach(obj => {
            const isEnemy = obj.owner != aOwner;
            if (!isEnemy) return;
            if (obj.isImmortal) return;
            if (obj instanceof Star) return;
            res.push(obj);
        });
        return res;
    }

    private findClosestTargetInSector(aOwner: string,
        missilePosition: { x: number, y: number },
        missileDirectionVector: { x: number, y: number },
        sectorAngle: number
    ): GameObject | null {
        let closestTarget: GameObject | null = null;
        let closestDistance = Infinity;
        let closestAngle = sectorAngle; // Измените, если нужно другое поведение внутри сектора
        let objects = this.getTargetObjects(aOwner);

        for (const obj of objects) {
            const targetVector = { x: obj.position.x - missilePosition.x, y: obj.position.y - missilePosition.y };
            const angle = Math.abs(MyMath.angleBetweenVectors(MyMath.normalizeVector(targetVector), missileDirectionVector));

            if (angle <= sectorAngle / 2) {
                // Цель внутри сектора
                const distance = MyMath.distanceBetween(missilePosition, obj.position);
                if (distance < closestDistance) {
                    closestTarget = obj;
                    closestDistance = distance;
                }
            }
            else {
                // Цель вне сектора, но может быть ближайшей общей
                const distance = MyMath.distanceBetween(missilePosition, obj.position);
                if (distance < closestDistance && (closestTarget === null || angle < closestAngle)) {
                    closestTarget = obj;
                    closestDistance = distance;
                    closestAngle = angle;
                }
            }
        }

        return closestTarget;
    }

    launchMissile(aParams: {
        client: Client,
        damage: number
    }) {
        const damage = aParams.damage;

        let planet = this.getPlanetByPlayer(aParams.client.walletId);
        if (!planet) return;
        let dir = planet.getDirrection();
        const origin = planet.position.clone().add(dir.clone().multiplyScalar(2));
        let target = this.findClosestTargetInSector(aParams.client.walletId,
            { x: origin.x, y: origin.z },
            { x: dir.x, y: dir.z },
            Math.PI / 4
        );

        // this.logDebug(`launchMissile:`, {
        //     target: target
        // });

        const newMissile = new HomingMissile({
            id: this._objIdGen.nextId(),
            level: 1,
            lookDir: dir,
            position: origin,
            target: target,
            maxTurnRate: 1,
            owner: aParams.client.walletId,
            radius: 1,
            velocity: 8,
            hp: 10,
            attackParams: {
                radius: 10,
                damage: [damage, damage]
            }
        });

        this._missiles.set(newMissile.id, newMissile);
        this._game.addObject(newMissile);
    }

    deleteMissile(aId: number) {
        this._missiles.delete(aId);
    }

    free() {
        this._field = null;
        this._missiles.clear();
        this._missiles = null;
    }

    update(dt: number) {
        this._missiles.forEach((obj) => {
            obj.update(dt);
        });
    }
    
}