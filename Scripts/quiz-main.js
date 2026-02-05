/**
 * File: Scripts/quiz-main.js
 */
import { generateQuiz } from './Quiz/quiz-gen.js';     // Import logic AI
import { QuizApp } from './Quiz/quiz-app.js';     // Import giao diện Quiz

// Hàm chuyển đổi định dạng dữ liệu từ AI sang QuizApp
function mapAIDataToQuizApp(aiDataArray) {
    return aiDataArray.map((item, index) => ({
        id: index + 1,
        question: item.ques,
        answers: [
            item.option1,
            item.option2,
            item.option3,
            item.option4
        ],
        // AI trả về 1-4, QuizApp cần index 0-3
        correctIndex: item.ans - 1
    }));
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. LẤY TÊN SÁCH TỪ LOCALSTORAGE (Được truyền từ Book Details page)
    const storedBookName = localStorage.getItem('bookForQuiz');

    const quizContainer = document.querySelector('.js-quiz-card');
    const loadingText = document.getElementById('loadingText'); // (Tùy chọn nếu bạn muốn hiện loading)

    // Nếu không tìm thấy tên sách trong localStorage
    if (!storedBookName) {
        quizContainer.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <h2>Chưa chọn sách!</h2>
                <p>Vui lòng quay lại trang Khám Phá và chọn một cuốn sách để bắt đầu.</p>
                <a href="./Explore-Page.html" class="read-more-btn">QUAY LẠI</a>
            </div>
        `;
        return;
    }

    // 2. HIỂN THỊ TRẠNG THÁI ĐANG TẠO CÂU HỎI
    console.log(`Đang tạo quiz cho sách: ${storedBookName}`);
    quizContainer.innerHTML = `
        <div style="padding: 60px; text-align: center;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 50px; color: #555;"></i>
            <h2 style="margin-top: 20px; font-family: 'Afacad'">Đang đọc sách "${storedBookName}"...</h2>
            <p>AI đang soạn câu hỏi cho bạn, vui lòng đợi giây lát.</p>
        </div>
    `;

    try {
        // 3. GỌI HÀM TẠO QUIZ (Từ quiz-gen.js)
        const result = await generateQuiz(storedBookName, 5); // Tạo 5 câu

        if (result.success && result.data) {
            // 4. MAP DỮ LIỆU VÀ KHỞI TẠO QUIZ APP
            const formattedData = mapAIDataToQuizApp(result.data);

            // Xóa loading và khởi tạo App
            quizContainer.innerHTML = '';
            new QuizApp(formattedData);

        } else {
            throw new Error(result.error || "Không thể tạo câu hỏi.");
        }

    } catch (error) {
        console.error("Lỗi:", error);
        quizContainer.innerHTML = `
            <div style="padding: 40px; text-align: center; color: #d9534f;">
                <h2>Có lỗi xảy ra!</h2>
                <p>${error.message}</p>
                <button onclick="location.reload()" class="read-more-btn">THỬ LẠI</button>
            </div>
        `;
    }
});