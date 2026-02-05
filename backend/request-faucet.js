// request-faucet.js - Script lấy SUI từ testnet faucet

const address = process.argv[2] || '0xfd0490fb31aa7050a09e191146841d306fddd6635c472ff3a8a3690a535b5c11';
const maxRetries = 5;
const retryDelay = 5000; // 5 seconds

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function requestFaucet(recipientAddress, attempt = 1) {
    console.log(`🚰 [Attempt ${attempt}/${maxRetries}] Requesting testnet SUI for:`);
    console.log(`   ${recipientAddress}`);
    console.log('');

    try {
        const response = await fetch('https://faucet.testnet.sui.io/v2/gas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                FixedAmountRequest: {
                    recipient: recipientAddress
                }
            })
        });

        const text = await response.text();

        // Check for rate limit
        if (text.includes('Too Many') || text.includes('rate')) {
            console.log('⏳ Rate limited. Waiting before retry...');
            if (attempt < maxRetries) {
                await sleep(retryDelay);
                return requestFaucet(recipientAddress, attempt + 1);
            } else {
                console.log('❌ Max retries reached. Please try again later or use:');
                console.log('   1. SuiScan Faucet: https://suiscan.xyz/testnet/faucet');
                console.log('   2. Discord: https://discord.gg/sui');
                return;
            }
        }

        const data = JSON.parse(text);

        if (response.ok && data.transferredGasObjects) {
            console.log('✅ SUCCESS! SUI has been sent to your wallet.');
            console.log('');
            console.log('Transaction details:');
            data.transferredGasObjects.forEach((obj, i) => {
                console.log(`  ${i + 1}. Amount: ${obj.amount / 1e9} SUI`);
                console.log(`     Tx: ${obj.transferTxDigest}`);
                console.log(`     View: https://suiscan.xyz/testnet/tx/${obj.transferTxDigest}`);
            });
            console.log('');
            console.log(`📊 Check balance: https://suiscan.xyz/testnet/account/${recipientAddress}`);
        } else {
            console.log('❌ Error:', data.message || text);
        }
    } catch (error) {
        console.error('❌ Request failed:', error.message);
        if (attempt < maxRetries) {
            console.log('   Retrying...');
            await sleep(retryDelay);
            return requestFaucet(recipientAddress, attempt + 1);
        }
    }
}

requestFaucet(address);

