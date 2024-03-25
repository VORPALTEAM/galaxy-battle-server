import { ILogger } from "../interfaces/ILogger.js";
import { Star } from "../objects/Star.js";
import { LogMng } from "../utils/LogMng.js";
import { ObjectController } from "src/controllers/ObjectController.js";

export class StarController implements ILogger {
    protected _className = 'StarManager';
    protected _objectController: ObjectController;

    constructor(aObjectController: ObjectController) {
        this._objectController = aObjectController;
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

    private onStarAttack(aStar: Star) {
        // check for enemy around
        let enemies = this._objectController.getEnemiesInAtkRadius(aStar);
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            // attack enemy
            const dmg = aStar.getAttackDamage();
            enemy.damage(dmg);
        }
    }

    addStar(aStar: Star) {
        aStar.onAttack.add(this.onStarAttack, this);
    }

    free() {
        this._objectController = null;
    }

}