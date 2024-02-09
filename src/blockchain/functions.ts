import Web3 from 'web3';
import {ERC20ABI, JournalABI}  from './ABI'
import { admin, decimals, journal, networkParams, token } from './network';

const web3 = new Web3(networkParams.rpcUrl)
const journalContract = new web3.eth.Contract(JournalABI, journal);
const tokenContract = new web3.eth.Contract(ERC20ABI, token);

export async function GetUserWinsCount (address: string) {
    return new Promise(async (resolve, reject) => {
        try {
        const dt = await journalContract.methods.getUserWinsCount(address).call();
        resolve(Number(dt))
        } catch (e) {
            reject(`Request to network failed: ${e.message}`)
        }
    })
}

export async function GetUserPrizeBalance (address: string) {
    return new Promise(async (resolve, reject) => {
        try {
            const dt = await journalContract.methods.balanceOf(address).call();
            resolve(Number(dt) / 10 ** decimals)
        } catch (e) {
            reject(`Request to network failed: ${e.message}`)
        }
    })
}

export async function RecordWinner (address: string) {
    return new Promise(async (resolve, reject) => {
        const privateKey = process.env.ADMIN_PRIVATE_KEY
        const publicKey = process.env.ADMIN_ADDRESS
        if (!privateKey || !publicKey) {
            reject("Admin data not found")
            return;
        }

        const gasPrice = Number(await web3.eth.getGasPrice());

        try{

            const txnData = {
                from: publicKey,
                to: journal,
                gasPrice,
                gasLimit: web3.utils.toHex(await journalContract.methods.noteWinner(address).estimateGas({ from: publicKey})),
                value: '0x00',
                data: journalContract.methods.noteWinner(address).encodeABI()
            }

            const signedTx = await web3.eth.accounts.signTransaction(txnData, privateKey);
            const txReceipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            resolve(GetUserWinsCount(admin));
        } catch (e) {
            reject(`Txn failed: ${e.message}`)
            return;
        }

        resolve(gasPrice)
    })
}