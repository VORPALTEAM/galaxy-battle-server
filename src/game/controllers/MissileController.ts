import * as THREE from 'three';
import { ILogger } from "../../interfaces/ILogger.js";
import { LogMng } from "../../monax/LogMng.js";
import { GameObject } from "../objects/GameObject.js";
import { HomingMissile } from "../objects/HomingMissile.js";
import { IdGenerator } from "../../monax/game/IdGenerator.js";
import { Client } from "../models/Client.js";
import { Planet } from "../objects/Planet.js";
import { MyMath } from "../../monax/MyMath.js";
import { Game } from "./Game.js";
import { Star } from '../objects/Star.js';
import { MissileCollisionSystem } from '../systems/MissileCollisionSystem.js';
import { PackSender } from '../services/PackSender.js';

export class MissileController implements ILogger {
  protected _className = 'MissileController';
  protected _game: Game;
  protected _objIdGen: IdGenerator;
  protected _objects: Map<number, GameObject>;
  protected _missiles: Map<number, HomingMissile>;
  protected _collisionSystem: MissileCollisionSystem;
  protected _clients: Client[];

  constructor(params: {
    game: Game,
    objIdGen: IdGenerator,
    objects: Map<number, GameObject>,
    clients: Client[]
  }) {
    this._game = params.game;
    this._objIdGen = params.objIdGen;
    this._objects = params.objects;
    this._missiles = new Map();
    this._collisionSystem = new MissileCollisionSystem(this._objects, this._missiles);
    this._collisionSystem.onCollisionSignal.add(this.onMissileCollided, this);
    this._clients = params.clients;
  }

