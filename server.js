const express = require('express');
const path = require('path');
const xlsx = require('xlsx');
const app = express();

const PORT = process.env.PORT || 1000; // Render에서 제공하는 PORT 환경 변수 사용

// 엑셀 파일 경로
const excelFilePath = path.join(__dirname, 'data.xlsx');

// 문자열 정규화 함수 (공백 제거, 소문자 변환, 특수문자 제거)
function normalizeString(str) {
    return str
        ? str.trim().toLowerCase().replace(/[^a-zA-Z가-힣0-9]/g, '').replace(/\s+/g, '')
        : '';
}

// 엑셀 데이터 읽기 함수
function readExcelFile() {
    try {
        const workbook = xlsx.readFile(excelFilePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        return xlsx.utils.sheet_to_json(sheet).map(order => ({
            ...order,
            name: normalizeString(order.name), // 데이터에서 이름 정규화
        }));
    } catch (error) {
        console.error("엑셀 파일 읽기 오류:", error.message);
        return [];
    }
}

// Static 파일 제공
app.use(express.static('public'));

// 기본 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 주문 내역 조회 API
app.get('/api/orders', (req, res) => {
    const { name } = req.query;
    const data = readExcelFile();

    if (name) {
        const normalizedInput = normalizeString(name); // 입력값 정규화
        console.log("Normalized Request Name:", normalizedInput);

        const result = data.filter(order =>
            order.name.includes(normalizedInput) // 이름 포함 여부 확인
        );

        console.log("Filtered Data:", result);
        res.json(result);
    } else {
        res.json(data); // name이 없으면 전체 데이터 반환
    }
});

// 서버 실행
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
    console.log(`PORT from environment: ${process.env.PORT}`);
});

// 엑셀 데이터 확인 로그
const data = readExcelFile();
console.log("Excel Data:", data); // 서버 실행 시 엑셀 데이터 출력
