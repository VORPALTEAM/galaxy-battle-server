import { getUserAvailableLaserLevelsWeb2 } from "./blockchain/boxes/boxesweb2.js"


console.log("Tesing...")

const _user = "0xWalletToTests".toLowerCase()

getUserAvailableLaserLevelsWeb2(_user).then((result) => {
    console.log(result)
})