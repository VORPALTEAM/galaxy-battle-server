
export class MyUtils {
    
    static getFileName(aFilePath: string): string {
        return aFilePath.split('\\').pop().split('/').pop();
    }

    static getRandomRBG(aMinimum = 0): number {
        // let alphaStepCnt = 15;
        // let alphaStepValue = 255 / alphaStepCnt;
        let r = Math.trunc(aMinimum + Math.random() * (255 - aMinimum));
        let g = Math.trunc(aMinimum + Math.random() * (255 - aMinimum));
        let b = Math.trunc(aMinimum + Math.random() * (255 - aMinimum));
        // let step = randomIntInRange(0, alphaStepCnt);
        // let a = Math.trunc(step * alphaStepValue);
        return (r << 16) + (g << 8) + b;
    }

}