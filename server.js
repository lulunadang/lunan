const express = require('express');
const path = require('path');
const xlsx = require('xlsx');
const app = express();
const fs = require('fs');

const PORT = process.env.PORT || 3000;

// 엑셀 파일 경로
const excelFilePath = path.join(__dirname, 'data.xlsx');

// 문자열 정규화 함수
function normalizeString(str) {
    return str ? str.trim().toLowerCase().replace(/[^a-zA-Z가-힣0-9]/g, '').replace(/\s+/g, '') : '';
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

// 주문 상태 업데이트 함수
function updateOrderStatus(name, status) {
    const workbook = xlsx.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // 상태 업데이트
    const updatedData = data.map(order => {
        if (normalizeString(order.name) === normalizeString(name)) {
            order.status = status; // 주문의 상태를 업데이트
        }
        return order;
    });

    // 업데이트된 데이터를 Excel 파일에 다시 저장
    const newSheet = xlsx.utils.json_to_sheet(updatedData);
    workbook.Sheets[sheetName] = newSheet;
    xlsx.writeFile(workbook, excelFilePath);
}

// 주문 상태 변경 API
app.post('/api/updateStatus', express.json(), (req, res) => {
    const { name, status } = req.body;
    updateOrderStatus(name, status);
    res.json({ message: '상태가 업데이트되었습니다.' });
});

// 기본 라우트 및 주문 내역 조회 API
app.use(express.static('public'));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 주문 내역 조회 API
app.get('/api/orders', (req, res) => {
    const { name } = req.query;
    const data = readExcelFile();

    if (name) {
        const normalizedInput = normalizeString(name); // 입력값 정규화
        const result = data.filter(order =>
            order.name.includes(normalizedInput) // 이름 포함 여부 확인
        );
        res.json(result);
    } else {
        res.json(data); // name이 없으면 전체 데이터 반환
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});
