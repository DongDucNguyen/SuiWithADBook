/**
 * AI Quiz Generator - Vanilla JS
 * Chạy trực tiếp trên browser, không cần Node.js
 */

// ============= CẤU HÌNH =============
const CONFIG = {
    API_KEY: "API_O_DAY",
    MODEL: "gemini-2.5-flash",
    API_URL: "https://generativelanguage.googleapis.com/v1beta/models"
};

// ============= TẠO PROMPT =============
function createQuizPrompt(bookName, count = 10) {
    return `Book:"${bookName}"
Task:Generate ${count} quiz questions.
Output JSON array only,no markdown:
[{"ques":"<q>","option1":"<o>","option2":"<o>","option3":"<o>","option4":"<o>","ans":<1-4>}]
Rules:
-ans=correct option number(1-4)
-Vietnamese
-Diverse topics:plot,characters,themes`;
}

// ============= GỌI API =============
async function callGeminiAPI(prompt) {
    const url = `${CONFIG.API_URL}/${CONFIG.MODEL}:generateContent?key=${CONFIG.API_KEY}`;

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "API Error");
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// ============= PARSE RESPONSE =============
function parseResponse(rawText) {
    let text = rawText.trim();

    // Xóa markdown code block nếu có
    text = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "");

    // Tìm JSON array trong text (bắt đầu [ và kết thúc ])
    const startIdx = text.indexOf("[");
    const endIdx = text.lastIndexOf("]");

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        text = text.substring(startIdx, endIdx + 1);
    }

    // Fix các lỗi JSON phổ biến
    text = text
        .replace(/,\s*]/g, "]")           // Xóa dấu phẩy thừa cuối array
        .replace(/,\s*}/g, "}")           // Xóa dấu phẩy thừa cuối object
        .replace(/[\r\n]+/g, " ")         // Thay newline bằng space
        .replace(/\s+/g, " ");            // Gộp nhiều spaces

    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("Raw text:", rawText);
        console.error("Cleaned text:", text);
        throw new Error("JSON parse failed: " + e.message);
    }
}

// ============= HÀM CHÍNH CHO FRONTEND =============
/**
 * Tạo quiz từ tên sách
 * @param {string} bookName - Tên sách
 * @param {number} count - Số câu hỏi (mặc định 10)
 * @returns {Promise<{success: boolean, data: Array|null, error: string|null}>}
 * 
 * Cách dùng:
 *   const result = await generateQuiz("Đắc nhân tâm", 10);
 *   if (result.success) {
 *       console.log(result.data); // Mảng câu hỏi
 *   }
 */
export async function generateQuiz(bookName, count = 10) {
    try {
        const prompt = createQuizPrompt(bookName, count);
        const rawText = await callGeminiAPI(prompt);
        const quizzes = parseResponse(rawText);

        // Console.log đáp án để debug
        console.log("=== QUIZ GENERATED ===");
        quizzes.forEach((q, i) => {
            console.log(`Câu ${i + 1}: ${q.ques}`);
            console.log(`  Đáp án đúng: ${q.ans} - ${q[`option${q.ans}`]}`);
        });
        console.log("======================");

        return { success: true, data: quizzes, error: null };
    } catch (error) {
        return { success: false, data: null, error: error.message };
    }
}
