const express = require('express');
const path = require('path');
const xlsx = require('xlsx');
const app = express();

const PORT = process.env.PORT || 1000;

// 엑셀 파일 경로
const excelFilePath = path.join(__dirname, 'data.xlsx');

// 문자열 정규화 함수
function normalizeString(str) {
    return str ? str.trim().toLowerCase().replace(/[^a-zA-Z가-힣0-9]/g, '').replace(/\s+/g, '') : '';
}

// 이름 마스킹 함수
function maskName(name) {
    return name.split('').map((char, index) =>
        index === 0 || index === 3 ? char : '*'
    ).join('');
}

// 날짜 포맷 변환 함수
function formatDate(excelDate) {
    const baseDate = new Date(1899, 11, 30);
    const daysOffset = Math.floor(excelDate);
    const date = new Date(baseDate.getTime() + daysOffset * 24 * 60 * 60 * 1000);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

// 엑셀 데이터 읽기
function readExcelFile() {
    const workbook = xlsx.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(sheet).map(order => ({
        ...order,
        maskedName: maskName(order.name),
        입고날짜: formatDate(order.orderDate)
    }));
}

// 데이터 로드
let data = readExcelFile();

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// 주문 내역 조회 API
app.get('/api/orders', (req, res) => {
    const { name } = req.query;

    if (name) {
        const normalizedInput = normalizeString(name);
        const result = data.filter(order =>
            normalizeString(order.name).includes(normalizedInput)
        );
        res.json(result);
    } else {
        res.json(data);
    }
});

// 서버 실행
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});
console.log("엑셀 데이터:", readExcelFile());
