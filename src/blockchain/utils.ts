import { TGInitData } from "../game/data/TGTypes";

export function decodeTgInitString(urlParams: string): TGInitData {
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