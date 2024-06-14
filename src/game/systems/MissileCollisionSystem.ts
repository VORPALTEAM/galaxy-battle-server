import { LogMng } from "../../monax/LogMng.js";
import { ILogger } from "../../interfaces/ILogger.js";
import { IUpdatable } from "../../interfaces/IUpdatable.js";
import { GameObject } from "../objects/GameObject.js";
import { HomingMissile } from "../objects/HomingMissile.js";
import { Signal } from "../../monax/events/Signal.js";
import { Star } from "../objects/Star.js";

export class MissileCollisionSystem implements ILogger, IUpdatable {
    protected _className = 'MissileCollisionSystem';
    protected _objects: Map<number, GameObject>;
    protected _missiles: Map<number, HomingMissile>;
    protected _timerUpdate = 0;
    protected _timeUpdate = .2;
    onCollisionSignal = new Signal();

    constructor(aObjects: Map<number, GameObject>, aMissiles: Map<number, HomingMissile>) {
        this._objects = aObjects;
        this._missiles = aMissiles;
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

    private isCollide(aMissile: GameObject, aObject: GameObject): boolean {
        if (aObject instanceof Star || aMissile.owner != aObject.owner) {
            const dist = aMissile.position.distanceTo(aObject.position);
            return dist <= (aMissile.radius + aObject.radius);
        }
        return false;
    }

    private checkCollision() {
        this._missiles.forEach((aMissile) => {
            let isCollided = false;
            this._objects.forEach((aObj) => {
                if (isCollided) return;
                if (this.isCollide(aMissile, aObj)) {
                    isCollided = true;
                    this.onCollisionSignal.dispatch(aMissile, aObj);
                }
            });
        });
    }

    free() {
        this.onCollisionSignal.removeAll();
        this.onCollisionSignal = null;
        this._objects = null;
        this._missiles = null;
    }

    update(dt: number) {
        this._timerUpdate -= dt;
        if (this._timerUpdate <= 0) {
            this._timerUpdate = this._timeUpdate;
            this.checkCollision();
        }
    }

}