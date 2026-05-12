// ====================================================
// 把這段程式碼貼到 Google Apps Script 編輯器
// 更新後記得重新部署（部署 → 管理部署 → 編輯 → 版本選「新版本」→ 部署）
// ====================================================

const SHEET_NAME = 'orders';

function doGet(e) {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return jsonResponse({ orders: {} });

  const orders = {};
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const name = row[0];
    if (!name) continue;
    orders[name] = {
      pasta: row[1] || '',
      sauce: row[2] || '',
      ingredient: row[3] || '',
      price: row[4] || 0,
      combo: row[5] || '',
      addon: row[6] || '',
      extra: row[7] || '',
      sides: row[8] || '',
      drinks: row[9] || '',
      temp: row[10] || '',
      dessert: row[11] || '',
      clamExtra: row[12] === true || row[12] === 'TRUE',
      note: row[13] || '',
      total: row[14] || 0,
      timestamp: row[15] || '',
    };
  }

  return jsonResponse({ orders });
}

function doPost(e) {
  const sheet = getOrCreateSheet();
  const payload = JSON.parse(e.postData.contents);
  const name = payload.name;
  const data = payload.data;

  // Find existing row for this person (start from row 2, row 1 is header)
  const allData = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === name) {
      rowIndex = i + 1; // Sheet rows are 1-indexed
      break;
    }
  }

  const row = [
    name,
    data.pasta || '',
    data.sauce || '',
    data.ingredient || '',
    data.price || 0,
    data.combo || '',
    data.addon || '',
    data.extra || '',
    data.sides || '',
    data.drinks || '',
    data.temp || '',
    data.dessert || '',
    data.clamExtra || false,
    data.note || '',
    data.total || 0,
    new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
  ];

  if (rowIndex > 0) {
    // Overwrite existing row
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    // New person, append
    sheet.appendRow(row);
  }

  return jsonResponse({ success: true, name: name });
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['姓名','麵體','醬料','主食材','主餐價格','套餐','加購','免費加量','小物','飲品','冰熱','甜點','蛤蜊增量','備註','小計','時間']);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// 執行一次來初始化 sheet（加標題列）
function initSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  sheet.clear();
  sheet.appendRow(['姓名','麵體','醬料','主食材','主餐價格','套餐','加購','免費加量','小物','飲品','冰熱','甜點','蛤蜊增量','備註','小計','時間']);
}
