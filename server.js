const express = require('express');
const path = require('path');
const xlsx = require('xlsx');
const app = express();

const PORT = process.env.PORT || 3000;

// 엑셀 파일 경로
const excelFilePath = path.join(__dirname, 'data.xlsx');

// 문자열 정규화 함수
function normalizeString(str) {
    return str ? str.trim().toLowerCase().replace(/[^a-zA-Z가-힣0-9_]/g, '').replace(/\s+/g, '') : '';
}

// 이름 마스킹 함수
function maskName(name) {
    return name.split('').map((char, index) =>
        index === 0 || index === 3 || char === '_' ? char : '*'
    ).join('');
}

// 날짜 포맷 변환 함수
function formatDate(excelDate) {
    const baseDate = new Date(1899, 11, 30); // Excel 날짜 기준
    const daysOffset = Math.floor(excelDate);
    const date = new Date(baseDate.getTime() + daysOffset * 24 * 60 * 60 * 1000);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

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

// 데이터를 로드 및 이름 마스킹 처리
const data = readExcelFile().map(order => ({
    ...order,
    maskedName: maskName(order.name), // 이름 마스킹 추가
    입고날짜: formatDate(order.orderDate) // 입고 날짜 포맷 추가
}));

if (data.length > 0) {
    console.log("Excel Data Loaded Successfully:", data);
} else {
    console.error("Excel Data is empty or failed to load.");
}

// Static 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// 기본 라우트 처리 (index.html 파일 제공)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 주문 내역 조회 API
app.get('/api/orders', (req, res) => {
    const { name } = req.query;

    if (!data || data.length === 0) {
        return res.status(500).json({ error: 'Data not loaded' });
    }

    if (name) {
        const normalizedInput = normalizeString(name);
        const result = data.filter(order =>
            normalizeString(order.name).includes(normalizedInput)
        ).map(order => ({
            ...order,
            name: maskName(order.name), // API 응답에서 이름 마스킹
            입고날짜: order.입고날짜 // 포맷된 입고 날짜
        }));
        res.json(result);
    } else {
        const maskedData = data.map(order => ({
            ...order,
            name: maskName(order.name), // 전체 데이터 마스킹
            입고날짜: order.입고날짜 // 포맷된 입고 날짜
        }));
        res.json(maskedData);
    }
});

// 서버 실행
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});
