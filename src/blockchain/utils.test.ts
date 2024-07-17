import { decodeTgInitString } from "./utils";

test('decodeTgInitString', () => {
    let res = decodeTgInitString('testErrorString');
    expect(res).toBeFalsy();
});