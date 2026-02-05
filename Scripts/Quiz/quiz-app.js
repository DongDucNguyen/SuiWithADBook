export class QuizApp {
    // 1. Khai báo các thuộc tính Private
    #questions;
    #currentIndex;
    #score;
    #quizContainer;

    constructor(questions) {
        this.#questions = questions;
        this.#currentIndex = 0;
        this.#score = 0;
        
        // DOM element hiển thị quiz
        this.#quizContainer = document.querySelector('.js-quiz-card');

        if (this.#quizContainer) {
            this.init();
        } else {
            console.warn('QuizApp: Không tìm thấy element .js-quiz-card');
        }
    }

    // Public method: Khởi chạy
    init() {
        this.#renderQuestion();
    }

    // Private method: Render câu hỏi hiện tại
    #renderQuestion() {
        const currentData = this.#questions[this.#currentIndex];
        
        // Template HTML cho câu hỏi
        this.#quizContainer.innerHTML = `
            <div class="question-count">Câu hỏi ${this.#currentIndex + 1} / ${this.#questions.length}</div>
            <h2 class="question-text">${currentData.question}</h2>
            <div class="answers-grid js-answers-grid">
                ${currentData.answers.map((ans, index) => `
                    <button class="answer-btn js-ans-btn" data-index="${index}">
                        ${ans}
                    </button>
                `).join('')}
            </div>
            <div class="quiz-controls">
                </div>
        `;

        this.#addAnswerListeners(currentData.correctIndex);
    }

    // Private method: Xử lý sự kiện click chọn đáp án
    #addAnswerListeners(correctIndex) {
        const buttons = this.#quizContainer.querySelectorAll('.js-ans-btn');
        
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Vô hiệu hóa tất cả nút để không chọn lại
                this.#disableButtons();

                const selectedIndex = parseInt(e.target.dataset.index);
                
                // Logic kiểm tra đúng sai
                if (selectedIndex === correctIndex) {
                    e.target.classList.add('correct');
                    this.#score++;
                } else {
                    e.target.classList.add('wrong');
                    // Hiển thị đáp án đúng để người dùng biết
                    buttons[correctIndex].classList.add('correct');
                }

                // Hiển thị nút tiếp theo hoặc kết quả
                this.#showNextButton();
            });
        });
    }

    // Vô hiệu hóa các nút sau khi đã chọn
    #disableButtons() {
        const buttons = this.#quizContainer.querySelectorAll('.js-ans-btn');
        buttons.forEach(btn => btn.disabled = true);
    }

    // Hiển thị nút chuyển câu
    #showNextButton() {
        const controls = this.#quizContainer.querySelector('.quiz-controls');
        const isLastQuestion = this.#currentIndex === this.#questions.length - 1;
        
        const btnText = isLastQuestion ? "XEM KẾT QUẢ" : "CÂU TIẾP THEO";
        
        controls.innerHTML = `<button class="next-btn js-next-btn">${btnText} &rarr;</button>`;
        
        controls.querySelector('.js-next-btn').addEventListener('click', () => {
            if (isLastQuestion) {
                this.#renderResult();
            } else {
                this.#currentIndex++;
                this.#renderQuestion();
            }
        });
    }

    // Private method: Render màn hình kết quả
    #renderResult() {
        // Tính phần trăm điểm
        const percentage = (this.#score / this.#questions.length) * 100;
        
        let message = "";
        let suiButtonHtml = ""; // Mặc định không có nút nhận quà

        // Logic thông báo và Nút SUI
        if (percentage === 100) {
            message = "TUYỆT VỜI! BẠN LÀ MỘT THIÊN TÀI!";
            
            // CHỈ HIỆN KHI ĐÚNG 100%
            suiButtonHtml = `
                <div style="margin-top: 30px;">
                    <button class="sui-reward-btn js-sui-btn">
                        <i class="fa-solid fa-gift"></i> NHẬN 1 SUI
                    </button>
                </div>
            `;
        } else if (percentage >= 70) {
            message = "Kiến thức của bạn rất tốt!";
        } else {
            message = "Hãy đọc thêm sách và thử lại nhé!";
        }

        // Render HTML kết quả
        this.#quizContainer.innerHTML = `
            <div class="result-score">${this.#score}/${this.#questions.length}</div>
            <p class="question-count">ĐIỂM SỐ CỦA BẠN</p>
            <div class="result-message">${message}</div>
            
            <div class="action-buttons">
                <a href="./Quiz.html" class="read-more-btn" style="padding: 10px 30px; font-size: 1rem;">CHƠI LẠI</a>
                <a href="./Explore-Page.html" class="read-more-btn" style="padding: 10px 30px; font-size: 1rem; margin-left: 10px;">KHÁM PHÁ</a>
            </div>

            ${suiButtonHtml}
        `;

        // Gán sự kiện click cho nút SUI (nếu nút tồn tại)
        const suiBtn = this.#quizContainer.querySelector('.js-sui-btn');
        if (suiBtn) {
            suiBtn.addEventListener('click', () => {
                this.#handleSuiReward();
            });
        }
    }

    // Xử lý khi bấm nhận thưởng
    #handleSuiReward() {
        // Tại đây bạn có thể gọi API blockchain hoặc backend để chuyển token
        // Hiện tại ta giả lập bằng alert
        alert("🎉 Xác nhận! Hệ thống đang gửi 100 SUI vào ví của bạn.");
        
        // Thay đổi trạng thái nút sau khi nhận
        const btn = this.#quizContainer.querySelector('.js-sui-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> ĐÃ NHẬN THƯỞNG';
            btn.style.background = "#888";
            btn.style.boxShadow = "none";
            btn.style.cursor = "default";
            btn.style.animation = "none";
        }
    }
}