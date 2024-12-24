const express = require('express');
const path = require('path');
const xlsx = require('xlsx');
const fs = require('fs');
const cors = require('cors'); // CORS 모듈 추가
const app = express();

const PORT = process.env.PORT || 3000;

// CORS 설정 추가 (반드시 다른 app.use 호출 전에 추가)
app.use(cors());

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
    if (typeof excelDate === 'number') {
        const baseDate = new Date(1899, 11, 30);
        const daysOffset = Math.floor(excelDate);
        const date = new Date(baseDate.getTime() + daysOffset * 24 * 60 * 60 * 1000);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    } else if (typeof excelDate === 'string') {
        try {
            const parsedDate = new Date(excelDate);
            if (!isNaN(parsedDate)) {
                return parsedDate.toISOString().split('T')[0];
            }
        } catch {
            return '날짜 오류';
        }
    }
    return '날짜 없음';
}

// 엑셀 데이터 읽기 함수
function readExcelFile() {
    try {
        console.log("엑셀 파일 경로:", excelFilePath);
        const workbook = xlsx.readFile(excelFilePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawData = xlsx.utils.sheet_to_json(sheet);
        console.log("엑셀 원본 데이터:", rawData);

        const data = rawData.map(order => ({
            ...order,
            maskedName: maskName(order.name || ''),
            입고날짜: formatDate(order.orderDate)
        }));
        console.log("처리된 데이터:", data);
        return data;
    } catch (error) {
        console.error("엑셀 파일 읽기 오류:", error.message);
        return [];
    }
}

// 파일 접근 확인
fs.access(excelFilePath, fs.constants.R_OK, (err) => {
    if (err) {
        console.error(`파일 접근 오류: ${err.message}`);
    } else {
        console.log("data.xlsx 파일에 접근할 수 있습니다.");
    }
});

// 데이터 로드
let data = readExcelFile();

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// 주문 내역 조회 API
app.get('/api/orders', (req, res) => {
    try {
        const { name } = req.query;
        if (name) {
            const normalizedInput = normalizeString(name);
            const result = data.filter(order =>
                normalizeString(order.name || '').includes(normalizedInput)
            );
            res.json(result);
        } else {
            res.json(data);
        }
    } catch (error) {
        console.error("Error in /api/orders:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 서버 실행
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});
