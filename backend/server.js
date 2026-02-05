/**
 * SUI Reward Backend Server - REAL TRANSACTIONS
 * 
 * Server này xử lý việc thưởng SUI THẬT cho user trên TESTNET
 * Sử dụng @mysten/sui để thực hiện giao dịch blockchain
 * 
 * Chạy: npm start (trong folder backend)
 * 
 * ⚠️ QUAN TRỌNG: Cần cấu hình ADMIN_PRIVATE_KEY trong file .env
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { Transaction } = require('@mysten/sui/transactions');

const app = express();
const PORT = process.env.PORT || 3001;

// ============= CONFIGURATION =============
const NETWORK = process.env.SUI_NETWORK || 'testnet';
const REWARD_AMOUNT_SUI = parseFloat(process.env.REWARD_AMOUNT_SUI) || 0.1;
const SUI_DECIMALS = 9;

// Tạo Sui Client
const suiClient = new SuiClient({ url: getFullnodeUrl(NETWORK) });

// Admin Keypair (sẽ khởi tạo từ private key)
let adminKeypair = null;
let adminAddress = null;

// Khởi tạo Admin Wallet
function initAdminWallet() {
    const privateKey = process.env.ADMIN_PRIVATE_KEY;

    if (!privateKey || privateKey === 'your_private_key_here') {
        console.warn('⚠️  WARNING: ADMIN_PRIVATE_KEY chưa được cấu hình!');
        console.warn('   Server sẽ chạy ở chế độ DEMO (fake transactions)');
        return false;
    }

    try {
        // Private key có thể ở dạng base64 hoặc hex
        let keyBytes;

        // Thử decode base64 trước
        if (privateKey.length === 44 || privateKey.length === 88) {
            // Có thể là base64 (32 bytes = 44 chars) hoặc hex (32 bytes = 64 chars)
            if (/^[A-Za-z0-9+/=]+$/.test(privateKey)) {
                // Base64
                keyBytes = Buffer.from(privateKey, 'base64');
            } else {
                // Hex
                keyBytes = Buffer.from(privateKey.replace('0x', ''), 'hex');
            }
        } else if (privateKey.startsWith('suiprivkey')) {
            // Bech32 format từ Sui Wallet
            adminKeypair = Ed25519Keypair.fromSecretKey(privateKey);
        } else {
            // Thử hex
            keyBytes = Buffer.from(privateKey.replace('0x', ''), 'hex');
        }

        if (!adminKeypair && keyBytes) {
            // Nếu keyBytes có 64 bytes (full keypair), lấy 32 bytes đầu
            if (keyBytes.length === 64) {
                keyBytes = keyBytes.slice(0, 32);
            }
            adminKeypair = Ed25519Keypair.fromSecretKey(keyBytes);
        }

        adminAddress = adminKeypair.getPublicKey().toSuiAddress();
        console.log(`✅ Admin wallet loaded: ${adminAddress}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to load admin wallet:', error.message);
        console.warn('   Server sẽ chạy ở chế độ DEMO (fake transactions)');
        return false;
    }
}

// Middleware
app.use(cors());
app.use(express.json());

// Lưu lịch sử giao dịch (in-memory)
const transactionHistory = [];

// ============= API ENDPOINTS =============

/**
 * GET /api/status
 * Kiểm tra trạng thái server và admin wallet
 */
app.get('/api/status', async (req, res) => {
    const status = {
        server: 'running',
        network: NETWORK,
        rewardAmount: REWARD_AMOUNT_SUI,
        adminWallet: adminAddress ? {
            address: adminAddress,
            addressShort: `${adminAddress.slice(0, 8)}...${adminAddress.slice(-6)}`
        } : null,
        mode: adminKeypair ? 'REAL' : 'DEMO'
    };

    // Lấy balance nếu có admin wallet
    if (adminAddress) {
        try {
            const balance = await suiClient.getBalance({
                owner: adminAddress,
                coinType: '0x2::sui::SUI'
            });
            status.adminWallet.balance = Number(BigInt(balance.totalBalance)) / Math.pow(10, SUI_DECIMALS);
        } catch (error) {
            status.adminWallet.balanceError = error.message;
        }
    }

    res.json(status);
});

/**
 * POST /api/reward
 * Thưởng SUI cho user khi quiz đúng 100%
 * 
 * Body: { userAddress: string, bookName: string }
 * Response: { success: boolean, txHash: string, amount: number }
 */
