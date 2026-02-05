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
        const savedAddress = localStorage.getItem('sui_address');

        if (savedAddress) {
            this.#renderProfileView(savedAddress);
        } else {
            this.#renderConnectView();
        }
    }

    // --- VIEW 1: CHƯA CÓ TÀI KHOẢN (Hiện khung đăng ký/kết nối) ---
    #renderConnectView() {
        this.#contentContainer.innerHTML = `
            <div class="sui-connect-container">
                <img src="https://assets.coingecko.com/coins/images/26375/large/sui_asset.jpeg" alt="Sui Logo" class="sui-logo-large">
                
                <p class="sui-desc">
                    Kết nối ví SUI để nhận thưởng khi trả lời câu hỏi và donate cho tác giả.<br>
                    Hệ thống hỗ trợ ví <b>Sui Wallet</b>.
                </p>

                <button class="btn btn-sui-connect js-connect-action">
                    <i class="fa-solid fa-link"></i> Đăng ký / Kết nối Ví
                </button>
            </div>
        `;

        // Gán sự kiện click nút kết nối
        this.#contentContainer.querySelector('.js-connect-action').addEventListener('click', () => {
            this.#handleConnect();
        });
    }

    // --- VIEW 2: ĐÃ CÓ TÀI KHOẢN (Hiện thông tin) ---
    async #renderProfileView(address) {
        // Giả lập lấy số dư (hoặc gọi API getBalance thực tế nếu đã tích hợp file sui-wallet.js)
        // Ở đây mình lấy tạm từ localStorage hoặc hiện 0 SUI nếu chưa có
        let balance = "0.00"; 
        
        // Render UI
        this.#contentContainer.innerHTML = `
            <div class="sui-profile-container">
                <div class="sui-info-card">
                    <div>
                        <div class="sui-label">Địa chỉ ví</div>
                        <div class="sui-value">
                            ${address}
                            <i class="fa-regular fa-copy" style="cursor:pointer" title="Sao chép"></i>
                        </div>
                    </div>

                    <div>
                        <div class="sui-label">Số dư hiện tại</div>
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
    }

    // --- LOGIC XỬ LÝ (JS THUẦN) ---

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
        if(confirm("Bạn có chắc muốn ngắt kết nối ví SUI khỏi tài khoản này?")) {
            localStorage.removeItem('sui_address');
            this.#renderConnectView(); // Quay về giao diện đăng ký
        }
    }
}