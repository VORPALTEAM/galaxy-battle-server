import * as THREE from 'three';
import { ILogger } from "../../interfaces/ILogger.js";
import { Star } from "../objects/Star.js";
import { LogMng } from "../../monax/LogMng.js";
import { GameObject } from "../objects/GameObject.js";
import { Signal } from "../../monax/events/Signal.js";
import { Client } from "../models/Client.js";
import { Planet } from "../objects/Planet.js";
import { PlanetLaserData } from "../data/Types.js";
import { getTargetInSector } from './Utils.js';

export class AbilityManager implements ILogger {
  protected _className = 'AbilityManager';
  protected _objects: Map<number, GameObject>;
  protected _thinkTimer = 0;
  protected _laserAimSectorAngle: number;
  onLaserAttack = new Signal();
  onRocketCreate = new Signal();

  constructor(objects: Map<number, GameObject>,
    laserAimSectorAngle: number // angle in rad
  ) {
    this._objects = objects;
    this._laserAimSectorAngle = laserAimSectorAngle
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

  private getLaserTargetsFor(aPlayerWalletId: string): GameObject[] {
    let res: GameObject[] = [];
    this._objects.forEach(obj => {
      const isEnemy = obj.owner != aPlayerWalletId;
      if ((isEnemy && !obj.isImmortal) || obj instanceof Star) {
        res.push(obj);
      }
    });
    return res;
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

  private getTargetInSectorForLaser(params: {
    objects: GameObject[],
    launchPos: THREE.Vector3,
    dirVector: THREE.Vector3,
    sectorAngle: number // angle in rad
  }): GameObject | null {

    let objects = params.objects.filter(obj => ![Star].some(type => obj instanceof type));

    // calc directionAngle via Math.atan2()
    const directionAngle = Math.atan2(params.dirVector.z, params.dirVector.x);

    const center = params.launchPos;
    // const dirAn = MyMath.toRadian(DATA.angle);
    const sectorRadius = 100;
    const sectorAn = params.sectorAngle;

    let target: GameObject | null = null;

    target = getTargetInSector({
      objects: objects,
      maxRadius: sectorRadius,
      center: center,
      directionAngle: directionAngle,
      sectorAngle: sectorAn,
      isIncSectorAngle: false
    });

    return target;
  }

  laserAttack(aClient: Client, aDamage: number) {

    // this.logDebug(`client (${aClient.gameData.nick}) laserAttack (dmg: ${aDamage})`);

    let planet = this.getPlanetByPlayer(aClient.gameData.id);
    if (!planet) return;
    const origin = planet.getFirePoint();
    let dir = planet.getDirrection();

    const damage = aDamage;
    let rayLen = 500;

    let objects = this.getLaserTargetsFor(planet.owner);

    objects.sort((a, b) => {
      const dist1 = planet.position.distanceTo(a.position);
      const dist2 = planet.position.distanceTo(b.position);
      return dist1 - dist2;
    });

    let targetInSector = this.getTargetInSectorForLaser({
      objects: objects,
      launchPos: origin,
      dirVector: dir,
      sectorAngle: this._laserAimSectorAngle
    });
    if (targetInSector) {
      // console.log(`targetInSector found...`);
      // correction dir
      dir = targetInSector.position.clone().sub(origin).normalize();
    }
    else {
      // console.log(`targetInSector NOT found...`);
    }

    // ray marching
    let checked: number[] = [];

    for (let i = 0; i < rayLen; i++) {
      let m = dir.clone().multiplyScalar(i);
      let p = origin.clone().add(m);
      let isBreak = false;

      // check objects
      for (let j = 0; j < objects.length; j++) {
        if (checked.indexOf(j) >= 0) continue;

        const obj = objects[j];
        const objDist = obj.mesh.position.distanceTo(p);

        if (objDist <= obj.radius) {

          checked.push(j);

          if (obj instanceof Star) {
            rayLen = planet.position.distanceTo(p);
            // this.logDebug(`laser to Star, new len = ${rayLen}`);
            isBreak = true;
            break;
          }
          else {
            obj.damage({
              damage: damage,
              isCrit: false,
              isMiss: false,
              attackerClientId: aClient.gameData.id,
              attacketType: 'Planet'
            });
          }

        }
      }

      if (isBreak) break;
    }

    let data: PlanetLaserData = {
      planetId: planet.id,
      pos: origin,
      dir: dir,
      length: rayLen,
      skin: planet.laserSkin
    }
    this.onLaserAttack.dispatch(this, data);

  }

  free() {
    this._objects.clear();
    this._objects = null;
  }

}