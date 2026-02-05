// Scripts/User/sui-modal.js

export class SuiAccountModal {
    #overlay;
    #contentContainer;

    constructor() {
        this.#renderBase();
        this.#attachCloseEvents();
    }

    // 1. Tạo khung Modal cơ bản (ẩn)
    #renderBase() {
        this.#overlay = document.createElement('div');
        this.#overlay.className = 'modal-overlay';
        this.#overlay.innerHTML = `
            <div class="modal-content">
                <button type="button" class="close-modal-btn js-close">&times;</button>
                <div class="modal-header">Tài khoản SUI Wallet</div>
                
                <div id="sui-modal-body"></div>
            </div>
        `;
        document.body.appendChild(this.#overlay);
        this.#contentContainer = this.#overlay.querySelector('#sui-modal-body');
    }

    // 2. Hàm hiển thị Modal
    show() {
        console.log("SuiAccountModal.show() được gọi"); // DEBUG
        this.#overlay.classList.add('active');
        this.#checkAndRenderContent();
        console.log("Modal overlay:", this.#overlay); // DEBUG
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
        const savedAddress = localStorage.getItem('sui_address');

        if (savedAddress) {
            this.#renderProfileView(savedAddress);
        } else {
            this.#renderConnectView();
        }
    }

    // --- VIEW 1: CHƯA CÓ TÀI KHOẢN (Hiện form đăng ký FAKE) ---
    #renderConnectView() {
        this.#contentContainer.innerHTML = `
            <div class="sui-connect-container">
                <img src="https://assets.coingecko.com/coins/images/26375/large/sui_asset.jpeg" alt="Sui Logo" class="sui-logo-large">
                
                <p class="sui-desc">
                    Đăng ký hoặc kết nối ví SUI để nhận thưởng khi hoàn thành quiz.<br>
                    <small style="color:#888">* Demo mode - Nhập thông tin bất kỳ</small>
                </p>

                <div class="sui-register-form">
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="display:block; margin-bottom:5px; font-weight:600;">Tên hiển thị</label>
                        <input type="text" class="form-input js-sui-name" placeholder="VD: Nguyen Van A" style="width:100%; box-sizing:border-box;">
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="display:block; margin-bottom:5px; font-weight:600;">Địa chỉ ví SUI</label>
                        <input type="text" class="form-input js-sui-address" placeholder="VD: 0x1234...abcd" style="width:100%; box-sizing:border-box;">
                        <small style="color:#888; font-size:12px;">Nhập địa chỉ ví hoặc để trống để tự tạo</small>
                    </div>

                    <button class="btn btn-sui-connect js-connect-action" style="width:100%;">
                        <i class="fa-solid fa-wallet"></i> Kết nối ví
                    </button>
                </div>
            </div>
        `;

        // Gán sự kiện click nút kết nối
        this.#contentContainer.querySelector('.js-connect-action').addEventListener('click', () => {
            this.#handleFakeConnect();
        });
    }

    // --- VIEW 2: ĐÃ CÓ TÀI KHOẢN (Hiện thông tin) ---
    #renderProfileView(address) {
        // Lấy thông tin từ localStorage (FAKE - không cần backend)
        const displayName = localStorage.getItem('sui_display_name') || 'Anonymous User';
        const balance = parseFloat(localStorage.getItem('sui_balance') || '0').toFixed(2);

        // Render UI
        this.#contentContainer.innerHTML = `
            <div class="sui-profile-container">
                <div class="sui-info-card">
                    <div style="text-align: center; margin-bottom: 15px;">
                        <div class="sui-label">Chủ tài khoản</div>
                        <div style="font-size: 24px; font-weight: 700; color: #333;">
                            ${displayName}
                        </div>
                    </div>

