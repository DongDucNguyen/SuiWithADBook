// generate-server-wallet.js - Tạo server wallet mới
// Chạy: node generate-server-wallet.js

const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const fs = require('fs');
const path = require('path');

console.log('');
console.log('🔐 ===== TẠO SERVER WALLET MỚI =====');
console.log('');

// 1. Generate keypair mới
const keypair = new Ed25519Keypair();

// 2. Lấy thông tin
const address = keypair.getPublicKey().toSuiAddress();
const privateKeyBytes = keypair.getSecretKey();
const privateKeyBase64 = Buffer.from(privateKeyBytes).toString('base64');
const privateKeyHex = Buffer.from(privateKeyBytes).toString('hex');

console.log('✅ Server Wallet đã được tạo thành công!');
console.log('');
console.log('📋 THÔNG TIN VÍ:');
console.log('─'.repeat(60));
console.log(`   Address:     ${address}`);
console.log('─'.repeat(60));
console.log('');
console.log('🔑 PRIVATE KEY (chọn 1 trong 2 format):');
console.log('─'.repeat(60));
console.log(`   Base64: ${privateKeyBase64}`);
console.log('');
console.log(`   Hex:    ${privateKeyHex.substring(0, 64)}`);
console.log('─'.repeat(60));
console.log('');

// 3. Tự động ghi vào .env
const envPath = path.join(__dirname, '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
}

// Cập nhật hoặc thêm ADMIN_PRIVATE_KEY
if (envContent.includes('ADMIN_PRIVATE_KEY=')) {
    envContent = envContent.replace(
        /ADMIN_PRIVATE_KEY=.*/,
        `ADMIN_PRIVATE_KEY=${privateKeyBase64}`
    );
} else {
    envContent += `\n# Server Wallet (auto-generated)\nADMIN_PRIVATE_KEY=${privateKeyBase64}\n`;
}

// Cập nhật hoặc thêm ADMIN_ADDRESS
if (envContent.includes('ADMIN_ADDRESS=')) {
    envContent = envContent.replace(
        /ADMIN_ADDRESS=.*/,
        `ADMIN_ADDRESS=${address}`
    );
} else {
    envContent += `ADMIN_ADDRESS=${address}\n`;
}

fs.writeFileSync(envPath, envContent);

console.log('💾 Đã tự động lưu vào file .env');
console.log('');
console.log('📝 BƯỚC TIẾP THEO:');
console.log('─'.repeat(60));
console.log('1. Nạp SUI testnet vào ví server này:');
console.log(`   https://faucet.testnet.sui.io/`);
console.log('   hoặc: node request-faucet.js ${address}');
console.log('');
console.log('2. Kiểm tra balance:');
console.log(`   node check-balance.js ${address}`);
console.log('');
console.log('3. Khởi động server:');
console.log('   npm start');
console.log('─'.repeat(60));
console.log('');
console.log('⚠️  LƯU Ý BẢO MẬT:');
console.log('   - File .env KHÔNG được commit lên git');
console.log('   - Backup private key ở nơi an toàn');
console.log('   - Đây là ví TESTNET, không dùng cho mainnet');
console.log('');
