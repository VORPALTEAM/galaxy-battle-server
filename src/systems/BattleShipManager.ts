import { ILogger } from "../interfaces/ILogger.js";
import { Star } from "../objects/Star.js";
import { LogMng } from "../utils/LogMng.js";
import { Field } from "../objects/Field.js";
import { GameObject } from "../objects/GameObject.js";
import { BattleShip } from "../objects/BattleShip.js";
import { SpaceShip } from "../objects/SpaceShip.js";
import { AttackType } from "src/data/Types.js";

export class BattleShipManager implements ILogger {
    protected _className = 'BattleShipManager';
    protected _field: Field;
    protected _objects: Map<number, GameObject>;
    protected _thinkTimer = 0;

    constructor(aField: Field, aObjects: Map<number, GameObject>) {
        this._field = aField;
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

    private getNearestEnemyInAtkRadius(aFighter: BattleShip): GameObject {
        let minDist = Number.MAX_SAFE_INTEGER;
        let enemy: GameObject = null;
        let starFound = false;
        this._objects.forEach(obj => {

            if (starFound) return;

            const dist = aFighter.position.distanceTo(obj.position);
            const isEnemy = obj.owner != aFighter.owner;
            if (isEnemy && !obj.isImmortal) {
                const isEnemyStar = obj instanceof Star;
                // this.logDebug(`getNearestEnemyInAtkRadius: atkRadius: ${aFighter.attackRadius} dist: ${dist}`);
                if (dist <= aFighter.attackRadius && (dist < minDist || isEnemyStar)) {
                    minDist = dist;
                    enemy = obj;
                    if (isEnemyStar) starFound = true;
                }
            }

        });
        return enemy;
    }

    private getEnemyStar(aFighter: BattleShip): Star {
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
    
    updateShip(aShip: BattleShip) {

        switch (aShip.state) {

            case 'idle': {

                // check for enemy
                let enemy = this.getNearestEnemyInAtkRadius(aShip);
                if (enemy instanceof SpaceShip) {
                    if (enemy.state == 'jump') enemy = null;
                }
                if (enemy) {
                    // attack enemy
                    const atkType: AttackType = enemy instanceof Star ? 'ray' : 'laser';
                    aShip.attackTarget(enemy, atkType);
                    return;
                }

                // if no enemy, get the enemy star
                let enemyStar = this.getEnemyStar(aShip);
                if (!enemyStar) {
                    return;
                }

                // move to enemy star

                // get the star pos
                let starCellPos = this._field.globalVec3ToCellPos(enemyStar.position);
                let cells = this._field.getNeighbors(starCellPos, true);
                if (cells.length <= 0) {
                    // no free places near from Enemy Star
                    // we don't care
                    // return;
                }
                // sort places
                cells.sort((c1, c2) => {
                    const c1Pos = this._field.cellPosToGlobalVec3(c1);
                    const c2Pos = this._field.cellPosToGlobalVec3(c2);
                    const dist1 = aShip.position.distanceTo(c1Pos);
                    const dist2 = aShip.position.distanceTo(c2Pos);
                    return dist1 - dist2;
                });
                // get nearest place
                let targetCell = cells[0];

                // get the cell pos of the fighter
                let fighterCellPos = this._field.globalVec3ToCellPos(aShip.position);

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

                // remove last points
                let isFinalPointFound = false;
                let id = path.length - 1;
                for (let i = 0; i < path.length; i++) {
                    const cell = path[i];
                    let cellPos = this._field.cellPosToGlobalVec3(cell);
                    if (enemyStar.position.distanceTo(cellPos) <= aShip.attackRadius) {
                        isFinalPointFound = true;
                        id = i;
                        break;
                    }
                }
                if (isFinalPointFound) {
                    const cnt = path.length - 1 - id;
                    // this.logDebug(`isFinalPointFound:`, {
                    //     pathLen: path.length,
                    //     id: id,
                    //     cnt: cnt
                    // });
                    path.splice(id + 1, cnt);
                }

                // get the next cell of path, goto this cell
                let nextCell = path[1] || path[0];
                if (!nextCell) {
                    // path not found
                    return;
                }
                
                let nextCellPos = this._field.cellPosToGlobalVec3(nextCell);
                aShip.jumpTargetCell = nextCell;
                aShip.rotateToCellForJump(nextCellPos);

            } break;

            case 'rotateForJump': {
                if (aShip.isTurning) {
                    // still turning
                    return;
                }

                // check for enemy
                let enemy = this.getNearestEnemyInAtkRadius(aShip);
                if (enemy) {
                    aShip.setState('idle');
                    return;
                }

                let fighterCellPos = this._field.globalVec3ToCellPos(aShip.position);
                let nextCell = aShip.jumpTargetCell;
                if (!nextCell) {
                    // this.logWarn(`!nextCell`);
                    aShip.setState('idle');
                    return;
                }

                if (this._field.isCellTaken(nextCell)) {
                    // this.logWarn(`cell is taken!`);
                    aShip.setState('idle');
                    return;
                }

                let nextPos = this._field.cellPosToGlobalVec3(nextCell);
                aShip.jumpTo(nextPos);
                this._field.takeOffCell(fighterCellPos);
                this._field.takeCell(nextCell.x, nextCell.y);

            } break;

            default:
                // this.logWarn(`unknown Fighter state = ${aShip.state}`);
                break;
        }

    }

    free() {
        this._field = null;
        this._objects.clear();
        this._objects = null;
    }

}