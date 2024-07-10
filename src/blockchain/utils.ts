import { TGInitData } from "src/game/data/TGTypes";

export function decodeTgInitData(urlParams: string): TGInitData {
    let params = new URLSearchParams(urlParams);
    let result: any = {};
    for (let [key, value] of params.entries()) {
        try {
            result[key] = JSON.parse(decodeURIComponent(value));
        } catch (e) {
            result[key] = decodeURIComponent(value);
        }
    }
    return result;
}