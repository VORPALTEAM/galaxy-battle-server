import { SearchGameData, SignData } from "./Types";

export enum PackTitle {
  // for lobby
  sign = 'sign',
  startSearchGame = 'startSearchGame', // request
  stopSearchGame = 'stopSearchGame', // request
  gameSearching = 'gameSearching', // status, update, info
  duel = 'duel',
}

interface BasePacket {
  title: PackTitle;
}

export interface SignPacket extends BasePacket {
  title: PackTitle.sign;
  data: SignData;
}

export interface StartSearchGamePacket extends BasePacket {
  title: PackTitle.startSearchGame;
  data: SearchGameData;
}

export type Packet =
    SignPacket
  | StartSearchGamePacket;
// | other packets