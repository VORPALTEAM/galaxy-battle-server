import { SignData } from "./Types";

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

export type Packet =
    SignPacket;
    // | other packet