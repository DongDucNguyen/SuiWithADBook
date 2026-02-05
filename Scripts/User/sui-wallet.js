// Scripts/User/sui-wallet.js
// SUI Wallet Service - Vanilla JS implementation using Wallet Standard
// Compatible with Slush, Sui Wallet, and other Wallet Standard compliant wallets

const TESTNET_RPC = 'https://fullnode.testnet.sui.io:443';
const STORAGE_KEY = 'sui_wallet_address';
const SUI_DECIMALS = 9; // 1 SUI = 10^9 MIST

/**
 * SuiWalletService - Service class để quản lý kết nối với Sui Wallet
 * Sử dụng Wallet Standard API để detect và connect với các wallet extensions
 */
export class SuiWalletService {
    static #registeredWallets = [];
    static #currentWallet = null;
    static #isInitialized = false;

    // =============================================
    // INITIALIZATION - Listen for wallet registration
    // =============================================

    /**
     * Khởi tạo listener để detect wallet extensions
     * Wallet Standard sử dụng event 'wallet-standard:app-ready' để thông báo
     */
    static init() {
        if (this.#isInitialized) return;
        this.#isInitialized = true;

        // Method 1: Check for already registered wallets
        this.#discoverExistingWallets();

        // Method 2: Listen for new wallet registrations
        window.addEventListener('wallet-standard:app-ready', (event) => {
            console.log('🔌 Wallet Standard: App ready event received');
            this.#discoverExistingWallets();
        });

        // Method 3: Polling fallback for wallets that inject late
        setTimeout(() => this.#discoverExistingWallets(), 500);
        setTimeout(() => this.#discoverExistingWallets(), 1500);

        console.log('✅ SuiWalletService initialized');
    }

    /**
     * Discover wallets that implement Wallet Standard
     */
    static #discoverExistingWallets() {
        // Check for Wallet Standard API
        const walletStandard = window['@wallet-standard/app'];

        if (walletStandard && walletStandard.wallets) {
            this.#registeredWallets = walletStandard.wallets.get();
            console.log(`📦 Found ${this.#registeredWallets.length} wallet(s) via Wallet Standard`);
            return;
        }

        // Fallback: Check for common wallet injections
        const wallets = [];

        // Slush Wallet (formerly Sui Wallet by Mysten Labs)
        if (window.slush) {
            wallets.push({
                name: 'Slush',
                icon: 'https://slush.app/favicon.ico',
                provider: window.slush,
                type: 'slush'
            });
        }

        // Sui Wallet (legacy)
        if (window.suiWallet) {
            wallets.push({
                name: 'Sui Wallet',
                icon: 'https://sui.io/favicon.ico',
                provider: window.suiWallet,
                type: 'sui'
            });
        }

        // Suiet Wallet
        if (window.suiet) {
            wallets.push({
                name: 'Suiet',
                icon: 'https://suiet.app/favicon.ico',
                provider: window.suiet,
                type: 'suiet'
            });
        }

        // Ethos Wallet
        if (window.ethosWallet) {
            wallets.push({
                name: 'Ethos',
                icon: 'https://ethoswallet.xyz/favicon.ico',
                provider: window.ethosWallet,
                type: 'ethos'
            });
        }

        this.#registeredWallets = wallets;
        console.log(`📦 Found ${wallets.length} wallet(s) via fallback detection`);
    }

    // =============================================
    // PUBLIC API - Wallet Detection & Connection
    // =============================================

    /**
     * Kiểm tra xem có wallet extension nào được cài đặt không
     * @returns {boolean}
     */
    static isWalletInstalled() {
        this.#discoverExistingWallets();
        return this.#registeredWallets.length > 0;
    }

    /**
     * Lấy danh sách các wallet đã cài đặt
     * @returns {Array}
     */
    static getInstalledWallets() {
        this.#discoverExistingWallets();
        return this.#registeredWallets.map(w => ({
            name: w.name,
            icon: w.icon
        }));
    }

    // =============================================
    // PUBLIC API - Wallet Connection (Manual Input)
    // =============================================

    /**
     * Kiểm tra địa chỉ ví hợp lệ
     * @param {string} address 
     * @returns {boolean}
     */
    static isValidAddress(address) {
        return typeof address === 'string' &&
            address.startsWith('0x') &&
            address.length === 66; // Sui address len is 32 bytes (64 hex) + 0x = 66
    }

    /**
     * Lưu địa chỉ ví user nhập vào
     * @param {string} address 
     * @returns {Promise<{success: boolean, address?: string, error?: string}>}
     */
    static async connectManual(address) {
        if (!SuiWalletService.isValidAddress(address)) {
            return {
                success: false,
                error: 'Địa chỉ ví không hợp lệ. Phải bắt đầu bằng 0x và dài 66 ký tự.'
            };
        }

        SuiWalletService.#saveAddress(address);
        console.log(`✅ Ví đã lưu: ${address}`);

        // Check balance ngay để verify ví tồn tại (optional)
        const check = await SuiWalletService.getBalance(address);
        if (!check.success) {
            console.warn('⚠️ Không thể lấy số dư, nhưng vẫn lưu địa chỉ.');
        }

        return { success: true, address };
    }

    /**
     * Tương thích ngược: Cố gắng lấy từ extension nếu user muốn
     * (Vẫn giữ để sau này dùng nếu cần)
     */
    static async connectExtension(walletName = null) {
        SuiWalletService.#discoverExistingWallets();

        if (SuiWalletService.#registeredWallets.length === 0) {
            return {
                success: false,
                error: 'Không tìm thấy Sui Wallet extension. Vui lòng cài đặt Slush hoặc Sui Wallet.',
                installUrl: 'https://slush.app'
            };
        }

        try {
            // Chọn wallet để connect
            let wallet = walletName
                ? SuiWalletService.#registeredWallets.find(w => w.name.toLowerCase() === walletName.toLowerCase())
                : SuiWalletService.#registeredWallets[0];

            if (!wallet) {
                wallet = SuiWalletService.#registeredWallets[0];
            }

            console.log(`🔗 Connecting to ${wallet.name}...`);

            let address = null;

            // Xử lý theo loại wallet
            if (wallet.features && wallet.features['standard:connect']) {
                // Wallet Standard compliant
                const result = await wallet.features['standard:connect'].connect();
                if (result.accounts && result.accounts.length > 0) {
                    address = result.accounts[0].address;
                }
            } else if (wallet.provider) {
                // Fallback for injected providers
                const provider = wallet.provider;

                if (typeof provider.requestPermissions === 'function') {
                    await provider.requestPermissions();
                }

                if (typeof provider.getAccounts === 'function') {
                    const accounts = await provider.getAccounts();
                    address = accounts[0];
                } else if (typeof provider.connect === 'function') {
                    const result = await provider.connect();
                    address = result.address || result.accounts?.[0]?.address;
                }
            }

            if (address) {
                SuiWalletService.#currentWallet = wallet;
                SuiWalletService.#saveAddress(address);
                console.log(`✅ Connected to ${wallet.name}: ${address}`);
                return { success: true, address, walletName: wallet.name };
            } else {
                return { success: false, error: 'Không thể lấy địa chỉ ví. Vui lòng thử lại.' };
            }

        } catch (error) {
            console.error('❌ Connection error:', error);

            // Handle user rejection
            if (error.code === 4001 || error.message?.includes('rejected')) {
                return { success: false, error: 'Bạn đã từ chối kết nối ví.' };
            }

            return { success: false, error: error.message || 'Lỗi không xác định khi kết nối.' };
        }
    }

    /**
     * Ngắt kết nối wallet
     */
    static disconnect() {
        localStorage.removeItem(STORAGE_KEY);
        this.#currentWallet = null;
        console.log('🔌 Wallet disconnected');
    }

    /**
     * Lấy địa chỉ đã lưu
     * @returns {string|null}
     */
    static getSavedAddress() {
        return localStorage.getItem(STORAGE_KEY);
    }

    // =============================================
    // RPC CALLS - Interact with Sui Network
    // =============================================

    /**
     * Gọi Sui RPC
     * @param {string} method - RPC method
     * @param {Array} params - Parameters
     * @returns {Promise<any>}
     */
    static async #rpcCall(method, params = []) {
        const response = await fetch(TESTNET_RPC, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: Date.now(),
                method,
                params
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || 'RPC Error');
        }

        return data.result;
    }

    /**
     * Lấy số dư SUI của một địa chỉ
     * @param {string} address
     * @returns {Promise<{success: boolean, balance?: number, error?: string}>}
     */
    static async getBalance(address) {
        try {
            const result = await this.#rpcCall('suix_getBalance', [
                address,
                '0x2::sui::SUI'
            ]);

            const balanceInMist = BigInt(result.totalBalance);
            const balanceInSui = Number(balanceInMist) / Math.pow(10, SUI_DECIMALS);

            return {
                success: true,
                balance: balanceInSui,
                balanceInMist: result.totalBalance
            };
        } catch (error) {
            console.error('❌ getBalance error:', error);
            return { success: false, error: error.message, balance: 0 };
        }
    }

    /**
     * Lấy thông tin coins của địa chỉ
     * @param {string} address
     * @returns {Promise<Array>}
     */
    static async getCoins(address) {
        try {
            const result = await this.#rpcCall('suix_getCoins', [
                address,
                '0x2::sui::SUI',
                null,
                50  // limit
            ]);
            return result.data || [];
        } catch (error) {
            console.error('❌ getCoins error:', error);
            return [];
        }
    }

    // =============================================
    // HELPER FUNCTIONS
    // =============================================

    /**
     * Format địa chỉ ngắn gọn
     * @param {string} address
     * @returns {string}
     */
    static formatAddress(address) {
        if (!address) return '';
        if (address.length <= 16) return address;
        return `${address.slice(0, 8)}...${address.slice(-6)}`;
    }

    /**
     * Lấy URL explorer cho địa chỉ
     * @param {string} address
     * @returns {string}
     */
    static getExplorerUrl(address) {
        return `https://suiscan.xyz/testnet/account/${address}`;
    }

    /**
     * Lấy URL explorer cho transaction
     * @param {string} txHash
     * @returns {string}
     */
    static getTxExplorerUrl(txHash) {
        return `https://suiscan.xyz/testnet/tx/${txHash}`;
    }

    /**
     * Mở trang cài đặt wallet
     */
    static openInstallPage() {
        window.open('https://slush.app', '_blank');
    }

    /**
     * Lưu địa chỉ vào localStorage
     * @param {string} address
     */
    static #saveAddress(address) {
        localStorage.setItem(STORAGE_KEY, address);
    }

    /**
     * Convert MIST to SUI
     * @param {string|number|BigInt} mist
     * @returns {number}
     */
    static mistToSui(mist) {
        return Number(BigInt(mist)) / Math.pow(10, SUI_DECIMALS);
    }

    /**
     * Convert SUI to MIST
     * @param {number} sui
     * @returns {string}
     */
    static suiToMist(sui) {
        return String(Math.floor(sui * Math.pow(10, SUI_DECIMALS)));
    }
}

// Auto-initialize when script loads
SuiWalletService.init();

// Re-initialize after DOM is fully loaded (some wallets inject late)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => SuiWalletService.init(), 100);
    });
}
