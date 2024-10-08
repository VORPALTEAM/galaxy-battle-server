import dotenv from 'dotenv';
import Web3 from 'web3';
import fetch from 'node-fetch';
import * as ABIs from "./config/ABI/index.js";
import * as contracts from "./config/contracts.js"
import { networkParams } from '../network.js';
import { LogMng } from '../../monax/LogMng.js';
import { CreateBoxWeb2, GiveResourcesWeb2 } from '../functions.js';

const web3 = new Web3(networkParams.rpcUrl)
const tokenContracts = {
    VRP: new web3.eth.Contract(ABIs.ResourceToken, contracts.VRPReward),
    Spore: new web3.eth.Contract(ABIs.ResourceToken, contracts.SPORE),
    Spice: new web3.eth.Contract(ABIs.ResourceToken, contracts.SPICE),
    Metal: new web3.eth.Contract(ABIs.ResourceToken, contracts.METAL),
    Biomass: new web3.eth.Contract(ABIs.ResourceToken, contracts.BIOMASS),
    Carbon: new web3.eth.Contract(ABIs.ResourceToken, contracts.CARBON),
}

const nftContracts = {
    BoxNFT: new web3.eth.Contract(ABIs.BoxNFT, contracts.BoxNFT),
    LaserNFT: new web3.eth.Contract(ABIs.LaserNFT, contracts.LaserNFT),
}

const rewardContract = new web3.eth.Contract(ABIs.RewardSenderWithChoose, contracts.RewardSender);

export async function GetUserWinsCount (address: string) {
    return new Promise(async (resolve, reject) => {
        try {
            const dt = await rewardContract.methods.getUserWinsCount(address).call();
            resolve(Number(dt))
        } catch (e) {
            reject(`Request to network failed: ${e.message}`)
        }
    })
}

export async function GetUserWinHistory(address: string): Promise<number[]> {
    return new Promise(async (resolve, reject) => {
        try {
        const dt: any = await rewardContract.methods.getUserWinHistory(address).call();
		try {
		   resolve(Array.from(dt))
		} catch (e) {
		   resolve([])
		}
        } catch (e) {
            reject(`Request to network failed: ${e.message}`)
        }
    })
}

// ToDo: make another realization
/* export async function GetUserWinStreak (address: string) {
   try {
      
      return await GetUserWinHistory (address).length + 1
   } catch (e) {
      return 1;
   }
} */

export interface WinData {
    winner: string,
    rewardAddress: string,
    rewardAmount: number,
    rewardId: number
}

export interface BoxData {
    rewardAddress: string;
    rewardId: number;
    rewardAmount: number;
    isPaid: boolean;
}

export async function getNextWinId() {
    return await rewardContract.methods.getGameCount().call()
}

export async function getWinData(_winId: number): Promise<WinData> {
    const winData: WinData = await rewardContract.methods.getVictoryData(_winId).call()
    return winData
}

export async function getLaserLevel(_laserId: number) {
    const laserLevel: number = await nftContracts.LaserNFT.methods.GetTokenLevel(_laserId).call()
    return laserLevel;
}

export async function getUserLaserList(_user: string) {
    const laserList: number[] = await nftContracts.LaserNFT.methods.getUserCreationHistory(_user).call();
    return laserList;
}

export async function getUserAvailableLaserLevels(_user: string) {
    const list: number[] = [];
    const laserNFTs = await getUserLaserList(_user);
    for (let j = 0; j < laserNFTs.length; j++) {
        const laserLevel = await getLaserLevel(Number(laserNFTs[j]));
        if (list.indexOf(laserLevel) === -1) {
            list.push(laserLevel);
        }
    }
    return list
}

export async function getUserBoxes(_user: string) {
    const boxList: number[] = await nftContracts.BoxNFT.methods.getUserCreationHistory(_user).call();
    return boxList;
}

export async function getBoxData(_boxId: number) {
    const boxData: BoxData = await nftContracts.BoxNFT.methods.getBoxInfo(_boxId).call();
    return boxData;
}

export async function getUserBoxesToOpen(_user: string) {
    const list: number[] = [];
    const allBoxes = await getUserBoxes(_user);
    for (let j = 0; j < allBoxes.length; j++) {
        const dt = await getBoxData(allBoxes[j]);
        if (!dt.isPaid) list.push(allBoxes[j]);
    }
    return list;
}

export async function getUserWinContractBalance(_user: string) {
    const balance = await rewardContract.methods.balanceOf(_user).call();
    return Number(balance);
}

export async function RecordWinnerWithChoose(address: string, _unfix: boolean = true, _tgLogin = "", _boxLevel = 1) {

    const privateKey = process.env.ADMIN_PRIVATE_KEY
    const publicKey = process.env.ADMIN_ADDRESS

    return new Promise(async (resolve, reject) => {

        if (!privateKey || !publicKey) {
            reject("Admin data not found");
            return;
        }

        /* if (_unfix){ 
            await CreateBoxWeb2(address, _tgLogin, _boxLevel);
        } else {
            // console.log("Giving resources chosen");
            await GiveResourcesWeb2(address, _tgLogin, "token", Math.round(Math.random() * 1000))
        } */
        // const resources = await GiveResourcesWeb2(address, _tgLogin, "token", Math.round(Math.random() * 1000))
        //resolve(gasPrice)
        resolve(1)
    });

}