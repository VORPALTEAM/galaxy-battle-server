import { ILogger } from "../../interfaces/ILogger.js";
import { LogMng } from "../../monax/LogMng.js";
import { ShopInitData, ShopItemData } from "../data/Types.js";

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

  constructor() {
    
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

  getInitData(): ShopInitData {
    let items: ShopItemData[] = [];
    items = SHOP_ITEMS;

    return {
      items: items
    }
  }

}