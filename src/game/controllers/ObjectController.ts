import * as THREE from 'three';
import { ILogger } from "../../interfaces/ILogger.js";
import { LogMng } from "../../monax/LogMng.js";
import { GameObject } from "../objects/GameObject.js";
import { Planet } from "../objects/Planet.js";
import { Game } from "./Game.js";
import { Field } from '../objects/Field.js';
import { Star } from '../objects/Star.js';

export class ObjectController implements ILogger {
    protected _className = 'ObjectController';
    protected _game: Game;
    protected _objects: Map<number, GameObject>;
    
    constructor(aGame: Game) {
        this._game = aGame;
        this._objects = new Map();
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

    get objects(): Map<number, GameObject> {
        return this._objects;
    }

    /**
     * Adding new objects to main list of the game
     * @param obj 
     */
    addObject(obj: GameObject) {
        this._objects.set(obj.id, obj);
    }

    getObjectOnCell(aField: Field, aCellPos: { x: number, y: number }): GameObject {
        this._objects.forEach(obj => {
            if (aField.isPosOnCell(obj.position, aCellPos)) {
                return obj;
            }
        });
        return null;
    }

    getAllStars(): Star[] {
        let stars: Star[] = [];
        this._objects.forEach(obj => {
            if (obj instanceof Star) stars.push(obj);
        });
        return stars;
    }

    getPlayerPlanet(aOwnerWalletId: string): Planet {
        let planet: Planet;
        this._objects.forEach(obj => {
            if (planet) return;
            if (obj instanceof Planet && obj.owner == aOwnerWalletId) planet = obj;
        });
        return planet;
    }

    getEnemiesInAtkRadius(aObj: GameObject): GameObject[] {
        const atkRadius = aObj.attackRadius || 0;
        let enemies: GameObject[] = [];
        this._objects.forEach(obj => {
            const dist = aObj.position.distanceTo(obj.position);
            const isEnemy = obj.owner != aObj.owner;
            if (isEnemy && !obj.isImmortal) {
                if (dist <= atkRadius) {
                    enemies.push(obj);
                }
            }
        });
        return enemies;
    }

    getNearestEnemieInAtkRadius(aObj: GameObject): GameObject {
        const atkRadius = aObj.attackRadius || 0;
        let minDist = Number.MAX_SAFE_INTEGER;
        let enemie: GameObject;
        this._objects.forEach(obj => {
            const dist = aObj.position.distanceTo(obj.position);
            const isEnemy = obj.owner != aObj.owner;
            if (isEnemy && !obj.isImmortal) {
                if (dist <= atkRadius && dist < minDist) {
                    minDist = dist;
                    enemie = obj;
                }
            }
        });
        return enemie;
    }

    update(dt: number) {
        // TODO: refactoring to here

    }

    free() {
        this._game = null;
        this._objects.clear();
        this._objects = null;
    }

}