import Web3 from "web3";
import fetch from 'node-fetch';
import crypto  from 'crypto';
import { ERC20ABI, JournalABI } from "./ABI.js";
import { admin, decimals, fastServerUrl, journal, networkParams, token } from "./network.js";
import { ComplexAutData, TelegramAuthData } from "./types.js";

const web3 = new Web3(networkParams.rpcUrl);
const journalContract = new web3.eth.Contract(JournalABI, journal);
const tokenContract = new web3.eth.Contract(ERC20ABI, token);

export async function GetUserWinsCount(address: string) {
  return new Promise(async (resolve, reject) => {
    try {
      const dt = await journalContract.methods.getUserWinsCount(address).call();
      resolve(Number(dt));
    } catch (e) {
      reject(`Request to network failed: ${e.message}`);
    }
  });
}

export async function GetUserPrizeBalance(address: string) {
  return new Promise(async (resolve, reject) => {
    try {
      const dt = await journalContract.methods.balanceOf(address).call();
      resolve(Number(dt) / 10 ** decimals);
    } catch (e) {
      reject(`Request to network failed: ${e.message}`);
    }
  });
}

export async function RecordWinner(address: string) {
  return new Promise(async (resolve, reject) => {
    const privateKey = process.env.ADMIN_PRIVATE_KEY;
    const publicKey = process.env.ADMIN_ADDRESS;
    if (!privateKey || !publicKey) {
      reject("Admin data not found");
      return;
    }

    const gasPrice = Number(await web3.eth.getGasPrice());

    try {
      const txnData = {
        from: publicKey,
        to: journal,
        gasPrice,
        gasLimit: web3.utils.toHex(
          await journalContract.methods
            .noteWinner(address)
            .estimateGas({ from: publicKey })
        ),
        value: "0x00",
        data: journalContract.methods.noteWinner(address).encodeABI(),
      };

      const signedTx = await web3.eth.accounts.signTransaction(
        txnData,
        privateKey
      );
      const txReceipt = await web3.eth.sendSignedTransaction(
        signedTx.rawTransaction
      );
      resolve(GetUserWinsCount(admin));
    } catch (e) {
      reject(`Txn failed: ${e.message}`);
      return;
    }

    resolve(gasPrice);
  });
}

export function GetSignedAuthMessage() {
  const dt = new Date().getTime();
  const signMsg = "auth_" + String(dt - (dt % 600000));
  let signature = "";
  const privateKey = process.env.ADMIN_PRIVATE_KEY;
  const sign = web3.eth.accounts.sign(signMsg, privateKey);
  signature = sign.signature;
  return signature;
}

export async function CreateBoxWeb2 (owner: string, login = "", level = 1) {
    return new Promise((resolve, reject) => {
        fetch(fastServerUrl.concat('api/boxes/create'), {
            method: 'post',
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              signature: GetSignedAuthMessage(), 
              ownerAddress: owner, 
              ownerLogin: login || owner,
              level: level
            })
          }).then(res => res.json()).then(res => resolve(res))
    })
}

export async function GiveResourcesWeb2 (owner: string, login = "", resource: string, amount: number) {
    return new Promise((resolve, reject) => {
        fetch(fastServerUrl.concat('api/boxes/assets/give'), {
            method: 'post',
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              signature: GetSignedAuthMessage(), 
              ownerAddress: owner, 
              ownerLogin: login || owner,
              resource: resource,
              amount: amount
            })
          }).then(res => {
            return res.json()
          }).then(res => {
            resolve(res)
            return res
          })
    })
}

export async function DeleteDuel (duelId: string, onlyFinish?: boolean) {
  return new Promise((resolve, reject) => {
    const url = fastServerUrl.concat(onlyFinish? 'api/finishduel': 'api/deleteduel');
    console.log("Duel deletion url: ", url);
    fetch(fastServerUrl.concat(onlyFinish? 'api/finishduel': 'api/deleteduel'), {
      method: 'post',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        signature: GetSignedAuthMessage(), 
        duelId, 
        winner: ""
      })
    }).then(res => {
      console.log("Responce: ", res);
      if (res.status !== 200) {
        reject("Request to delete failed")
      }
      return res.json()
    }).then(res => {
      resolve(res)
      return res
    })
  })
}

export async function GetUserItemBalance(data: {login: string, itemId: number}): Promise<number> {
  return new Promise((resolve, reject) => {
      fetch(fastServerUrl.concat('api/store/userbalance'), {
          method: 'post',
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify({
              login: data.login,
              itemId: data.itemId
          })
      }).then(res => {
          if (res.status !== 200) {
              reject("Failed to get data")
          }
          return res.json()
      }).then((res: { balance: number }) => {
          resolve(res.balance)
      })
  })
}

export async function GetUserItemBalanceAll(login: string): Promise<any> {
  return new Promise((resolve, reject) => {
      fetch(fastServerUrl.concat('api/store/userbalanceall'), {
          method: 'post',
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify({
              login,
          })
      }).then(res => {
          if (res.status !== 200) {
              reject("Failed to get data")
          }
          return res.json()
      }).then((res: { balance: any }) => {
          resolve(res.balance)
      })
  })
}

export function CheckTelegramAuth(auth_data: TelegramAuthData): {
  success: Boolean;
  error: string;
} {
  const { hash, ...restData } = auth_data;
  const processing_data = {
    id: auth_data.id,
    first_name: auth_data.first_name,
    last_name: auth_data.last_name,
    username: auth_data.username,
    auth_date: auth_data.auth_date
  }
  const data_check_arr = Object.entries(processing_data).map(
    ([key, value]) => `${key}=${value}`,
  );
  data_check_arr.sort();
  const data_check_string = data_check_arr.join('\n');
  const secret_key = crypto
    .createHash('sha256')
    .update(process.env.TELEGRAM_API_TOKEN)
    .digest();
  const hashResult = crypto
    .createHmac('sha256', secret_key)
    .update(data_check_string)
    .digest('hex');
  if (hashResult !== hash) {
    return {
      success: false,
      error: 'Invalid hash',
    };
  }
  if (Date.now() / 1000 - auth_data.auth_date > 86400) {
    throw {
      success: false,
      error: 'Data is outdated',
    };
  }
  return {
    success: true,
    error: '',
  };
}

// Auth function from data formatted by mini app
export function ValidateByInitData (initData: any, botToken = token) {
  const urlSearchParams = new URLSearchParams(initData);
  const data = Object.fromEntries(urlSearchParams.entries());

  const checkString = Object.keys(data)
    .filter(key => key !== 'hash')
    .map(key => `${key}=${data[key]}`)
    .sort()
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
 
  const signature = crypto.createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex');
 
  return data.hash === signature;
}


