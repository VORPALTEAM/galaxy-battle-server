export function decodeParams(urlParams: string): any {
    let params = new URLSearchParams(urlParams);
    let result = {};
    for (let [key, value] of params.entries()) {
        try {
            result[key] = JSON.parse(decodeURIComponent(value));
        } catch (e) {
            result[key] = decodeURIComponent(value);
        }
    }
    return result;
}