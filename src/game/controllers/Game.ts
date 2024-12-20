import * as THREE from "three";
import { PackSender } from "../services/PackSender.js";
import { Client } from "../models/Client.js";
import {
  GameCompleteData, PlanetLaserData, ObjectUpdateData, AttackType, DamageInfo,
  SkillRequest, PlanetLaserSkin, DebugTestData, ObjectRace, EmotionData,
  RocketPacket, ObjectType, ShopInitData, ShopData
} from "../data/Types.js";
import { Field } from "../objects/Field.js";
import { ILogger } from "../../interfaces/ILogger.js";
import { LogMng } from "../../monax/LogMng.js";
import { Star } from "../objects/Star.js";
import { Fighter } from "../objects/Fighter.js";
import { GameObject } from "../objects/GameObject.js";
import { FighterManager } from "../systems/FighterManager.js";
import { MyMath } from "../../monax/MyMath.js";
import { Signal } from "../../monax/events/Signal.js";
import { Planet } from "../objects/Planet.js";
import { StarController } from "./StarController.js";
import { Linkor } from "../objects/Linkor.js";
import { LinkorManager } from "../systems/LinkorManager.js";
import { AbilityManager } from "../systems/AbilityManager.js";
import { SpaceShip } from "../objects/SpaceShip.js";
import { FighterFactory } from "../factory/FighterFactory.js";
import { LinkorFactory } from "../factory/LinkorFactory.js";
import { Tower } from "../objects/Tower.js";
import { TowerManager } from "../systems/TowerManager.js";
import { ExpManager } from "../systems/ExpManager.js";
import { WINSTREAKS } from "../../database/DB.js";
import { IdGenerator } from "../../monax/game/IdGenerator.js";
import { MissileController } from "./MissileController.js";
import { HomingMissile } from "../objects/HomingMissile.js";
import { ObjectController } from "./ObjectController.js";
import { GameObjectFactory } from "../factory/GameObjectFactory.js";
import { getUserLaserListWeb2 } from "../../blockchain/boxes/boxesweb2.js";
import { BC_DuelInfo } from "../../blockchain/types.js";
import { DuelPairRewardCondition, FinishDuel } from "../../blockchain/duel.js";
import { DeleteDuel } from "../../blockchain/functions.js";
import { BotAI } from "./BotAI.js";
import { ShopMng } from "../systems/ShopMng.js";
import { statService } from "../../blockchain/services/stats.js";

const SETTINGS = {
  tickRate: 1000 / 10, // 1000 / t - t ticks per sec
  battlePrerollTimer: 2, // in sec

  field: {
    size: {
      cols: 8,
      rows: 11,
      sectorWidth: 10,
      sectorHeight: 9,
    },
  },

  starParams: {
    hp: 1000,
    radius: 5,
    attackRadius: 14,
    minDmg: 10,
    maxDmg: 20,
    minusHpPerSec: 1,
  },
  stars: [
    // top
    {
      cellPos: { x: 3, y: 1 },
      fightersSpawnDeltaPos: [
        { x: -1, y: 1 },
        { x: 2, y: 1 },
        { x: 0, y: 2 },
        // tests
        // { x: -1, y: 2 },
        // { x: 2, y: 2 },
        // { x: 1, y: 2 },
      ],
      linkorSpawnDeltaPos: [{ x: -2, y: 1 }],
    },
    // bottom
    {
      cellPos: { x: 3, y: 9 },
      fightersSpawnDeltaPos: [
        { x: -1, y: -1 },
        { x: 2, y: -1 },
        { x: 0, y: -2 },
        // tests
        // { x: -1, y: -2 },
        // { x: 2, y: -2 },
        // { x: 1, y: -2 },
      ],
      linkorSpawnDeltaPos: [{ x: 3, y: -1 }],
    },
  ],

  planet: {
    radius: 2,
    orbitRadius: 15, // planet orbit radius
    orbitRotationPeriod: 60, // planet orbit rotation period in sec
    rotationPeriod: 5, // planet rotation period in sec
    aimSectorAngleDeg: 40, // in degrees
    laserAimSectorAngleDeg: 30 // in degrees
  },

  towerParams: {
    hp: 500, // old value: 750
    radius: 4.2,
    attackRadius: 23,
    minDmg: 10, // old value: 55
    maxDmg: 30, // old value: 75
  },
  towers: [
    {
      cellPos: { x: 3 - 2, y: 1 + 2 },
      ownerId: 0,
    },
    {
      cellPos: { x: 3 + 2, y: 1 + 2 },
      ownerId: 0,
    },
    {
      cellPos: { x: 3 - 2, y: 9 - 2 },
      ownerId: 1,
    },
    {
      cellPos: { x: 3 + 2, y: 9 - 2 },
      ownerId: 1,
    },
  ],

  fighters: {
    radius: 3,
    attackRadius: 14,
    attackPeriod: 1,
    rotationTime: 1,
    prepareJumpTime: 0.5,
    jumpTime: 1,
  },

  battleShips: {
    radius: 5,
    attackRadius: 22,
    attackPeriod: 1,
    rotationTime: 1,
    prepareJumpTime: 0.5,
    jumpTime: 1,
  },
};

type GameState = "none" | "clientLoading" | "init" | "game" | "final";

export class Game implements ILogger {
  private _className = "Game";
  private _state: GameState = "none";
  private _id: number; // game id
  private _duelData: BC_DuelInfo;
  private _loopInterval: NodeJS.Timeout;
  private _objIdGen: IdGenerator;
  private _objectFactory: GameObjectFactory;
  private _objectController: ObjectController;
  private _clients: Client[];
  private _sceneLoaded: boolean[];
  private _field: Field;
  private _starController: StarController;
  private _towerMng: TowerManager;
  private _fighterMng: FighterManager;
  private _linkorMng: LinkorManager;
  private _abilsMng: AbilityManager;
  private _missilesController: MissileController;
  private _expMng: ExpManager;
  private _botAi: BotAI;
  private _shopMng: ShopMng;
  // events
  onGameComplete = new Signal();

