import * as THREE from 'three';
import { ILogger } from "../../interfaces/ILogger.js";
import { LogMng } from "../../monax/LogMng.js";
import { GameObject } from "../objects/GameObject.js";
import { Planet } from "../objects/Planet.js";
import { Game } from "./Game.js";
import { Field } from '../objects/Field.js';
import { Star } from '../objects/Star.js';
import { Tower } from '../objects/Tower.js';

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

  getPlayerStars(aOwnerId: string): Star[] {
    let star: Star[] = [];
    this._objects.forEach(obj => {
      if (obj instanceof Star && obj.owner == aOwnerId) star.push(obj);
    });
    return star;
  }

  getPlayerPlanet(aOwnerWalletId: string): Planet {
    let planet: Planet;
    this._objects.forEach(obj => {
      if (planet) return;
      if (obj instanceof Planet && obj.owner == aOwnerWalletId) planet = obj;
    });
    return planet;
  }

  getPlayerTowers(aOwnerId: string): Tower[] {
    let towers: Tower[] = [];
    this._objects.forEach(obj => {
      if (obj instanceof Tower && obj.owner == aOwnerId) towers.push(obj);
    });
    return towers;
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

  recoveryPlayerTowersHp(clientId: string) {
    let towers = this.getPlayerTowers(clientId);
    for (let i = 0; i < towers.length; i++) {
      const tower = towers[i];
      tower.recoverHpPercent(.2);
    }
  }

  recoveryPlayerStarHp(clientId: string) {
    let stars = this.getPlayerStars(clientId);
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];
      star.recoverHpPercent(.2);
    }
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