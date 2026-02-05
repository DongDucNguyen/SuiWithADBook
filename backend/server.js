/**
 * SUI Reward Backend Server
 * 
 * Server này xử lý việc thưởng SUI cho user khi hoàn thành quiz 100%
 * Hiện tại sử dụng FAKE transaction để demo
 * 
 * Chạy: npm start (trong folder backend)
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ============= FAKE DATA (HARDCODE) =============
// Giả lập địa chỉ admin và số dư
const ADMIN_WALLET = {
    address: "0xADMIN_WALLET_FAKE_ADDRESS_1234567890abcdef",
    balance: 1000000 // 1,000,000 SUI (fake)
};

// Lưu lịch sử giao dịch (in-memory)
const transactionHistory = [];

// ============= API ENDPOINTS =============

/**
 * POST /api/reward
 * Thưởng SUI cho user khi quiz đúng 100%
 * 
 * Body: { userAddress: string, bookName: string }
 * Response: { success: boolean, txHash: string, amount: number }
 */
app.post('/api/reward', (req, res) => {
    const { userAddress, bookName } = req.body;

    // Validate input
    if (!userAddress) {
        return res.status(400).json({
            success: false,
            error: "Thiếu địa chỉ ví người nhận"
        });
    }

    // Giả lập delay network (500ms - 1500ms)
    const delay = Math.random() * 1000 + 500;

    setTimeout(() => {
        // ========== FAKE TRANSACTION ==========
        // Trong thực tế, đây sẽ là lệnh:
        // sui client pay-sui --input-coins COIN_ID --recipients userAddress --amounts 1000000000

        const rewardAmount = 1; // 1 SUI
        const fakeTxHash = generateFakeTxHash();

        // Lưu lịch sử
        const transaction = {
            id: transactionHistory.length + 1,
            txHash: fakeTxHash,
            from: ADMIN_WALLET.address,
            to: userAddress,
            amount: rewardAmount,
            bookName: bookName || "Unknown",
            timestamp: new Date().toISOString(),
            status: "SUCCESS"
        };
        transactionHistory.push(transaction);

        // Giảm số dư admin (fake)
        ADMIN_WALLET.balance -= rewardAmount;

        console.log(`✅ REWARD SENT: ${rewardAmount} SUI → ${userAddress.substring(0, 20)}...`);
        console.log(`   Book: ${bookName}`);
        console.log(`   TxHash: ${fakeTxHash}`);

        res.json({
            success: true,
            txHash: fakeTxHash,
            amount: rewardAmount,
            message: `Đã gửi ${rewardAmount} SUI vào ví của bạn!`,
            explorerUrl: `https://suiscan.xyz/testnet/tx/${fakeTxHash}`
        });
    }, delay);
});

/**
 * GET /api/transactions
 * Lấy lịch sử giao dịch (cho admin xem)
 */
app.get('/api/transactions', (req, res) => {
    res.json({
        adminBalance: ADMIN_WALLET.balance,
        totalTransactions: transactionHistory.length,
        transactions: transactionHistory
    });
});

/**
 * GET /api/balance/:address
 * Lấy số dư SUI của một địa chỉ (FAKE)
 */
app.get('/api/balance/:address', (req, res) => {
    const { address } = req.params;

    // Tính tổng SUI đã nhận từ lịch sử
    const received = transactionHistory
        .filter(tx => tx.to === address)
        .reduce((sum, tx) => sum + tx.amount, 0);

    res.json({
        address: address,
        balance: received,
        unit: "SUI"
    });
});

// ============= HELPER FUNCTIONS =============

function generateFakeTxHash() {
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 64; i++) {
        hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
}

// ============= START SERVER =============

app.listen(PORT, () => {
    console.log('');
    console.log('========================================');
    console.log('   🚀 SUI Reward Server Started!');
    console.log('========================================');
    console.log(`   URL: http://localhost:${PORT}`);
    console.log(`   Admin Wallet: ${ADMIN_WALLET.address.substring(0, 20)}...`);
    console.log(`   Initial Balance: ${ADMIN_WALLET.balance} SUI`);
    console.log('');
    console.log('   Endpoints:');
    console.log('   - POST /api/reward      → Gửi thưởng SUI');
    console.log('   - GET  /api/transactions → Xem lịch sử');
    console.log('   - GET  /api/balance/:addr → Xem số dư');
    console.log('========================================');
    console.log('');
});