  constructor(aParams: {
    gameId: number;
    clientA: Client;
    clientB: Client;
    duelData: BC_DuelInfo;
  }) {
    this.logDebug(`Game creation:`, {
      client1_ConnId: aParams.clientA.connectionId,
      client2_ConnId: aParams.clientB.connectionId,
      duelInfo: aParams.duelData,
    });

    this._state = "none";
    this._id = aParams.gameId;
    this._duelData = aParams.duelData;
    this._objIdGen = new IdGenerator();
    this._objectFactory = new GameObjectFactory(this._objIdGen);
    this._objectController = new ObjectController(this);
    this._clients = [aParams.clientA, aParams.clientB];

    // random races - temporary solution
    const races: ObjectRace[] = ["Waters", "Insects"];
    MyMath.shuffleArray(races);
    // this._clientDataMng.addClient(aClientA).race = races[0];
    aParams.clientA.gameData.race = races[0];
    aParams.clientB.gameData.race = races[1];

    this._sceneLoaded = [];
    this._expMng = new ExpManager();

    // create shop mng
    this._shopMng = new ShopMng({
      game: this,
      expMng: this._expMng,
      objController: this._objectController
    });

    this.initClientListeners();
    this.startLoop();
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

  private initClientListeners() {
    for (let i = 0; i < this._clients.length; i++) {
      const client = this._clients[i];
      client.onDisconnect.add(this.onClientDisconnect, this);
      client.onSkillRequest.add(this.onSkillRequest, this);
      client.onExitGame.add(this.onClientExitGame, this);
      client.onShop.add(this.onClientShop, this);
      client.onEmotion.add(this.onClientEmotion, this);
      client.onDebugTest.add(this.onClientDebugTest, this);
    }
  }

  private clearAllClientListeners() {
    for (let i = 0; i < this._clients.length; i++) {
      const client = this._clients[i];
      client.onDisconnect.remove(this.onClientDisconnect, this);
      client.onSkillRequest.remove(this.onSkillRequest, this);
      client.onExitGame.remove(this.onClientExitGame, this);
      client.onShop.remove(this.onClientShop, this);
      client.onEmotion.remove(this.onClientEmotion, this);
      client.onDebugTest.remove(this.onClientDebugTest, this);
    }
  }

  private onClientDisconnect(aClient: Client) {
    const clientName = aClient.getPlayerData().displayNick;

    this.logDebug(`client (${clientName}) disconnected`);

    let winner: Client;
    for (let i = 0; i < this._clients.length; i++) {
      const client = this._clients[i];
      if (client.connectionId != aClient.connectionId) {
        winner = client;
        break;
      }
    }
    this.completeGame(winner, true);
  }

  private onSkillRequest(aClient: Client, aData: SkillRequest) {
    switch (aData.action) {
      case "click":
        switch (aData.skillId) {
          case 0: // laser
            {
              const dmg = this._expMng.getSkillDamage(
                aClient.gameData.id,
                aData.skillId
              );
              // this.logDebug(`laser dmg:`, dmg);
              this._abilsMng?.laserAttack(aClient, dmg);
            }
            break;

          case 1: // rocket
            {
              const dmg = this._expMng.getSkillDamage(
                aClient.gameData.id,
                aData.skillId
              );
              this._missilesController.launchMissile({
                client: aClient,
                damage: dmg,
              });
            }
            break;

          case 2: // sniper
            {
              let slowFactor = this._expMng.getSniperSpeedFactor(
                aClient.gameData.id
              );
              let slowTime = this._expMng.getSniperDuration(aClient.gameData.id);
              let planet = this._objectController.getPlayerPlanet(
                aClient.gameData.id
              );
              if (planet) {
                // this.logDebug(`onSkillRequest: Sniper Activate...`);
                planet.activateSniperSkill(slowFactor, slowTime);
                PackSender.getInstance().sniper(this._clients, {
                  action: "start",
                  planetId: planet.id,
                });
                setTimeout(() => {
                  PackSender.getInstance().sniper(this._clients, {
                    action: "end",
                    planetId: planet.id,
                  });
                }, slowTime * 1000);
              } else {
                this.logWarn(`onSkillRequest: Sniper: No Planet Detected!`);
              }
            }
            break;

          default:
            this.logError(`onSkillRequest: unhandled click skill id: ${aData}`);
            break;
        }
        break;

      case "levelUp":
        let expData = this._expMng.upSkillLevel(
          aClient.gameData.id,
          aData.skillId
        );
        PackSender.getInstance().exp(aClient, expData);
        break;

      default:
        this.logError(`onSkillRequest: unknown skill action: ${aData}`);
        break;
    }
  }

  private onClientExitGame(aClient: Client) {
    let aWinner =
      this._clients[0] == aClient ? this._clients[1] : this._clients[0];
    this.completeGame(aWinner);
  }

  private onClientShop(client: Client, shopData: ShopData) {
    switch (shopData.action) {

      case 'purchase':
        let res = this._shopMng.purchase(client, shopData.itemId);

        // answer
        if (res) {
          this.sendGoldUpdate(client);
          PackSender.getInstance().shop([client], {
            action: 'purchase',
            itemId: shopData.itemId
          });
        }
        else {
          PackSender.getInstance().shop([client], {
            action: 'purchaseError',
            msg: 'no gold'
          });
        }

        break;

      case 'sale':
        // temp answer
        PackSender.getInstance().shop([client], {
          action: 'sale',
          itemId: shopData.itemId
        });
        break;

      default:
        this.logWarn(`onClientShop: unknown shopData.action:`, shopData);
        break;

    }
  }

  private onClientEmotion(aClient: Client, aEmotionData: EmotionData) {
    aEmotionData.owner = aClient.gameData.id;
    PackSender.getInstance().emotion(this._clients, aEmotionData);
  }

  private onClientDebugTest(aClient: Client, aData: DebugTestData) {
    switch (aData.action) {
      case "win":
        this.completeGame(aClient);
        break;
      case "loss":
        if (this._clients[0] == aClient) {
          this.completeGame(this._clients[1]);
        } else {
          this.completeGame(this._clients[0]);
        }
        break;
      case 'addGold1k':
        this._expMng.addGold(aClient.gameData.id, 1000);
        break;
    }
  }

  private clientsLoaded(): boolean {
    return this._sceneLoaded[0] && this._sceneLoaded[1];
  }

  private async completeGame(aWinner: Client, aIsDisconnect?: boolean) {

    this.logDebug(`--- completeGame log start ---`);

    this.logDebug(`winner:`, {
      id: aWinner?.gameData.id,
      tgId: aWinner?.gameData?.tgAuthData?.id,
      tgUsername: aWinner?.gameData?.tgAuthData?.username
    });

    this._starController.deactivateStars();

    let isPlayWithBot = false;
    let tgId1: number;
    let tgId2: number;

    for (let i = 0; i < this._clients.length; i++) {
      const client = this._clients[i];

      // clear winstreak for other clients
      if (client.connectionId != aWinner.connectionId) {
        WINSTREAKS[client.gameData.id] = 0;
      }

      // check a Bot
      if (client.isBot) {
        isPlayWithBot = true;
      }
      else {
        i == 0 ?
          tgId1 = client.gameData.tgAuthData.id :
          tgId2 = client.gameData.tgAuthData.id;
      }
    }

    this.logDebug(`isPlayWithBot: ${isPlayWithBot}`);
    this.logDebug(`isDisconnect: ${aIsDisconnect}`);
    this.logDebug(`TG ids: ${tgId1}; ${tgId2};`);

    let isWinStreak = false;
    if (!aWinner.isBot && aWinner.isSigned) {
      // inc ws
      let ws = WINSTREAKS[aWinner.gameData.id] || 0;
      WINSTREAKS[aWinner.gameData.id] = ws + 1;
      // isWinStreak = await this.isWinStreak(aWinner.walletId);
      isWinStreak = ws + 1 >= 3;
    }

    let isDuelRewarded = false;
    let duelRewardError: {
      message: string;
    };

    const rewardTries = 2;
    let rewardTriesCounter = 0;

    while (rewardTriesCounter < rewardTries) {
      try {
        if (isPlayWithBot) break;
        isDuelRewarded = await DuelPairRewardCondition(String(tgId1), String(tgId2));
        if (isDuelRewarded) break;
      } catch (error) {
        console.log("Error: ", error);
        duelRewardError = {
          message: error
        };
      }
      rewardTriesCounter++;
    }

    for (let i = 0; i < this._clients.length; i++) {
      const client = this._clients[i];
      const isWinner = aWinner && client.connectionId == aWinner.connectionId;
      const nameDisplay = client.gameData.tgAuthData
        ? (client.gameData.tgAuthData.username || client.gameData.tgAuthData.first_name || "Anonimous")
        : client.gameData.id;
      // this.logDebug("Client data: ", client.gameData.id);
      // const nameDisplay = client.gameData.id || "Unknown";
      let data: GameCompleteData;

      const expData = this._expMng.getExpData(client.gameData.id);

      if (isWinner) {
        data = {
          status: "win",
          showBoxClaim: isPlayWithBot ? false : isWinStreak,
          boxLevel: isPlayWithBot ? null : 1,
          hideClaimBtn: isPlayWithBot,
          ownerName: nameDisplay,
          params: {
            damageDone: expData.damage,
            expReceived: expData.exp,
            goldEarned: expData.gold,
            rating: {
              previous: 0,
              current: 100
            }
          }
        };
      }
      else {
        data = {
          status: "loss",
          ownerName: nameDisplay,
          params: {
            damageDone: expData.damage,
            expReceived: expData.exp,
            goldEarned: expData.gold,
            rating: {
              previous: 0,
              current: 100
            }
          }
        };
      }

      if (this.isDuel()) {
        if (aIsDisconnect) {
          data.status = "duelEnemyDisconnected";
        }
        else {
          // 2 boxes
          if (isDuelRewarded) {
            // data.status = 'duelReward';
            data.status = isWinner ? "win" : "loss";
            data.boxLevel = 1;
            data.showBoxClaim = true;
            data.hideClaimBtn = true;
          } else {
            data.status = isWinner ? "win" : "loss";
            data.boxLevel = null;
            data.showBoxClaim = false;
            data.hideClaimBtn = true;
          }
        }
      }

      // this.logDebug(`send gameComplete to client (${client.gameData.nick})`, data);
      PackSender.getInstance().gameComplete(client, data);

      if (duelRewardError) {
        PackSender.getInstance().message([client], {
          msg: `Duel RewardCondition check ERROR: ${duelRewardError.message}`,
          showType: "popup",
        });
      }
    }

    if (this.isDuel()) {
      if (aIsDisconnect) {
        // remove duel record
        try {
          this.logDebug(`call DeleteDuel for duel_id = ${this._duelData.duel_id}`);
          DeleteDuel(this._duelData.duel_id);
        } catch (error) {
          PackSender.getInstance().message(this._clients, {
            msg: `DeleteDuel ERROR: ${error}`,
            showType: "popup",
          });
        }
      } else {
        this.logDebug(`call FinishDuel for duel_id = ${this._duelData.duel_id}`);
        try {
          FinishDuel(this._duelData.duel_id, aWinner.gameData.id || "");
        } catch (error) {
          PackSender.getInstance().message(this._clients, {
            msg: `FinishDuel ERROR: ${error}`,
            showType: "popup",
          });
        }
      }
    }

    this.onGameComplete.dispatch(this);

    this.logDebug(`--- completeGame log end ---`);

  }

  isDuel(): boolean {
    return this._duelData != null;
  }

  private generateObjectId(): number {
    return this._objIdGen.nextId();
  }

  private startLoop() {
    this._loopInterval = setInterval(() => {
      this.update(SETTINGS.tickRate * 0.001);
    }, SETTINGS.tickRate);
  }

  private stopLoop() {
    if (this._loopInterval) {
      clearInterval(this._loopInterval);
      this._loopInterval = null;
    }
  }

  private init() {

    // create field
    this._field = new Field(SETTINGS.field);

    this._starController = new StarController(this, this._objectController);
    this._towerMng = new TowerManager({
      field: this._field,
      objects: this._objectController.objects,
    });
    this._fighterMng = new FighterManager(
      this._field,
      this._objectController.objects
    );
    this._linkorMng = new LinkorManager(
      this._field,
      this._objectController.objects
    );

    this._abilsMng = new AbilityManager(this._objectController.objects,
      MyMath.toRadian(SETTINGS.planet.laserAimSectorAngleDeg)
    );
    this._abilsMng.onLaserAttack.add(this.onPlanetLaserAttack, this);

    this._missilesController = new MissileController({
      game: this,
      clients: this._clients,
      objIdGen: this._objIdGen,
      objects: this._objectController.objects,
      aimSectorAngle: MyMath.toRadian(SETTINGS.planet.aimSectorAngleDeg)
    });

    this.initStars();
    this.initTowers();
    this.initBotAI();

    this._state = "game";
  }

  private initBotAI() {

    for (let i = 0; i < this._clients.length; i++) {
      const cli = this._clients[i];
      if (cli.isBot) {
        this._botAi = new BotAI({
          client: cli,
          abilsMng: this._abilsMng,
          expMng: this._expMng,
          missilesController: this._missilesController
        });
        break;
      }
    }

  }

  private async initStars() {
    // create stars
    const starParams = SETTINGS.starParams;
    const starsData = SETTINGS.stars;
    let stars: Star[] = [];

    for (let i = 0; i < starsData.length; i++) {
      const starData = starsData[i];

      let star = new Star({
        id: this.generateObjectId(),
        owner: this._clients[i].gameData.id,
        position: this._field.cellPosToGlobalVec3(starData.cellPos),
        radius: starParams.radius,
        hp: starParams.hp,
        attackParams: {
          radius: starParams.attackRadius,
          damage: [starParams.minDmg, starParams.maxDmg],
        },
        isTopStar: starData.cellPos.y < SETTINGS.field.size.rows / 2,
        fightersSpawnDeltaPos: starData.fightersSpawnDeltaPos,
        linkorSpawnDeltaPos: starData.linkorSpawnDeltaPos,
        minusHpPerSec: starParams.minusHpPerSec,
      });

      star.onDamage.add(this.onObjectDamage, this);

      // this._field.takeCell(starData.cellPos.x, starData.cellPos.y);
      this._field.takeCellByObject(star.id, starData.cellPos);
      this.addObject(star);
      stars.push(star);

      this._starController.addStar(star);
    }

    // create planets
    for (let i = 0; i < stars.length; i++) {
      let client = this._clients[i];
      const star = stars[i];
      const isTopStar =
        star.position.z <
        (SETTINGS.field.size.rows * SETTINGS.field.size.sectorHeight) / 2;
      const planetParams = SETTINGS.planet;

      let planet = new Planet({
        id: this.generateObjectId(),
        owner: star.owner,
        isImmortal: true,
        radius: planetParams.radius,
        orbitCenter: star.position.clone(),
        orbitRadius: planetParams.orbitRadius,
        orbitRotationPeriod: planetParams.orbitRotationPeriod,
        rotationPeriod: planetParams.rotationPeriod,
        startAngle: MyMath.randomInRange(0, Math.PI * 2),
        startOrbitAngle: isTopStar ? Math.PI / 2 : -Math.PI / 2,
        laserSkin: client.laserSkin,
        planetRadius: SETTINGS.planet.radius
      });

      this.addObject(planet);
    }
  }

  private initTowers() {
    // create stars
    const towerParams = SETTINGS.towerParams;
    const towers = SETTINGS.towers;
    for (let i = 0; i < towers.length; i++) {
      const towerData = towers[i];

      let tower = new Tower({
        id: this.generateObjectId(),
        owner: this._clients[towerData.ownerId].gameData.id,
        position: this._field.cellPosToGlobalVec3(towerData.cellPos),
        radius: towerParams.radius,
        hp: towerParams.hp,
        attackParams: {
          radius: towerParams.attackRadius,
          damage: [towerParams.minDmg, towerParams.maxDmg],
        },
        attackPeriod: 2,
      });

      tower.onAttack.add(this.onShipAttack, this);
      tower.onDamage.add(this.onObjectDamage, this);

      // this._field.takeCell(towerData.cellPos.x, towerData.cellPos.y);
      this._field.takeCellByObject(tower.id, towerData.cellPos);
      this.addObject(tower);

      // this._towerMng.addStar(tower);
    }
  }

  private getClientByWallet(aWalletId: string): Client | null {
    for (let i = 0; i < this._clients.length; i++) {
      const client = this._clients[i];
      if (client.gameData.id == aWalletId) return client;
    }
    return null;
  }

  private getClientByEnemyWallet(aWalletId: string): Client | null {
    for (let i = 0; i < this._clients.length; i++) {
      const client = this._clients[i];
      if (client.gameData.id != aWalletId) return client;
    }
    return null;
  }

  /**
   * 
   * @param aStar owner star
   * @param cellPos filed cell pos
   * @returns 
   */
  onStarFighterSpawn(aStar: Star, aCellDeltaPos: { x: number; y: number }) {
    const level = 1;
    const shipParams = SETTINGS.fighters;
    const shipFactoryParams = new FighterFactory().getShipParams(level);
    const yDir = aStar.isTopStar ? 1 : -1;

    let cellPos = this._field.globalToCellPos(
      aStar.position.x,
      aStar.position.z
    );

    cellPos.x += aCellDeltaPos.x;
    cellPos.y += aCellDeltaPos.y;

    if (this._field.isCellTaken(cellPos)) {
      // this.logDebug(`onStarFighterSpawn: cell taken:`, cellPos);
      let neighbors = this._field.getNeighbors(cellPos, true);
      if (neighbors.length <= 0) {
        // explosion current object on the cell
        let obj = this._objectController.getObjectOnCell(this._field, cellPos);
        if (obj) {
          obj.damage({
            damage: obj.hp * 2,
          });
        }
        return;
      }
      else {
        cellPos = neighbors[0];
      }
    }

    let fighter = new Fighter({
      owner: aStar.owner,
      id: this.generateObjectId(),
      position: this._field.cellPosToGlobal(cellPos),
      radius: shipParams.radius,
      level: level,
      hp: shipFactoryParams.hp,
      shield: shipFactoryParams.shield,
      attackParams: {
        radius: shipParams.attackRadius,
        damage: shipFactoryParams.damage,
        hitPenetration: shipFactoryParams.hitPenetration,
        crit: {
          critChance: shipFactoryParams.critChance,
          critFactor: shipFactoryParams.critFactor,
        },
      },
      evasion: shipFactoryParams.evasion,
      lookDir: new THREE.Vector3(0, 0, yDir),
      attackPeriod: shipParams.attackPeriod,
      rotationTime: shipParams.rotationTime,
      prepareJumpTime: shipParams.prepareJumpTime,
      jumpTime: shipParams.jumpTime,
    });

    fighter.onRotate.add(this.onShipRotate, this);
    fighter.onJump.add(this.onShipJump, this);
    fighter.onAttack.add(this.onShipAttack, this);
    fighter.onRayStart.add(this.onShipRayStart, this);
    fighter.onDamage.add(this.onObjectDamage, this);

    // this._field.takeCell(cellPos.x, cellPos.y);
    this._field.takeCellByObject(fighter.id, cellPos);

    this.addObject(fighter);
    this._fighterMng.addShip(fighter);
  }

  onStarLinkorSpawn(aStar: Star, aCellDeltaPos: { x: number; y: number }) {
    const level = 1;
    const shipParams = SETTINGS.battleShips;
    const shipFactoryParams = new LinkorFactory().getShipParams(level);
    const yDir = aStar.isTopStar ? 1 : -1;
    let cellPos = this._field.globalToCellPos(
      aStar.position.x,
      aStar.position.z
    );
    cellPos.x += aCellDeltaPos.x;
    cellPos.y += aCellDeltaPos.y;

    if (this._field.isCellTaken(cellPos)) {
      this.logDebug(`onStarLinkorSpawn: cell taken:`, cellPos);
      let neighbors = this._field.getNeighbors(cellPos, true);
      if (neighbors.length <= 0) {
        // explosion current object on the cell
        let obj = this._objectController.getObjectOnCell(this._field, cellPos);
        if (obj) {
          obj.damage({
            damage: obj.hp * 2,
          });
        }
        return;
      } else {
        cellPos = neighbors[0];
      }
    }

    let linkor = new Linkor({
      owner: aStar.owner,
      id: this.generateObjectId(),
      position: this._field.cellPosToGlobalVec3(cellPos),
      radius: shipParams.radius,
      level: level,
      hp: shipFactoryParams.hp,
      shield: shipFactoryParams.shield,
      attackParams: {
        radius: shipParams.attackRadius,
        damage: shipFactoryParams.damage,
        hitPenetration: shipFactoryParams.hitPenetration,
        crit: {
          critChance: shipFactoryParams.critChance,
          critFactor: shipFactoryParams.critFactor,
        },
      },
      evasion: shipFactoryParams.evasion,
      lookDir: new THREE.Vector3(0, 0, yDir),
      attackPeriod: shipParams.attackPeriod,
      rotationTime: shipParams.rotationTime,
      prepareJumpTime: shipParams.prepareJumpTime,
      jumpTime: shipParams.jumpTime,
    });

    linkor.onRotate.add(this.onShipRotate, this);
    linkor.onJump.add(this.onShipJump, this);
    linkor.onAttack.add(this.onShipAttack, this);
    linkor.onRayStart.add(this.onShipRayStart, this);
    linkor.onRayStop.add(this.onShipRayStop, this);
    linkor.onDamage.add(this.onObjectDamage, this);

    // this._field.takeCell(cellPos.x, cellPos.y);
    this._field.takeCellByObject(linkor.id, cellPos);

    this.addObject(linkor);
    this._linkorMng.addLinkor(linkor);
  }

  shopFighterBuy(aClient: Client): boolean {
    const level = 1;
    const shipParams = SETTINGS.fighters;
    const shipFactoryParams = new FighterFactory().getShipParams(level);
    
    let stars = this._objectController.getPlayerStars(aClient.gameData.id);
    if (stars.length <= 0) return false;
    let star = stars[0];

    const yDir = star.isTopStar ? 1 : -1;

    let cellPos = this._field.globalToCellPos(
      star.position.x,
      star.position.z
    );

    // pick random position
    let starSettings = SETTINGS.stars[0];
    if (yDir < 0) starSettings = SETTINGS.stars[1];
    let deltaPositions = starSettings.fightersSpawnDeltaPos;
    let deltaPosId = MyMath.randomIntInRange(0, deltaPositions.length - 1);
    let deltaPos = deltaPositions[deltaPosId];

    cellPos.x += deltaPos.x;
    cellPos.y += deltaPos.y;

    if (this._field.isCellTaken(cellPos)) {
      // this.logDebug(`onStarFighterSpawn: cell taken:`, cellPos);
      let neighbors = this._field.getNeighbors(cellPos, true);
      if (neighbors.length <= 0) {
        // explosion current object on the cell
        let obj = this._objectController.getObjectOnCell(this._field, cellPos);
        if (obj) {
          obj.damage({
            damage: obj.hp * 2,
          });
        }
        return;
      }
      else {
        cellPos = neighbors[0];
      }
    }

    let fighter = new Fighter({
      owner: star.owner,
      id: this.generateObjectId(),
      position: this._field.cellPosToGlobal(cellPos),
      radius: shipParams.radius,
      level: level,
      hp: shipFactoryParams.hp,
      shield: shipFactoryParams.shield,
      attackParams: {
        radius: shipParams.attackRadius,
        damage: shipFactoryParams.damage,
        hitPenetration: shipFactoryParams.hitPenetration,
        crit: {
          critChance: shipFactoryParams.critChance,
          critFactor: shipFactoryParams.critFactor,
        },
      },
      evasion: shipFactoryParams.evasion,
      lookDir: new THREE.Vector3(0, 0, yDir),
      attackPeriod: shipParams.attackPeriod,
      rotationTime: shipParams.rotationTime,
      prepareJumpTime: shipParams.prepareJumpTime,
      jumpTime: shipParams.jumpTime,
    });

    fighter.onRotate.add(this.onShipRotate, this);
    fighter.onJump.add(this.onShipJump, this);
    fighter.onAttack.add(this.onShipAttack, this);
    fighter.onRayStart.add(this.onShipRayStart, this);
    fighter.onDamage.add(this.onObjectDamage, this);

    // this._field.takeCell(cellPos.x, cellPos.y);
    this._field.takeCellByObject(fighter.id, cellPos);

    this.addObject(fighter);
    this._fighterMng.addShip(fighter);

    return true;
  }

  shopLinkorBuy(aClient: Client): boolean {
    const level = 1;
    const shipParams = SETTINGS.battleShips;
    const shipFactoryParams = new LinkorFactory().getShipParams(level);

    let stars = this._objectController.getPlayerStars(aClient.gameData.id);
    if (stars.length <= 0) return false;
    let star = stars[0];

    const yDir = star.isTopStar ? 1 : -1;

    let cellPos = this._field.globalToCellPos(
      star.position.x,
      star.position.z
    );

    // pick random position
    let starSettings = SETTINGS.stars[0];
    if (yDir < 0) starSettings = SETTINGS.stars[1];
    let deltaPositions = starSettings.fightersSpawnDeltaPos;
    let deltaPosId = MyMath.randomIntInRange(0, deltaPositions.length - 1);
    let deltaPos = deltaPositions[deltaPosId];

    cellPos.x += deltaPos.x;
    cellPos.y += deltaPos.y;

    if (this._field.isCellTaken(cellPos)) {
      this.logDebug(`onStarLinkorSpawn: cell taken:`, cellPos);
      let neighbors = this._field.getNeighbors(cellPos, true);
      if (neighbors.length <= 0) {
        // explosion current object on the cell
        let obj = this._objectController.getObjectOnCell(this._field, cellPos);
        if (obj) {
          obj.damage({
            damage: obj.hp * 2,
          });
        }
        return;
      } else {
        cellPos = neighbors[0];
      }
    }

    let linkor = new Linkor({
      owner: star.owner,
      id: this.generateObjectId(),
      position: this._field.cellPosToGlobalVec3(cellPos),
      radius: shipParams.radius,
      level: level,
      hp: shipFactoryParams.hp,
      shield: shipFactoryParams.shield,
      attackParams: {
        radius: shipParams.attackRadius,
        damage: shipFactoryParams.damage,
        hitPenetration: shipFactoryParams.hitPenetration,
        crit: {
          critChance: shipFactoryParams.critChance,
          critFactor: shipFactoryParams.critFactor,
        },
      },
      evasion: shipFactoryParams.evasion,
      lookDir: new THREE.Vector3(0, 0, yDir),
      attackPeriod: shipParams.attackPeriod,
      rotationTime: shipParams.rotationTime,
      prepareJumpTime: shipParams.prepareJumpTime,
      jumpTime: shipParams.jumpTime,
    });

    linkor.onRotate.add(this.onShipRotate, this);
    linkor.onJump.add(this.onShipJump, this);
    linkor.onAttack.add(this.onShipAttack, this);
    linkor.onRayStart.add(this.onShipRayStart, this);
    linkor.onRayStop.add(this.onShipRayStop, this);
    linkor.onDamage.add(this.onObjectDamage, this);

    // this._field.takeCell(cellPos.x, cellPos.y);
    this._field.takeCellByObject(linkor.id, cellPos);

    this.addObject(linkor);
    this._linkorMng.addLinkor(linkor);
  }

  private onShipRotate(aShip: SpaceShip, aPoint: THREE.Vector3, aDur: number) {
    PackSender.getInstance().rotate(this._clients, {
      id: aShip.id,
      type: "toPoint",
      target: aPoint,
      duration: aDur,
    });
  }

  private onShipJump(aShip: SpaceShip, aPosition: THREE.Vector3, aDur: number) {
    PackSender.getInstance().jump(this._clients, {
      id: aShip.id,
      pos: aPosition,
      duration: aDur,
    });
  }

  private onShipAttack(
    aShip: SpaceShip,
    aEnemy: GameObject,
    aType: AttackType
  ) {
    const dmg = aShip.getAttackDamage({
      noCrit: aType == "ray",
      noMiss: aType == "ray",
    });
    PackSender.getInstance().attack(this._clients, {
      attackType: aType,
      idFrom: aShip.id,
      idTo: aEnemy.id,
      damage: dmg.damage,
      isMiss: dmg.isMiss,
      isCrit: dmg.isCrit,
    });

    aEnemy.damage({
      ...dmg,
      attackerId: aShip.id,
      attacketType: 'FighterShip'
    });
  }

  onShipRayStart(aShip: SpaceShip, aEnemy: GameObject) {
    PackSender.getInstance().rayStart(this._clients, {
      idFrom: aShip.id,
      idTo: aEnemy.id,
    });
  }

  onShipRayStop(aShip: SpaceShip) {
    PackSender.getInstance().rayStop(this._clients, {
      idFrom: aShip.id,
    });
  }

  private onObjectDamage(aSender: GameObject, aAttackInfo: DamageInfo) {
    let client = this.getClientByWallet(aSender.owner);
    if (client && !aAttackInfo.isMiss) {
      this._expMng.addDamage(client.gameData.id, aAttackInfo.damage);
    }
    PackSender.getInstance().damage(this._clients, {
      id: aSender.id,
      pos: aSender.position,
      info: aAttackInfo,
    });
  }

  private onPlanetLaserAttack(aMng: AbilityManager, aData: PlanetLaserData) {
    PackSender.getInstance().planetLaserAttack(this._clients, aData);
  }

  protected getAllStars(): Star[] {
    let stars: Star[] = [];
    this._objectController.objects.forEach((obj) => {
      if (obj instanceof Star) stars.push(obj);
    });
    return stars;
  }

  protected checkWinner() {
    let stars: Star[] = this.getAllStars();

    // check Stars count and winner
    if (stars.length < 2) {
      if (stars.length == 1) {
        // we have a winner
        let winnerStar = stars[0];
        let client = this.getClientByWallet(winnerStar.owner);
        this.completeGame(client);
      } else {
        // draw
        this.completeGame(null);
      }
    }
  }

  private async loadLaserSkinForClient(aClient: Client) {
    let lasers: number[] = [];
    let laserSkin: PlanetLaserSkin = "blue";
    const nick = aClient.getPlayerData().displayNick;
    const id = aClient.gameData.tgAuthData?.id || aClient.gameData.id;

    if (aClient.isSigned && !aClient.isBot) {

      // LOCAL TEST
      // if (login == '0xbf094ffe3628041a8b7d7684e8549381136c6a17') {
      //     login = 'maxmonax';
      // }

      try {
        // lasers = await getUserAvailableLaserLevelsWeb2(login);
        lasers = await getUserLaserListWeb2(String(id));
        lasers = lasers.map((n) => Number(n));
        this.logDebug(`laser list for client(${nick}):`, lasers);
        if (lasers?.length > 0) {
          lasers.sort((a, b) => {
            return b - a;
          });
          // this.logDebug(`sorted laser list:`, lasers);
          let maxLevel = Number(lasers[0]);

          switch (maxLevel) {
            case 0:
              laserSkin = "red";
              break;
            case 1:
              laserSkin = "white";
              break;
            case 2:
              laserSkin = "violet";
              break;
          }
        }
      } catch (error) {
        this.logError(`loadLaserSkinForClient:`, error);
      }
    }

    // test
    // laserSkin = 'violet';

    this.logDebug(`set laser skin for client(${nick}):`, laserSkin);
    aClient.laserSkin = laserSkin;
  }

  private loadLaserSkins() {
    for (let i = 0; i < this._clients.length; i++) {
      const cli = this._clients[i];
      this.loadLaserSkinForClient(cli);
    }
  }

  private sendGoldUpdate(client: Client) {
    let expData = this._expMng.getExpData(client.gameData.id);
    PackSender.getInstance().exp(client, expData);
  }

  get id(): number {
    return this._id;
  }

  /**
   * Adding new objects to main list of the game
   * @param obj
   */
  addObject(obj: GameObject) {
    PackSender.getInstance().objectCreate(this._clients, obj.getCreateData());
    this._objectController.addObject(obj);
  }

  rocketTargetCreate(aData: RocketPacket) {
    PackSender.getInstance().rocket(this._clients, aData);
  }

  private initGame() {
    const cli1 = this._clients[0];
    const cli2 = this._clients[1];
    const cli1Data = cli1.gameData;
    const cli2Data = cli2.gameData;

    PackSender.getInstance().fieldInit([cli1], {
      fieldParams: SETTINGS.field,
      playerWalletAddr: cli1.gameData.id,
      playerPosition: "top",
      playerRace: cli1Data?.race,
      enemyRace: cli2Data?.race,
    });
    PackSender.getInstance().fieldInit([cli2], {
      fieldParams: SETTINGS.field,
      playerWalletAddr: cli2.gameData.id,
      playerPosition: "bot",
      playerRace: cli2Data?.race,
      enemyRace: cli1Data?.race,
    });

    setTimeout(() => {
      this.init();
    }, SETTINGS.battlePrerollTimer * 1000);

    // send stat
    if (cli1.isBot && !cli2.isBot) {
      this.logDebug(`Send PlayWithBotStats for: ${cli2.gameData.tgInitDataStr}`);
      statService.loadPlayWithBotStats(cli2.gameData.tgInitDataStr);
    }
    if (cli2.isBot && !cli1.isBot) {
      this.logDebug(`Send PlayWithBotStats for: ${cli1.gameData.tgInitDataStr}`);
      statService.loadPlayWithBotStats(cli1.gameData.tgInitDataStr);
    }

    this._state = "init";
  }

  start() {
    this.loadLaserSkins();

    if (!this._clients) {
      this.logError(`start(): this._clients == null`);
    }

    const cli1 = this._clients[0];
    const cli2 = this._clients[1];

    for (let i = 0; i < this._clients.length; i++) {
      const cli = this._clients[i];
      if (cli.isBot) {
        this._sceneLoaded[i] = true;
      } else {
        cli.onSceneLoaded.addOnce(() => {
          this._sceneLoaded[i] = true;
        }, this);
      }
    }

    let shopData = this._shopMng?.getInitData();

    PackSender.getInstance().gameStart([cli1], {
      prerollTimerSec: SETTINGS.battlePrerollTimer,
      playerData: cli1.getPlayerData(),
      enemyData: cli2.getPlayerData(),
      shopInitData: shopData
    });
    PackSender.getInstance().gameStart([cli2], {
      prerollTimerSec: SETTINGS.battlePrerollTimer,
      playerData: cli2.getPlayerData(),
      enemyData: cli1.getPlayerData(),
      shopInitData: shopData
    });

    this._state = "clientLoading";
  }

  tests() {
    // create field
    if (!this._field) this._field = new Field(SETTINGS.field);

    // field tests
    const cellPoses = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ];
    const cellPosesRes = [];

    for (let i = 0; i < cellPoses.length; i++) {
      const item = cellPoses[i];
      let c = this._field.cellPosToGlobal(item);
      cellPosesRes.push(c);
    }
    this.logDebug(`TEST cx to coords`, {
      cellPoses: cellPoses,
      res: cellPosesRes,
    });

    const globalPoses = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 5, y: 7.5 },
      { x: 15, y: 7.5 },
      { x: 15, y: 20 },
    ];
    const globalPosesRes = [];

    for (let i = 0; i < globalPoses.length; i++) {
      const item = globalPoses[i];
      let c = this._field.globalToCellPos(item.x, item.y);
      globalPosesRes.push(c);
    }
    this.logDebug(`TEST coords to cx`, {
      globalPoses: globalPoses,
      res: globalPosesRes,
    });
  }

  onObjectKill(aObj: GameObject) {

    // console.log(`onObjectKill: `, aObj);

    const objOwner = aObj.owner;
    const objAtkInfo = aObj.lastAttackInfo;
    const attackerClient = this.getClientByEnemyWallet(objOwner);

    if (!attackerClient) {
      console.log(`!attackerClient`);
      return;
    }

    const killerTypes: ObjectType[] = ['Planet', 'HomingMissile'];
    const activeKill = killerTypes.indexOf(objAtkInfo.attacketType) >= 0;

    const explosionTypes: ObjectType[] = ['FighterShip', 'BattleShip', 'Tower', 'HomingMissile'];
    if (explosionTypes.indexOf(aObj.objectType) >= 0) {
      PackSender.getInstance().explosion(this._clients, {
        type: aObj.objectType,
        pos: aObj.position
      });
    }

    let goldInc = this._expMng.addGoldForObject(attackerClient.gameData.id, aObj, activeKill);

    const prevExp = this._expMng.getExpData(attackerClient.gameData.id).exp;
    let expData = this._expMng.addExpForObject(attackerClient.gameData.id, aObj, activeKill);
    const dtExp = expData.exp - prevExp;

    this.sendGoldUpdate(attackerClient);

    PackSender.getInstance().goldText(attackerClient, {
      pos: aObj.position.clone(),
      gold: goldInc
    });

  }

  /**
   *
   * @param dt delta time in sec
   */
  update(dt: number) {

    switch (this._state) {
      case "clientLoading":
        if (this.clientsLoaded()) this.initGame();
        return;
      case "none":
      case "init":
        return;
    }

    let updateData: ObjectUpdateData[] = [];
    let destroyList: number[] = [];

    this._fighterMng.update(dt);
    this._linkorMng.update(dt);
    this._missilesController.update(dt);
    this._botAi?.update(dt);

    let objects = this._objectController.objects;

    objects.forEach((obj) => {

      if (!obj.isImmortal && obj.hp <= 0) {

        if (obj instanceof Star) {
          let stars: Star[] = this.getAllStars();
          if (stars.length <= 1) return;
        }

        if (obj instanceof HomingMissile) {
          this._missilesController.explodeMissile(obj);
          destroyList.push(obj.id);
          objects.delete(obj.id);
          this._missilesController.deleteMissile(obj.id);
          return;
        }

        this.onObjectKill(obj);

        destroyList.push(obj.id);
        objects.delete(obj.id);
        // remove from managers
        this._fighterMng.deleteShip(obj.id);
        this._linkorMng.deleteShip(obj.id);
        // free the field cell
        this._field.takeOffCellByObject(obj.id);
        obj.free();
        return;
      }

      if (obj instanceof Tower) {
        this._towerMng.updateTower(obj);
      }

      obj.update(dt);
      updateData.push(obj.getUpdateData());
    });

    updateData = updateData.filter((item) => {
      return item !== null && item !== undefined;
    });
    PackSender.getInstance().objectUpdate(this._clients, updateData);

    if (destroyList.length > 0) {
      PackSender.getInstance().objectDestroy(this._clients, destroyList);
    }

    this.checkWinner();
  }

  free() {
    this._botAi?.stop();
    this.clearAllClientListeners();
    this.stopLoop();
    this._loopInterval = null;
    this.onGameComplete.removeAll();
    this._starController?.free();
    this._fighterMng?.free();
    this._linkorMng?.free();
    this._field?.free();
    this._objectController?.free();
    this._objectController = null;
    this._clients = [];
  }

}
