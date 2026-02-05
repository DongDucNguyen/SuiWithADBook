// Scripts/User/sui-modal.js
import { SuiWalletService } from './sui-wallet.js';

export class SuiAccountModal {
    #overlay;
    #contentContainer;
    #isLoading = false;

    constructor() {
        this.#renderBase();
        this.#attachCloseEvents();
    }

    // 1. Tạo khung Modal cơ bản (ẩn)
    #renderBase() {
        this.#overlay = document.createElement('div');
        this.#overlay.className = 'modal-overlay modal-overlay-sui';
        this.#overlay.innerHTML = `
            <div class="modal-content">
                <button type="button" class="close-modal-btn js-close">&times;</button>
                <div class="modal-header">Ví SUI Wallet</div>
                
                <div id="sui-modal-body"></div>
            </div>
        `;
        document.body.appendChild(this.#overlay);
        this.#contentContainer = this.#overlay.querySelector('#sui-modal-body');
    }

    // 2. Hàm hiển thị Modal
    show() {
        console.log("SuiAccountModal.show() được gọi");
        this.#overlay.classList.add('active');
        this.#checkAndRenderContent();
    }

    // 3. Đóng Modal
    close() {
        this.#overlay.classList.remove('active');
    }

    #attachCloseEvents() {
        this.#overlay.querySelectorAll('.js-close').forEach(btn => {
            btn.addEventListener('click', () => this.close());
        });
        this.#overlay.addEventListener('click', (e) => {
            if (e.target === this.#overlay) this.close();
        });
    }

    // 4. Logic kiểm tra trạng thái để render
    #checkAndRenderContent() {
        const savedAddress = SuiWalletService.getSavedAddress();

        if (savedAddress) {
            this.#renderProfileView(savedAddress);
        } else {
            this.#renderConnectView();
        }
    }

    // =============================================
    // VIEW 1: CHƯA KẾT NỐI - Nhập địa chỉ ví (Manual)
    // =============================================
    #renderConnectView() {
        this.#contentContainer.innerHTML = `
            <div class="sui-connect-container">
                <img src="https://assets.coingecko.com/coins/images/26375/large/sui_asset.jpeg" 
                     alt="Sui Logo" class="sui-logo-large">
                
                <p class="sui-desc">
                    Nhập địa chỉ ví SUI của bạn để nhận thưởng.<br>
                    <small style="color:#666">Hỗ trợ mọi loại ví (Slush, Sui Wallet, ...)</small>
                </p>

                <div style="margin-bottom: 15px;">
                    <input type="text" id="sui-wallet-input" 
                        placeholder="0x..." 
                        style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: monospace;"
                    >
                    <div id="sui-input-error" style="color: red; font-size: 12px; margin-top: 5px; display: none;"></div>
                </div>

                <button class="btn btn-sui-connect js-connect-manual" style="width:100%;">
                    <i class="fa-solid fa-link"></i> Lưu địa chỉ ví
                </button>
                
                <div style="margin-top: 15px; font-size: 13px; color: #888;">
                    Bạn chưa có ví? <a href="https://slush.app" target="_blank" style="color: #4da2ff;">Tạo ví tại đây</a>
                </div>
            </div>
        `;

        // Event: Lưu địa chỉ
        const btn = this.#contentContainer.querySelector('.js-connect-manual');
        const input = this.#contentContainer.querySelector('#sui-wallet-input');
        const errorMsg = this.#contentContainer.querySelector('#sui-input-error');

        btn.addEventListener('click', async () => {
            const address = input.value.trim();

            // UI Loading
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang kiểm tra...';
            errorMsg.style.display = 'none';

            // Gọi Service Connect Manual
            const result = await SuiWalletService.connectManual(address);

            if (result.success) {
                // Thành công -> Render profile view
                this.#renderProfileView(result.address);
            } else {
                // Lỗi -> hiện thông báo
                errorMsg.textContent = result.error;
                errorMsg.style.display = 'block';
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-link"></i> Lưu địa chỉ ví';
            }
        });
    }

    // =============================================
    // VIEW 2: ĐÃ KẾT NỐI - Hiện thông tin ví
    // =============================================
    async #renderProfileView(address) {
        // Hiển thị loading trước
        this.#contentContainer.innerHTML = `
            <div style="text-align:center; padding:40px;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size:32px; color:#4da2ff;"></i>
                <p style="margin-top:10px;">Đang tải thông tin...</p>
            </div>
        `;

        // Lấy balance thực từ RPC
        const balanceResult = await SuiWalletService.getBalance(address);
        const balance = balanceResult.success ? balanceResult.balance.toFixed(4) : '0.0000';

        // Render UI
        this.#contentContainer.innerHTML = `
            <div class="sui-profile-container">
                <div class="sui-info-card">
                    <div style="text-align: center; margin-bottom: 15px;">
                        <img src="https://assets.coingecko.com/coins/images/26375/large/sui_asset.jpeg" 
                             alt="Sui Logo" style="width:60px; border-radius:50%; margin-bottom:10px;">
                        <div style="font-size: 12px; color: #666;">TESTNET</div>
                    </div>