app.post('/api/reward', async (req, res) => {
    const { userAddress, bookName } = req.body;

    // Validate input
    if (!userAddress) {
        return res.status(400).json({
            success: false,
            error: "Thiếu địa chỉ ví người nhận"
        });
    }

    // Validate Sui address format
    if (!userAddress.startsWith('0x') || userAddress.length !== 66) {
        return res.status(400).json({
            success: false,
            error: "Địa chỉ ví không hợp lệ"
        });
    }

    try {
        let txResult;

        if (adminKeypair) {
            // ========== REAL TRANSACTION ==========
            txResult = await sendRealReward(userAddress, bookName);
        } else {
            // ========== DEMO MODE (FAKE) ==========
            txResult = await sendFakeReward(userAddress, bookName);
        }

        // Lưu lịch sử
        const transaction = {
            id: transactionHistory.length + 1,
            txHash: txResult.txHash,
            from: adminAddress || 'DEMO_ADMIN',
            to: userAddress,
            amount: REWARD_AMOUNT_SUI,
            bookName: bookName || "Unknown",
            timestamp: new Date().toISOString(),
            status: txResult.success ? "SUCCESS" : "FAILED",
            mode: adminKeypair ? 'REAL' : 'DEMO'
        };
        transactionHistory.push(transaction);

        console.log(`${adminKeypair ? '✅' : '🎭'} REWARD: ${REWARD_AMOUNT_SUI} SUI → ${userAddress.substring(0, 16)}...`);
        console.log(`   Book: ${bookName}`);
        console.log(`   TxHash: ${txResult.txHash}`);

        res.json({
            success: true,
            txHash: txResult.txHash,
            amount: REWARD_AMOUNT_SUI,
            message: `Đã gửi ${REWARD_AMOUNT_SUI} SUI vào ví của bạn!`,
            explorerUrl: `https://suiscan.xyz/${NETWORK}/tx/${txResult.txHash}`,
            mode: adminKeypair ? 'REAL' : 'DEMO'
        });

    } catch (error) {
        console.error('❌ Reward error:', error);
        res.status(500).json({
            success: false,
            error: error.message || "Lỗi khi gửi thưởng"
        });
    }
});

/**
 * Gửi SUI thật trên blockchain
 */
async function sendRealReward(toAddress, bookName) {
    // Convert SUI to MIST
    const amountInMist = BigInt(Math.floor(REWARD_AMOUNT_SUI * Math.pow(10, SUI_DECIMALS)));

    // Tạo transaction
    const tx = new Transaction();

    // Split coin và transfer
    const [coin] = tx.splitCoins(tx.gas, [amountInMist]);
    tx.transferObjects([coin], toAddress);

    // Sign và execute
    const result = await suiClient.signAndExecuteTransaction({
        signer: adminKeypair,
        transaction: tx,
        options: {
            showEffects: true,
            showEvents: true
        }
    });

    // Check result
    if (result.effects?.status?.status !== 'success') {
        throw new Error(`Transaction failed: ${result.effects?.status?.error || 'Unknown error'}`);
    }

    return {
        success: true,
        txHash: result.digest
    };
}

/**
 * Fake reward cho demo mode
 */
async function sendFakeReward(toAddress, bookName) {
    // Giả lập delay network
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

    return {
        success: true,
        txHash: 'DEMO_' + generateFakeTxHash()
    };
}

function generateFakeTxHash() {
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 64; i++) {
        hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
}

/**
 * GET /api/transactions
 * Lấy lịch sử giao dịch
 */
app.get('/api/transactions', (req, res) => {
    res.json({
        totalTransactions: transactionHistory.length,
        transactions: transactionHistory.slice().reverse() // Newest first
    });
});

/**
 * GET /api/balance/:address
 * Lấy số dư SUI thật của một địa chỉ
 */
app.get('/api/balance/:address', async (req, res) => {
    const { address } = req.params;

    try {
        const balance = await suiClient.getBalance({
            owner: address,
            coinType: '0x2::sui::SUI'
        });

        res.json({
            address: address,
            balance: Number(BigInt(balance.totalBalance)) / Math.pow(10, SUI_DECIMALS),
            balanceInMist: balance.totalBalance,
            unit: "SUI",
            network: NETWORK
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/faucet
 * Request SUI từ testnet faucet cho admin wallet
 * (Chỉ hoạt động trên testnet/devnet)
 */
app.post('/api/faucet', async (req, res) => {
    if (!adminAddress) {
        return res.status(400).json({
            success: false,
            error: 'Admin wallet chưa được cấu hình'
        });
    }

    if (NETWORK === 'mainnet') {
        return res.status(400).json({
            success: false,
            error: 'Faucet không khả dụng trên mainnet'
        });
    }

    try {
        // Gọi faucet API
        const faucetUrl = NETWORK === 'testnet'
            ? 'https://faucet.testnet.sui.io/gas'
            : 'https://faucet.devnet.sui.io/gas';

        const response = await fetch(faucetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                FixedAmountRequest: {
                    recipient: adminAddress
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        res.json({
            success: true,
            message: 'Đã request SUI từ faucet',
            txDigests: data.transferredGasObjects?.map(o => o.transferTxDigest) || []
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============= START SERVER =============

// Khởi tạo admin wallet trước
const isRealMode = initAdminWallet();

app.listen(PORT, () => {
    console.log('');
    console.log('========================================');
    console.log('   🚀 SUI Reward Server Started!');
    console.log('========================================');
    console.log(`   URL: http://localhost:${PORT}`);
    console.log(`   Network: ${NETWORK.toUpperCase()}`);
    console.log(`   Mode: ${isRealMode ? '🟢 REAL TRANSACTIONS' : '🟡 DEMO MODE'}`);
    console.log(`   Reward: ${REWARD_AMOUNT_SUI} SUI per quiz`);

    if (adminAddress) {
        console.log(`   Admin: ${adminAddress.slice(0, 12)}...${adminAddress.slice(-6)}`);
    } else {
        console.log('   Admin: Not configured');
    }

    console.log('');
    console.log('   Endpoints:');
    console.log('   - GET  /api/status       → Server status');
    console.log('   - POST /api/reward       → Gửi thưởng SUI');
    console.log('   - GET  /api/transactions → Xem lịch sử');
    console.log('   - GET  /api/balance/:addr → Xem số dư');
    console.log('   - POST /api/faucet       → Request testnet SUI');
    console.log('========================================');
    console.log('');
});
