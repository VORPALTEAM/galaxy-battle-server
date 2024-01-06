import { ILogger } from "../interfaces/ILogger.js";
import { Star } from "../objects/Star.js";
import { LogMng } from "../utils/LogMng.js";
import { Field } from "../objects/Field.js";
import { GameObject } from "../objects/GameObject.js";
import { Signal } from "../utils/events/Signal.js";

export class StarManager implements ILogger {
    protected _objects: Map<number, GameObject>;
    protected _thinkTimer = 0;

    constructor(aObjects: Map<number, GameObject>) {
        this._objects = aObjects;
    }

    logDebug(aMsg: string, aData?: any): void {
        LogMng.debug(`StarManager: ${aMsg}`, aData);
    }
    logWarn(aMsg: string, aData?: any): void {
        LogMng.warn(`StarManager: ${aMsg}`, aData);
    }
    logError(aMsg: string, aData?: any): void {
        LogMng.error(`StarManager: ${aMsg}`, aData);
    }

    private getEnemiesInAtkRadius(aStar: Star): GameObject[] {
        let minDist = Number.MAX_SAFE_INTEGER;
        let enenmies: GameObject[] = [];
        this._objects.forEach(obj => {
            const dist = aStar.position.distanceTo(obj.position);
            const isEnemy = obj.owner != aStar.owner;
            if (isEnemy && !obj.isImmortal) {
                // this.logDebug(`getNearestEnemyInAtkRadius: atkRadius: ${aFighter.attackRadius} dist: ${dist}`);
                if (dist <= aStar.attackRadius && dist < minDist) {
                    minDist = dist;
                    enenmies.push(obj);
                }
            }
        });
        return enenmies;
    }


    private onStarAttack(aStar: Star) {
        // check for enemy around
        let enemies = this.getEnemiesInAtkRadius(aStar);
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            // attack enemy
            const dmg = aStar.getAttackDamage();
            enemy.hp -= dmg;
        }
    }

    addStar(aStar: Star) {
        aStar.onAttack.add(this.onStarAttack, this);
    }

    free() {
        // this._field = null;
        this._objects.clear();
        this._objects = null;
    }

}