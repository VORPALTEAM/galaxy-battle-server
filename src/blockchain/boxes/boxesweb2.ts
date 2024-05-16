import fetch from 'node-fetch';
import { fastServerUrl } from "../network.js";
import { GetUserItemBalance } from '../functions.js';

export type web2assets = {
    laser1: number;
    laser2: number;
    laser3: number;
    token: number;
    spice: number;
    spore: number;
    metal: number;
    biomass: number;
    carbon: number;
}

export async function getUserBoxesToOpenWeb2 ( ownerAddress: string ) {
    return new Promise((resolve, reject) => {
        const url = fastServerUrl.concat('api/boxes/available');
        fetch(url, {
            method: 'post',
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              ownerAddress: ownerAddress, 
            })
          }).then(res => {
            if (res.status !== 200) {
                reject("Api reqest failed")
            }
            return res.json()
        }).then(res => {
            resolve(res)
            return res
          })
    })
}

export async function GetGameAssetsWeb2 ( ownerAddress: string ): Promise<web2assets> {
    return new Promise((resolve, reject) => {
        const url = fastServerUrl.concat('api/boxes/assets');
        fetch(url, {
            method: 'post',
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              ownerAddress: ownerAddress, 
            })
          }).then(res => {
            if (res.status !== 200) {
                reject("Api reqest failed")
            }
            return res.json()
        }).then((res: {assets: {
            laser1: number;
            laser2: number;
            laser3: number;
            token: number;
            spice: number;
            spore: number;
            metal: number;
            biomass: number;
            carbon: number;
        }}) => {
             resolve(res.assets)
             return res.assets;
          })
    })
}

export function GetBoxPrizeTypeWeb2(prize: string) {
    return prize;
}

export async function getBoxDataWeb2(_boxId: number) {

    return new Promise((resolve, reject) => {
        const url = fastServerUrl.concat('api/boxes/openresult');
        fetch(url, {
            method: 'post',
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              boxId: _boxId, 
            })
          }).then(res => {
            if (res.status !== 200) {
                reject("Api reqest failed")
            }
            return res.json()
        }).then((res: any) => {
             if (!res.data) {
                resolve(
                    {
                        type: "0x0000000000000000000000",
                        value: null,
                        laserLevel: null,
                        isPaid: false
                    }
                )
             } else {
                const data = {
                    type: res.data.openresult.indexOf("laser") > -1 ? "laser" : res.data.openresult,
                    value: res.data.openresult.indexOf("laser") > -1 ? null : res.data.openamount,
                    laserLevel: res.data.openresult.indexOf("laser") > -1 ? Number(res.data.openresult.replace("laser", "")) : null,
                    isPaid: true
                }
                resolve(data);
             }
             return res.assets;
          })
    })
}

export async function getUserLaserListWeb2(_user: string) {
    // const data = await GetGameAssetsWeb2(_user);
    const data = await Promise.all([
        GetUserItemBalance({login: _user, itemId:8}),
        GetUserItemBalance({login: _user, itemId:9}),
        GetUserItemBalance({login: _user, itemId:10})
    ])
    const levels: number[] = [];
    if (data[0] > 0) {
        levels.push(0)
    }
    if (data[1] > 0) {
        levels.push(1)
    }
    if (data[2] > 0) {
        levels.push(2)
    }
    return levels;
}

export async function getUserAvailableLaserLevelsWeb2(_user: string): Promise<number[]> {
    const list: number[] = [];
    const lasers = await Promise.all([
        GetUserItemBalance({login: _user, itemId:8}),
        GetUserItemBalance({login: _user, itemId:9}),
        GetUserItemBalance({login: _user, itemId:10})
    ]);
    return lasers
}