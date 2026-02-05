// check-coins.js - Kiểm tra chi tiết các Coin Object trong ví
const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');

const address = '0x0faae4574ac1a7e1e01947cb6026fef39a8d94f33d07ec54845979a3b1aeec09';

async function checkCoins() {
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });

    console.log(`🔍 Checking coins for: ${address}`);

    const coins = await client.getCoins({
        owner: address,
        coinType: '0x2::sui::SUI'
    });

    console.log(`\n💰 Total Balance: ${coins.data.reduce((sum, c) => sum + Number(c.balance), 0) / 1e9} SUI`);
    console.log(`📦 Coin Objects: ${coins.data.length}`);

    coins.data.forEach((coin, i) => {
        console.log(`   ${i + 1}. ${coin.balance / 1e9} SUI (Digest: ${coin.digest})`);
    });
}

checkCoins();
