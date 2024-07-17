import { Game } from "./Game.js";
import { ILogger } from "../../interfaces/ILogger.js";
import { Star } from "../objects/Star.js";
import { LogMng } from "../../monax/LogMng.js";
import { ObjectController } from "./ObjectController.js";

export class StarController implements ILogger {
    protected _className = 'StarManager';
    protected _game: Game;
    protected _objectController: ObjectController;

    constructor(aGame: Game, aObjectController: ObjectController) {
        this._game = aGame;
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

    private onStarLinkorSpawn(aStar: Star, aCellDeltaPos) {
        this._game.onStarLinkorSpawn(aStar, aCellDeltaPos)
    }

    private onStarFighterSpawn(aStar: Star, aCellDeltaPos) {
        this._game.onStarFighterSpawn(aStar, aCellDeltaPos)
    }

    addStar(aStar: Star) {
        aStar.onAttack.add(this.onStarAttack, this);
        aStar.onFighterSpawn.add(this.onStarFighterSpawn, this);
        aStar.onLinkorSpawn.add(this.onStarLinkorSpawn, this);
    }

    deactivateStars() {
        let stars = this._objectController.getAllStars();
        for (let i = 0; i < stars.length; i++) {
            const star = stars[i];
            star.isActive = false;
        }
    }
    
    free() {
        this._objectController = null;
    }

}