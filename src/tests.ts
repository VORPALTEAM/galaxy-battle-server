import dotenv from 'dotenv';
import { RecordWinnerWithChoose } from "./blockchain/boxes/boxes.js"
import { GetGameAssetsWeb2, getUserAvailableLaserLevelsWeb2 } from "./blockchain/boxes/boxesweb2.js"

dotenv.config({ path: '.env.production' });

console.log("Tesing...")

const _user = "0xAddressToken".toLowerCase()

getUserAvailableLaserLevelsWeb2(_user).then((result) => {
    console.log(result)
})

RecordWinnerWithChoose(_user, false, "TelegramDebug", 1).then((result) => {
    console.log(result)
    console.log("Requesting assets")
    GetGameAssetsWeb2(_user).then((assets) => {
        console.log(assets)
    })
})