import { ILogger } from "../interfaces/ILogger.js";
import { Star } from "../objects/Star.js";
import { LogMng } from "../utils/LogMng.js";
import { Field } from "../objects/Field.js";
import { GameObject } from "../objects/GameObject.js";
import { SpaceShip } from "../objects/SpaceShip.js";
import { AttackType } from "../data/Types.js";
import { Tower } from "../objects/Tower.js";
import { Linkor } from "../objects/Linkor.js";

export class TowerManager implements ILogger {
    protected _className = 'TowerManager';
    protected _field: Field;
    protected _objects: Map<number, GameObject>;
    protected _thinkTimer = 0;

    constructor(aParams: {
        field: Field,
        objects: Map<number, GameObject>
    }) {
        this._field = aParams.field;
        this._objects = aParams.objects;
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

    private getNearestEnemyInAtkRadius(aTower: Tower): GameObject {
        let minDist = Number.MAX_SAFE_INTEGER;
        let enemy: GameObject = null;
        let mainTargetFound = false;
        this._objects.forEach(obj => {

            if (mainTargetFound) return;
            
            const dist = aTower.position.distanceTo(obj.position);
            const isEnemy = obj.owner != aTower.owner;
            if (isEnemy && !obj.isImmortal) {
                const isEnemyLinkor = obj instanceof Linkor;
                // this.logDebug(`getNearestEnemyInAtkRadius: atkRadius: ${aFighter.attackRadius} dist: ${dist}`);
                if (dist <= aTower.attackRadius && (dist < minDist || isEnemyLinkor)) {
                    minDist = dist;
                    enemy = obj;
                    if (isEnemyLinkor) mainTargetFound = true;
                }
            }

        });
        return enemy;
    }
    
    updateTower(aTower: Tower) {

        switch (aTower.state) {

            case 'idle': {

                // check for enemy
                let enemy = this.getNearestEnemyInAtkRadius(aTower);
                if (enemy instanceof SpaceShip) {
                    if (enemy.state == 'jump') enemy = null;
                }
                if (enemy) {
                    // attack enemy
                    const atkType: AttackType = enemy instanceof Star ? 'ray' : 'laser';
                    aTower.attackTarget(enemy, atkType);
                    return;
                }
                
            } break;
            
        }

    }

    free() {
        this._field = null;
        this._objects.clear();
        this._objects = null;
    }

}