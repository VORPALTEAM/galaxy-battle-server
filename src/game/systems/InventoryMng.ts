import { ILogger } from "../../interfaces/ILogger.js";
import { LogMng } from "../../monax/LogMng.js";
import { Game } from "../controllers/Game.js";
import { Client } from "../models/Client.js";
import { PackSender } from "../services/PackSender.js";

const MAX_ITEMS = 2;

type ClientRecord = {
  items: number[];
}

export class InventoryMng implements ILogger {
  private _className = 'InventoryMng';
  private _game: Game;
  private _records: Map<Client, ClientRecord>;

  constructor(params: {
    game: Game,
  }) {
    this._game = params.game;
    this._records = new Map();
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

  private getClientRecord(client: Client) {
    let rec = this._records.get(client);
    if (!rec) {
      rec = {
        items: []
      }
      this._records.set(client, rec);
    }
    return rec;
  }

  private getClients(): Client[] {
    let res: Client[] = [];
    this._records.forEach((record, client, map) => {
      res.push(client);
    });
    return res;
  }

  isFull(client: Client): boolean {
    let rec = this.getClientRecord(client);
    return rec.items.length >= MAX_ITEMS;
  }

  /**
   * Add item to client inventory
   * @param client 
   * @param itemId 
   * @returns 
   */
  addItem(client: Client, itemId: number): boolean {
    if (this.isFull(client)) return false;
    let rec = this.getClientRecord(client);
    
    for (let i = 0; i < MAX_ITEMS; i++) {
      if (!rec.items[i]) {
        rec.items[i] = itemId;
        return true;
      }
    }

  }

  removeItem(aClient: Client, aItemId: number) {
    let rec = this.getClientRecord(aClient);
    for (let i = 0; i < MAX_ITEMS; i++) {
      if (rec.items[i] == aItemId) {
        rec.items[i] = null;
        return true;
      }
    }
  }

  /**
   * Send update inventory for client
   * @param aClient 
   */
  sendUpdateData(aClient: Client) {
    let clients = this.getClients();
    this._records.forEach((record, client, map) => {
      PackSender.getInstance().shop(clients, {
        action: 'inventoryUpdate',
        clientId: client.gameData.id,
        inventory: record.items
      });
    });
  }
  
}