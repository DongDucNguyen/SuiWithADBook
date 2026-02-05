// test-transfer.js - Test chuyển SUI thật trên testnet
// Chạy: node test-transfer.js <recipient_address>

require('dotenv').config();
const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { Transaction } = require('@mysten/sui/transactions');

const NETWORK = process.env.SUI_NETWORK || 'testnet';
const SUI_DECIMALS = 9;
const TRANSFER_AMOUNT = 0.1; // 0.1 SUI

async function testTransfer() {
    // 1. Kiểm tra private key
    const privateKey = process.env.ADMIN_PRIVATE_KEY;

    if (!privateKey || privateKey === 'your_private_key_here') {
        console.log('❌ LỖI: ADMIN_PRIVATE_KEY chưa được cấu hình');
        console.log('');
        console.log('Hướng dẫn:');
        console.log('1. Mở Slush Wallet extension');
        console.log('2. Click avatar → Settings → Export Private Key');
        console.log('3. Copy private key và paste vào file backend/.env:');
        console.log('   ADMIN_PRIVATE_KEY=<your_private_key>');
        console.log('');
        console.log('Hoặc chạy với biến môi trường:');
        console.log('   set ADMIN_PRIVATE_KEY=<key> && node test-transfer.js');
        return;
    }

    // 2. Lấy recipient address từ argument hoặc user wallet
    const recipientAddress = process.argv[2] || '0xfd0490fb31aa7050a09e191146841d306fddd6635c472ff3a8a3690a535b5c11';

    console.log('🔄 Khởi tạo Sui Client...');
    console.log(`   Network: ${NETWORK}`);
    console.log(`   Recipient: ${recipientAddress}`);
    console.log(`   Amount: ${TRANSFER_AMOUNT} SUI`);
    console.log('');

    try {
        // 3. Tạo keypair từ private key
        let keypair;

        if (privateKey.startsWith('suiprivkey')) {
            // Bech32 format
            keypair = Ed25519Keypair.fromSecretKey(privateKey);
        } else {
            // Hex hoặc Base64 format
            let keyBytes;
            if (/^[A-Fa-f0-9]+$/.test(privateKey.replace('0x', ''))) {
                keyBytes = Buffer.from(privateKey.replace('0x', ''), 'hex');
            } else {
                keyBytes = Buffer.from(privateKey, 'base64');
            }

            if (keyBytes.length === 64) {
                keyBytes = keyBytes.slice(0, 32);
            }

            keypair = Ed25519Keypair.fromSecretKey(keyBytes);
        }

        const adminAddress = keypair.getPublicKey().toSuiAddress();
        console.log(`✅ Admin wallet loaded: ${adminAddress}`);

        // 4. Tạo client và kiểm tra balance
        const client = new SuiClient({ url: getFullnodeUrl(NETWORK) });

        const balance = await client.getBalance({
            owner: adminAddress,
            coinType: '0x2::sui::SUI'
        });
        const suiBalance = Number(BigInt(balance.totalBalance)) / Math.pow(10, SUI_DECIMALS);
        console.log(`💰 Admin balance: ${suiBalance} SUI`);

        if (suiBalance < TRANSFER_AMOUNT + 0.01) {
            console.log('❌ Không đủ SUI để chuyển (cần thêm cho gas fee)');
            return;
        }

        // 5. Tạo transaction
        console.log('');
        console.log('📝 Tạo transaction...');

        const amountInMist = BigInt(Math.floor(TRANSFER_AMOUNT * Math.pow(10, SUI_DECIMALS)));

        const tx = new Transaction();
        const [coin] = tx.splitCoins(tx.gas, [amountInMist]);
        tx.transferObjects([coin], recipientAddress);

        // 6. Sign và execute
        console.log('✍️  Ký và gửi transaction...');

        const result = await client.signAndExecuteTransaction({
            signer: keypair,
            transaction: tx,
            options: {
                showEffects: true,
                showEvents: true
            }
        });

        // 7. Kiểm tra kết quả
        if (result.effects?.status?.status === 'success') {
            console.log('');
            console.log('🎉 THÀNH CÔNG!');
            console.log('');
            console.log('Transaction Details:');
            console.log(`   Digest: ${result.digest}`);
            console.log(`   From: ${adminAddress}`);
            console.log(`   To: ${recipientAddress}`);
            console.log(`   Amount: ${TRANSFER_AMOUNT} SUI`);
            console.log('');
            console.log(`🔗 Explorer: https://suiscan.xyz/${NETWORK}/tx/${result.digest}`);

            // Kiểm tra balance mới của recipient
            console.log('');
            console.log('Checking recipient balance...');
            const recipientBalance = await client.getBalance({
                owner: recipientAddress,
                coinType: '0x2::sui::SUI'
            });
            console.log(`📊 Recipient balance: ${Number(BigInt(recipientBalance.totalBalance)) / 1e9} SUI`);

        } else {
            console.log('❌ Transaction thất bại:', result.effects?.status?.error);
        }

    } catch (error) {
        console.error('❌ Lỗi:', error.message);

        if (error.message.includes('Invalid private key')) {
            console.log('');
            console.log('Private key không hợp lệ. Đảm bảo:');
            console.log('- Copy đúng toàn bộ private key từ Slush');
            console.log('- Không có khoảng trắng thừa');
        }
    }
}

testTransfer();
