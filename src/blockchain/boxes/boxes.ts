require('dotenv').config();
import Web3 from 'web3';
import * as ABIs from "./config/ABI";
import * as contracts from "./config/contracts"
import { networkParams } from '../network';

const privateKey = process.env.ADMIN_PRIVATE_KEY
const publicKey = process.env.ADMIN_ADDRESS

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

async function GetUserWinsCount (address: string) {
    return new Promise(async (resolve, reject) => {
        try {
        const dt = await rewardContract.methods.getUserWinsCount(address).call();
        resolve(Number(dt))
        } catch (e) {
            reject(`Request to network failed: ${e.message}`)
        }
    })
}

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

export async function getNextWinId () {
    return await rewardContract.methods.getGameCount().call()
}

export async function getWinData (_winId: number): Promise<WinData> {
    const winData: WinData =  await rewardContract.methods.getVictoryData(_winId).call()
    return winData
}

export async function getLaserLevel (_laserId: number) {
    const laserLevel: number = await nftContracts.LaserNFT.methods.GetTokenLevel(_laserId).call()
    return laserLevel;
}

export async function getUserLaserList (_user: string) {
    const laserList: number[] = await nftContracts.LaserNFT.methods.getUserCreationHistory(_user).call();
    return laserList;
}

export async function getUserAvailableLaserLevels (_user: string) {
    const list: number[] = [];
    const laserNFTs = await getUserLaserList (_user);
    for (let j = 0; j < laserNFTs.length; j++) {
       const laserLevel = await getLaserLevel(Number(laserNFTs[j]));
       if (list.indexOf(laserLevel) === -1) {
        list.push(laserLevel);
       }
    }
    return list
}

export async function getUserBoxes (_user: string) {
    const boxList: number[] = await nftContracts.BoxNFT.methods.getUserCreationHistory(_user).call();
    return boxList;
}

export async function getBoxData (_boxId: number) {
    const boxData: BoxData = await nftContracts.BoxNFT.methods.getBoxInfo(_boxId).call();
    return boxData;
}

export async function getUserBoxesToOpen (_user: string) {
    const list: number[] = [];
    const allBoxes = await getUserBoxes (_user);
    for (let j = 0; j < allBoxes.length; j++) {
        const dt = await getBoxData (allBoxes[j]);
        if (!dt.isPaid) list.push(allBoxes[j]);
    }
    return list;
}

export async function RecordWinnerWithChoose (address: string, _unfix: boolean = true) {
    return new Promise(async (resolve, reject) => {

        if (!privateKey || !publicKey) {
            reject("Admin data not found")
            return;
        }

        const gasPrice = Number(await web3.eth.getGasPrice());
        const winId = Number(await getNextWinId ());

        try{

            const txnData = {
                from: publicKey,
                to: contracts.RewardSender,
                gasPrice,
                gasLimit: web3.utils.toHex(await rewardContract.methods.noteWinner(address, _unfix).estimateGas({ from: publicKey})),
                value: '0x00',
                data: rewardContract.methods.noteWinner(address, _unfix).encodeABI()
            }

            const signedTx = await web3.eth.accounts.signTransaction(txnData, privateKey);
            const txReceipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            resolve(winId);
        } catch (e) {
            reject(`Txn failed: ${e.message}`)
            return;
        }

        resolve(gasPrice)
    })
}