import * as THREE from 'three';
import { ILogger } from "../../interfaces/ILogger.js";
import { LogMng } from "../../monax/LogMng.js";
import { GameObject } from "../objects/GameObject.js";
import { HomingMissile } from "../objects/HomingMissile.js";
import { IdGenerator } from "../../monax/game/IdGenerator.js";
import { Client } from "../models/Client.js";
import { Planet } from "../objects/Planet.js";
import { MyMath } from "../../monax/MyMath.js";
import { Game } from "./Game.js";
import { Star } from '../objects/Star.js';
import { MissileCollisionSystem } from '../systems/MissileCollisionSystem.js';
import { PackSender } from '../services/PackSender.js';

export class MissileController implements ILogger {
    protected _className = 'MissileController';
    protected _game: Game;
    protected _objIdGen: IdGenerator;
    protected _objects: Map<number, GameObject>;
    protected _missiles: Map<number, HomingMissile>;
    protected _collisionSystem: MissileCollisionSystem;
    protected _clients: Client[];

    constructor(aGame: Game, aObjIdGen: IdGenerator, aObjects: Map<number, GameObject>, aClients: Client[]) {
        this._game = aGame;
        this._objIdGen = aObjIdGen;
        this._objects = aObjects;
        this._missiles = new Map();
        this._collisionSystem = new MissileCollisionSystem(this._objects, this._missiles);
        this._collisionSystem.onCollisionSignal.add(this.onMissileCollided, this);
        this._clients = aClients;
    }

    free() {
        this._collisionSystem.free();
        this._game = null;
        this._objIdGen = null;
        this._objects = null;
        this._missiles.clear();
        this._missiles = null;
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

    private destroyMissile(aMissile: HomingMissile) {
        aMissile.damage({
            damage: aMissile.hp * 2
        });
    }

    private onMissileCollided(aMissile: HomingMissile, aObject: GameObject) {
        this.destroyMissile(aMissile);
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

    private getObjectsInAtkRadius(aMissile: HomingMissile): GameObject[] {
        let objects: GameObject[] = [];
        this._objects.forEach(obj => {
            const dist = aMissile.position.distanceTo(obj.position);
            // const isEnemy = obj.owner != aMissile.owner;
            if (!obj.isImmortal) {
                if (obj instanceof Star) return;
                if (dist <= aMissile.attackRadius) {
                    objects.push(obj);
                }
            }
        });
        return objects;
    }

    private findClosestTargetInSector(aOwner: string,
        missilePosition: { x: number, y: number },
        missileDirectionVector: { x: number, y: number },
        sectorAngle: number
    ): GameObject | null {
        let closestTarget: GameObject | null = null;
        let closestDistance = Infinity;
        let closestAngle = sectorAngle;
        let objects = this.getTargetObjects(aOwner);

        for (const obj of objects) {
            const targetVector = { x: obj.position.x - missilePosition.x, y: obj.position.y - missilePosition.y };
            const angle = Math.abs(MyMath.angleBetweenVectors(MyMath.normalizeVector(targetVector), missileDirectionVector));

            if (angle <= sectorAngle / 2) {
                // target in sector
                const distance = MyMath.distanceBetween(missilePosition, obj.position);
                if (distance < closestDistance) {
                    closestTarget = obj;
                    closestDistance = distance;
                }
            }
            else {
                // target out of sector, but can be nearest
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
            hp: 100,
            attackParams: {
                radius: 14,
                damage: [damage, damage]
            },
            lifeTime: 15
        });

        this._missiles.set(newMissile.id, newMissile);
        this._game.addObject(newMissile);
    }

    explodeMissile(aMissile: HomingMissile) {
        // explosion missile
        let dmg = aMissile.getAttackDamage({ noCrit: true, noMiss: true });
        let objects = this.getObjectsInAtkRadius(aMissile);
        objects.map(obj => obj.damage(dmg));
        // send explosion pack
        PackSender.getInstance().explosion(this._clients, {
            type: 'rocket',
            pos: aMissile.position
        });
    }

    deleteMissile(aId: number) {
        this._missiles.delete(aId);
    }

    update(dt: number) {
        this._missiles.forEach((obj) => {
            obj.update(dt);
            if (obj.lifeTime <= 0) this.destroyMissile(obj);
        });
        this._collisionSystem.update(dt);
    }
    
}