                    <div style="margin-bottom:15px;">
                        <div class="sui-label">Địa chỉ ví</div>
                        <div class="sui-value" style="word-break:break-all; font-family:monospace; font-size:13px;">
                            ${SuiWalletService.formatAddress(address)}
                            <i class="fa-regular fa-copy js-copy-btn" style="cursor:pointer; margin-left:8px;" title="Sao chép"></i>
                        </div>
                    </div>

                    <div style="margin-bottom:15px;">
                        <div class="sui-label">Số dư</div>
                        <div class="sui-balance-highlight" style="font-size:28px; color:#4da2ff;">
                            ${balance} SUI
                        </div>
                    </div>

                    <div style="margin-bottom:15px;">
                        <a href="${SuiWalletService.getExplorerUrl(address)}" 
                           target="_blank" 
                           style="color:#4da2ff; text-decoration:none; font-size:14px;">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> Xem trên SuiScan
                        </a>
                    </div>
                </div>

                <div class="modal-actions" style="justify-content: center; gap:10px;">
                    <button class="btn js-refresh" style="background:#eee; color:#333;">
                        <i class="fa-solid fa-rotate"></i> Làm mới
                    </button>
                    <button class="btn btn-sui-disconnect js-disconnect">
                        <i class="fa-solid fa-right-from-bracket"></i> Ngắt kết nối
                    </button>
                </div>
            </div>
        `;

        // Event: Refresh
        this.#contentContainer.querySelector('.js-refresh').addEventListener('click', () => {
            this.#renderProfileView(address);
        });

        // Event: Ngắt kết nối
        this.#contentContainer.querySelector('.js-disconnect').addEventListener('click', () => {
            this.#handleDisconnect();
        });

        // Event: Copy địa chỉ
        const copyBtn = this.#contentContainer.querySelector('.js-copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(address);
                copyBtn.className = 'fa-solid fa-check';
                copyBtn.style.color = '#4CAF50';
                setTimeout(() => {
                    copyBtn.className = 'fa-regular fa-copy';
                    copyBtn.style.color = '';
                }, 2000);
            });
        }
    }

    // =============================================
    // HANDLERS
    // =============================================

    // Kết nối ví thật qua extension
    async #handleRealConnect() {
        if (this.#isLoading) return;
        this.#isLoading = true;

        // Hiển thị loading
        const btn = this.#contentContainer.querySelector('.js-connect-wallet');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang kết nối...';
        btn.disabled = true;

        try {
            const result = await SuiWalletService.connect();

            if (result.success) {
                // Thành công
                alert(`✅ Kết nối thành công!\n\nĐịa chỉ: ${SuiWalletService.formatAddress(result.address)}`);
                this.#renderProfileView(result.address);
            } else {
                // Thất bại
                if (result.installUrl) {
                    if (confirm(`❌ ${result.error}\n\nBạn có muốn cài đặt ngay không?`)) {
                        SuiWalletService.openInstallPage();
                    }
                } else {
                    alert(`❌ ${result.error}`);
                }
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        } catch (error) {
            console.error('Connect error:', error);
            alert(`❌ Lỗi: ${error.message}`);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }

        this.#isLoading = false;
    }

    // Ngắt kết nối
    #handleDisconnect() {
        if (confirm("Bạn có chắc muốn ngắt kết nối ví SUI?")) {
            SuiWalletService.disconnect();
            this.#renderConnectView();
        }
    }
}