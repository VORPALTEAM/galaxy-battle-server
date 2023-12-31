import { ILogger } from "../interfaces/ILogger.js";
import { Star } from "../objects/Star.js";
import { LogMng } from "../utils/LogMng.js";
import { Field } from "../objects/Field.js";
import { Fighter } from "../objects/Fighter.js";
import { IUpdatable } from "../interfaces/IUpdatable.js";
import { GameObject } from "../objects/GameObject.js";

const THINK_PERIOD = 10;

export class FighterManager implements ILogger {
    protected _field: Field;
    protected _objects: Map<number, GameObject>;
    protected _thinkTimer = 0;

    constructor(aField: Field, aObjects: Map<number, GameObject>) {
        this._field = aField;
        this._objects = aObjects;
    }

    logDebug(aMsg: string, aData?: any): void {
        LogMng.debug(`FighterManager: ${aMsg}`, aData);
    }
    logWarn(aMsg: string, aData?: any): void {
        LogMng.warn(`FighterManager: ${aMsg}`, aData);
    }
    logError(aMsg: string, aData?: any): void {
        LogMng.error(`FighterManager: ${aMsg}`, aData);
    }

    private getNearestEnemyInAtkRadius(aFighter: Fighter): GameObject {
        let minDist = Number.MAX_SAFE_INTEGER;
        let enenmy: GameObject = null;
        this._objects.forEach(obj => {
            const dist = aFighter.position.distanceTo(obj.position);
            const isEnemy = obj.owner != aFighter.owner;
            if (isEnemy && !obj.isImmortal) {
                // this.logDebug(`getNearestEnemyInAtkRadius: atkRadius: ${aFighter.attackRadius} dist: ${dist}`);
                if (dist <= aFighter.attackRadius && dist < minDist) {
                    minDist = dist;
                    enenmy = obj;
                }
            }
        });
        return enenmy;
    }

    private getEnemyStar(aFighter: Fighter): Star {
        let stars: Star[] = [];
        this._objects.forEach(obj => {
            if (obj instanceof Star) {
                if (obj.owner != aFighter.owner) {
                    stars.push(obj);
                }
            }
        });
        return stars[0];
    }
    
    updateShip(aFighter: Fighter, dt: number) {

        // this.logDebug(`updateShip id = ${aFighter.id}`);

        // this._thinkTimer -= dt;
        // if (this._thinkTimer > 0) return;
        // this._thinkTimer = THINK_PERIOD;

        switch (aFighter.state) {

            case 'idle':
                // check for enemy
                let enemy = this.getNearestEnemyInAtkRadius(aFighter);
                if (enemy) {
                    // attack enemy
                    // this.logDebug(`fighter attack!`);
                    aFighter.attackTarget(enemy);
                    return;
                }
                
                // if no enemy, get the enemy star
                let enemyStar = this.getEnemyStar(aFighter);
                if (!enemyStar) {
                    // this.logDebug(`!enemyStar -> return`);
                    return;
                }

                // get the star pos
                let starCellPos = this._field.globalVec3ToCellPos(enemyStar.position);
                let cells = this._field.getNeighbors(starCellPos, true);
                if (cells.length <= 0) {
                    // no free places near from Enemy Star
                    return;
                }
                // sort places
                cells.sort((c1, c2) => {
                    const c1Pos = this._field.cellPosToGlobalVec3(c1.x, c1.y);
                    const c2Pos = this._field.cellPosToGlobalVec3(c2.x, c2.y);
                    const dist1 = aFighter.position.distanceTo(c1Pos);
                    const dist2 = aFighter.position.distanceTo(c2Pos);
                    return dist1 - dist2;
                });
                // get nearest place
                let targetCell = cells[0];

                // get the cell pos of the fighter
                let fighterCellPos = this._field.globalVec3ToCellPos(aFighter.position);

                // get the path
                let path = this._field.findPath(
                    fighterCellPos.x, fighterCellPos.y,
                    targetCell.x, targetCell.y
                );

                // this.logDebug(`fighter path from (${fighterCellPos.x},${fighterCellPos.y}) to (${starCellPos.x},${starCellPos.y})`, path);
                
                if (!path) {
                    // path not found
                    return;
                }

                // get the next cell of path, goto this cell
                let nextCell = path[0];
                if (!nextCell) {
                    // path not found
                    return;
                }

                let nextPos = this._field.cellPosToGlobalVec3(nextCell.x, nextCell.y);
                // this.logDebug(`move ship (${fighterCellPos.x}, ${fighterCellPos.y}) => (${nextCell.x}, ${nextCell.y})`);
                aFighter.moveTo(nextPos);

                this._field.takeOffCell(fighterCellPos);
                this._field.takeCell(nextCell.x, nextCell.y);

                break;
        
            default:
                // this.logWarn(`unknown Fighter state = ${aFighter.state}`);
                break;
        }
    }

    free() {
        this._field = null;
        this._objects.clear();
        this._objects = null;
    }

}