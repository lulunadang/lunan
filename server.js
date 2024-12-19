const path = require('path');
const xlsx = require('xlsx'); // xlsx 모듈 가져오기

const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000; // Render가 제공하는 PORT 환경 변수 사용

// Static 파일 제공 (HTML, CSS 등)
app.use(express.static('public'));

// 엑셀 파일 경로
const excelFilePath = path.join(__dirname, 'data.xlsx');

// 엑셀 데이터 읽기 함수
function readExcelFile() {
    try {
        const workbook = xlsx.readFile(excelFilePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        return xlsx.utils.sheet_to_json(sheet);
    } catch (error) {
        console.error("엑셀 파일 읽기 오류:", error.message);
        return [];
    }
}

// 기본 라우트 - 홈
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // HTML 파일 제공
});

// 주문 내역 조회 API
app.get('/api/orders', (req, res) => {
    const { name } = req.query; // 쿼리 파라미터에서 name 가져오기
    const data = readExcelFile();
    const result = name ? data.filter(order => order.name === name) : data;
    res.json(result); // 결과를 JSON 형식으로 반환
});

// 서버 실행
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});

