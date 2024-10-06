import { ILogger } from "../../interfaces/ILogger.js";
import { LogMng } from "../../monax/LogMng.js";
import { Game } from "../controllers/Game.js";
import { ObjectController } from "../controllers/ObjectController.js";
import { ShopInitData, ShopItemData } from "../data/Types.js";
import { Client } from "../models/Client.js";
import { ExpManager } from "./ExpManager.js";

const SHOP_ITEMS: ShopItemData[] = [
  {
    id: 0,
    type: 'instant',
    name: 'Recovery Towers',
    description: 'Fully restores the energy of your towers',
    icon: 'recoveryTowers',
    price: 500
  },
  {
    id: 1,
    type: 'instant',
    name: 'Recovery',
    description: 'Fully restores the energy of your star',
    icon: 'recoveryStar',
    price: 500
  },
  {
    id: 2,
    type: 'instant',
    name: 'Fighter',
    description: 'Create an additional Fighter',
    icon: 'createFighter',
    price: 500
  },
  {
    id: 3,
    type: 'instant',
    name: 'Linkor',
    description: 'Create an additional Linkor',
    icon: 'createLinkor',
    price: 1000
  },

]

export class ShopMng implements ILogger {
  private _className = 'ShopMng';
  private _game: Game;
  private _expMng: ExpManager;
  private _objController: ObjectController;

  constructor(params: {
    game: Game,
    expMng: ExpManager,
    objController: ObjectController
  }) {
    this._game = params.game;
    this._expMng = params.expMng;
    this._objController = params.objController;
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

  getItemData(itemId: number): ShopItemData {
    for (let i = 0; i < SHOP_ITEMS.length; i++) {
      const itemData = SHOP_ITEMS[i];
      if (itemData.id == itemId) return itemData;
    }
    return null;
  }

  getInitData(): ShopInitData {
    let items: ShopItemData[] = [];
    items = SHOP_ITEMS;

    return {
      items: items
    }
  }

  purchase(client: Client, itemId: number): boolean {
    let itemData = this.getItemData(itemId);
    let gold = this._expMng.getExpData(client.gameData.id).gold;
    if (gold < itemData.price) return false;
    this._expMng.addGold(client.gameData.id, -itemData.price);
    return true;
  }

  activateItem(client: Client, itemId: number): boolean {
    let itemData = this.getItemData(itemId);
    let res = false;

    switch (itemData.type) {

      case 'instant':
        switch (itemData.id) {

          // Recovery Towers
          case 0:
            this._objController.recoveryPlayerTowersHp(client.gameData.id);
            break;

          // Recovery
          case 1:
            this._objController.recoveryPlayerStarHp(client.gameData.id);
            break;

          // Fighter
          case 2:
            if (!this._game.shopFighterBuy(client)) return false;
            break;

          // Linkor
          case 3:
            if (!this._game.shopLinkorBuy(client)) return false;
            break;

          default:
            this.logWarn(`purchase: unhandled itemData.id:`, itemData);
            break;
        }

        return true;
        break;

      case 'permanent':

        break;

      default:

        break;
    }

    return res;

  }

}