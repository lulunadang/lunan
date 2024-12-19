const express = require('express');
const xlsx = require('xlsx');
const app = express();
const port = 4000;

app.use(express.json());
app.use(express.static('public'));

// 엑셀 파일 경로
const excelFilePath = './data.xlsx';

// 엑셀 데이터 읽기 함수
function readExcelFile() {
    try {
        const workbook = xlsx.readFile(excelFilePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet);
        console.log("✅ 엑셀 데이터 읽기 결과:", jsonData); // 디버깅 로그 추가
        return jsonData;
    } catch (error) {
        console.error("❌ 엑셀 파일 읽기 오류:", error.message); // 에러 로그 추가
        return [];
    }
}

// 주문 목록 조회 API
app.get('/api/orders', (req, res) => {
    const { name } = req.query;
    const data = readExcelFile();
    if (data.length === 0) {
        console.log("❌ API 요청 데이터 없음");
    } else {
        console.log("✅ API 요청 데이터:", data);
    }
    const result = name ? data.filter(order => order.name === name) : data;
    res.json(result);
});

// 서버 실행
app.listen(port, () => {
    console.log(`✅ 서버가 http://localhost:${port} 에서 실행 중입니다.`);
});

{
    "name": "shopping-app",
    "version": "1.0.0",
    "main": "server.js",
    "scripts": {
      "start": "node server.js"
    },
    "dependencies": {
      "express": "^4.18.2",
      "xlsx": "^0.18.5"
    }
  }
  