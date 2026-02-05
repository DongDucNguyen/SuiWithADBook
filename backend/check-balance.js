// check-balance.js - Kiểm tra số dư SUI

const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');

const address = process.argv[2] || '0xfd0490fb31aa7050a09e191146841d306fddd6635c472ff3a8a3690a535b5c11';

async function checkBalance(addr) {
    console.log(`📊 Checking balance for: ${addr}`);
    console.log('');

    const client = new SuiClient({ url: getFullnodeUrl('testnet') });

    try {
        const balance = await client.getBalance({
            owner: addr,
            coinType: '0x2::sui::SUI'
        });

        const suiBalance = Number(BigInt(balance.totalBalance)) / 1e9;
        console.log(`💰 Balance: ${suiBalance} SUI`);
        console.log(`   (${balance.totalBalance} MIST)`);
        console.log('');
        console.log(`🔗 Explorer: https://suiscan.xyz/testnet/account/${addr}`);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkBalance(address);