                    <div>
                        <div class="sui-label">Địa chỉ ví</div>
                        <div class="sui-value">
                            ${address.substring(0, 20)}...${address.substring(address.length - 10)}
                            <i class="fa-regular fa-copy js-copy-btn" style="cursor:pointer" title="Sao chép"></i>
                        </div>
                    </div>

                    <div>
                        <div class="sui-label">Số dư hiện tại (từ Quiz)</div>
                        <div class="sui-balance-highlight">${balance} SUI</div>
                    </div>
                </div>

                <div class="modal-actions" style="justify-content: center;">
                    <button class="btn btn-sui-disconnect js-disconnect">
                        <i class="fa-solid fa-right-from-bracket"></i> Ngắt kết nối ví
                    </button>
                </div>
            </div>
        `;

        // Sự kiện ngắt kết nối
        this.#contentContainer.querySelector('.js-disconnect').addEventListener('click', () => {
            this.#handleDisconnect();
        });

        // Sự kiện copy địa chỉ
        const copyBtn = this.#contentContainer.querySelector('.js-copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(address);
                copyBtn.className = 'fa-solid fa-check';
                setTimeout(() => {
                    copyBtn.className = 'fa-regular fa-copy';
                }, 2000);
            });
        }
    }

    // --- LOGIC XỬ LÝ (JS THUẦN) ---

    // FAKE Connect - Xử lý form đăng ký giả lập
    #handleFakeConnect() {
        const nameInput = this.#contentContainer.querySelector('.js-sui-name');
        const addressInput = this.#contentContainer.querySelector('.js-sui-address');

        const displayName = nameInput.value.trim() || 'Anonymous User';
        let walletAddress = addressInput.value.trim();

        // Nếu không nhập địa chỉ, tự tạo địa chỉ fake
        if (!walletAddress) {
            walletAddress = this.#generateFakeAddress();
        }

        // Lưu vào LocalStorage
        localStorage.setItem('sui_address', walletAddress);
        localStorage.setItem('sui_display_name', displayName);

        // Thông báo thành công
        alert(`Kết nối thành công!\n\nTên: ${displayName}\nVí: ${walletAddress.substring(0, 20)}...`);

        // Render lại giao diện sang View Profile
        this.#renderProfileView(walletAddress);
    }

    // Tạo địa chỉ ví fake
    #generateFakeAddress() {
        const chars = '0123456789abcdef';
        let address = '0x';
        for (let i = 0; i < 64; i++) {
            address += chars[Math.floor(Math.random() * chars.length)];
        }
        return address;
    }

    async #handleConnect() {
        // Kiểm tra xem trình duyệt có cài extension Sui Wallet chưa
        const provider = window.suiWallet;

        if (!provider) {
            alert("Không tìm thấy ví SUI! Vui lòng cài đặt extension Sui Wallet trên trình duyệt.");
            window.open("https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbnyfyjmg", "_blank");
            return;
        }

        try {
            // Yêu cầu quyền truy cập
            const hasPermissions = await provider.hasPermissions();
            if (!hasPermissions) {
                await provider.requestPermissions();
            }

            // Lấy thông tin tài khoản
            const accounts = await provider.getAccounts();
            if (accounts && accounts.length > 0) {
                const address = accounts[0];

                // Lưu vào LocalStorage (giả lập việc "Đăng ký" thành công)
                localStorage.setItem('sui_address', address);

                // Thông báo thành công
                alert("Đăng ký & Kết nối ví SUI thành công!");

                // Render lại giao diện sang View Profile
                this.#renderProfileView(address);
            }
        } catch (error) {
            console.error(error);
            alert("Kết nối thất bại hoặc bị từ chối.");
        }
    }

    #handleDisconnect() {
        // Xử lý xác nhận
        if (confirm("Bạn có chắc muốn ngắt kết nối ví SUI khỏi tài khoản này?")) {
            localStorage.removeItem('sui_address');
            localStorage.removeItem('sui_display_name');
            this.#renderConnectView(); // Quay về giao diện đăng ký
        }
    }
}