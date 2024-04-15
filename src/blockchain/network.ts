export const connect = {
    keepAlive: true,
    withCredentials: false,
    timeout: 20000,
    headers: [
        {
            name: 'Access-Control-Allow-Origin',
            value: '*'
        }
    ]
  }

/* TESTNET! */
export const networkParams = {
   networkId: 5611,
   networkHexID: '0x15eb',
   chainName: 'Binance Tsetnet opBNB',
   ethSymbol: 'TBNB',
   rpcUrl: "https://opbnb-testnet-rpc.bnbchain.org"
}

// addresses
export const token = "0xA1F665463fB67DA960198b033F63A2bD720a923A";
export const journal = "0xE3E4192acBeba757e96E3caDFB4155CD734B187B";
export const admin = "0x4ff986A4a4E2341b8a7EDcb0624e66d801105038";
export const decimals = 18;

export const fastServerUrl = "https://staging-api.vorpal.finance/"