  free() {
    this._collisionSystem.free();
    this._game = null;
    this._objIdGen = null;
    this._objects = null;
    this._missiles.clear();
    this._missiles = null;
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

  private destroyMissile(aMissile: HomingMissile) {
    aMissile.damage({
      damage: aMissile.hp * 2
    });
  }

  private onMissileCollided(aMissile: HomingMissile, aObject: GameObject) {
    this.destroyMissile(aMissile);
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

  private getTargetObjects(aOwner: string): GameObject[] {
    let res: GameObject[] = [];
    this._objects.forEach(obj => {
      const isEnemy = obj.owner != aOwner;
      if (!isEnemy) return;
      if (obj.isImmortal) return;
      if (obj instanceof Star) return;
      if (obj instanceof HomingMissile) return;
      res.push(obj);
    });
    return res;
  }

  private getObjectsInAtkRadius(aMissile: HomingMissile): GameObject[] {
    let objects: GameObject[] = [];
    this._objects.forEach(obj => {
      const dist = aMissile.position.distanceTo(obj.position);
      // const isEnemy = obj.owner != aMissile.owner;
      if (!obj.isImmortal) {
        if (obj instanceof Star) return;
        if (dist <= aMissile.attackRadius) {
          objects.push(obj);
        }
      }
    });
    return objects;
  }

  private getRocketTarget({
    meshes,
    center,
    directionAngle,  // dir angle in rad
    sectorAngle, // angle in rad
    maxRadius,
  }: {
    meshes: GameObject[];
    center: THREE.Vector3;
    directionAngle: number;
    // direction: THREE.Vector3;
    sectorAngle: number;
    maxRadius: number;
  }): GameObject | null {

    const maxSectorAngle = Math.PI * 2;  // 360 deg

    const isMeshInSector = (mesh: GameObject, angle: number): {
      inSector: boolean,
      dist: number
    } => {

      const position = mesh.position.clone().sub(center);
      const distance = position.length();

      if (distance > maxRadius) return {
        inSector: false,
        dist: distance
      }

      // calc angle between sector dir and object
      const objectAngle = Math.atan2(position.z, position.x);
      const angleDifference = THREE.MathUtils.euclideanModulo(objectAngle - directionAngle + Math.PI, Math.PI * 2) - Math.PI;

      return {
        inSector: Math.abs(angleDifference) <= angle / 2,
        dist: distance
      }
    };

    // sector inc cycle
    let lastDist = Number.MAX_SAFE_INTEGER;
    let target: GameObject;
    while (sectorAngle <= maxSectorAngle) {
      for (let mesh of meshes) {
        let inSec = isMeshInSector(mesh, sectorAngle);
        if (inSec.inSector && inSec.dist < lastDist) {
          lastDist = inSec.dist;
          target = mesh;
        }
      }

      if (target) break;

      // inc sector angle
      sectorAngle += Math.max(Math.PI / 20, sectorAngle * 1.1);
    }

    return target;
  }

  private findTarget(params: {
    owner: string,
    launchPos: { x: number, y: number },
    dirVector: { x: number, y: number },
    sectorAngle: number // angle in rad
  }): GameObject | null {

    let objects = this.getTargetObjects(params.owner);

    const lookVector = new THREE.Vector3(params.dirVector.x, 0, params.dirVector.y);
    lookVector.normalize();
    // directionAngle calc via Math.atan2()
    // atan2 get (y, x), y - z-coordinate, x - x-coordinate
    const directionAngle = Math.atan2(lookVector.z, lookVector.x);

    const center = new THREE.Vector3(params.launchPos.x, 0, params.launchPos.y);
    // const dirAn = MyMath.toRadian(DATA.angle);
    const sectorRadius = 100;
    const sectorAn = params.sectorAngle;

    let target: GameObject | null = null;

    target = this.getRocketTarget({
      maxRadius: sectorRadius,
      meshes: objects,
      // { x: origin.x, y: origin.z },
      center: center,
      directionAngle: directionAngle,
      // direction: { x: dir.x, y: dir.z },
      sectorAngle: sectorAn
    });

    return target;

  }

  launchMissile(aParams: {
    client: Client,
    damage: number
  }) {
    const damage = aParams.damage;

    let planet = this.getPlanetByPlayer(aParams.client.gameData.id);
    if (!planet) return;
    let dir = planet.getDirrection();
    const origin = planet.position.clone().add(dir.clone().multiplyScalar(2));

    // let target = this.findClosestTargetInSector(aParams.client.gameData.id,
    //   { x: origin.x, y: origin.z },
    //   { x: dir.x, y: dir.z },
    //   Math.PI / 4
    // );

    // 2nd variant
    // let target = this.findClosestTargetInSector2(aParams.client.gameData.id,
    //   { x: origin.x, y: origin.z },
    //   { x: dir.x, y: dir.z },
    //   Math.PI / 4
    // );

    // 3rd variant
    let target = this.findTarget({
      owner: aParams.client.gameData.id,
      launchPos: { x: origin.x, y: origin.z },
      dirVector: { x: dir.x, y: dir.z },
      sectorAngle: MyMath.toRadian(30)
    });

    // this.logDebug(`launchMissile:`, {
    //     target: target
    // });

    const newMissile = new HomingMissile({
      id: this._objIdGen.nextId(),
      level: 1,
      lookDir: dir,
      position: origin,
      target: target,
      maxTurnRate: 1,
      owner: aParams.client.gameData.id,
      radius: 1,
      velocity: 8,
      hp: 100,
      attackParams: {
        radius: 14,
        damage: [damage, damage]
      },
      lifeTime: 20
    });

    this._missiles.set(newMissile.id, newMissile);

    this._game.addObject(newMissile);

    if (target) {
      this._game.rocketTargetCreate({
        action: 'targetCreate',
        rocketId: newMissile.id,
        targetId: target.id
      });
    }
  }

  explodeMissile(aMissile: HomingMissile) {
    // explosion missile
    let dmg = aMissile.getAttackDamage({ noCrit: true, noMiss: true });
    let objects = this.getObjectsInAtkRadius(aMissile);
    objects.map(obj => obj.damage({
      damage: dmg.damage,
      attackerId: aMissile.id,
      attacketType: 'HomingMissile'
    }));
    // send explosion pack
    PackSender.getInstance().explosion(this._clients, {
      type: 'HomingMissile',
      pos: aMissile.position
    });
  }

  deleteMissile(aId: number) {
    this._missiles.delete(aId);
  }

  update(dt: number) {
    this._missiles.forEach((obj) => {
      obj.update(dt);
      if (obj.lifeTime <= 0) this.destroyMissile(obj);
    });
    this._collisionSystem.update(dt);
  }

}