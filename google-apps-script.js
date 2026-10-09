/**
 * Personal Income & Expense Tracker - Google Apps Script Backend (v2.2)
 * Connected to Google Sheet ID: 1bltksqx6uNbnWO3_OYLBxcL_3oBKuQPPUOzB3F3PClQ
 *
 * Tab 1: "Data" (Columns: Timestamp, Date, Type, Category, Amount, Note, Item, Seller Details, TxID, Attachments)
 * Tab 2: "Settings" (Column A: Income Categories, Column B: Expences Categories)
 * Tab 3: "Users" (Columns: Name (USERNAME), Password, Role)
 * Tab 4: "Items" (Column A: Master Item Names)
 * Tab 5: "Sellers" (Column A: Master Seller Details)
 */

const SHEET_ID = '1bltksqx6uNbnWO3_OYLBxcL_3oBKuQPPUOzB3F3PClQ';
const DATA_SHEET_NAME = 'Data';
const SETTINGS_SHEET_NAME = 'Settings';
const USERS_SHEET_NAME = 'Users';
const ITEMS_SHEET_NAME = 'Items';
const SELLERS_SHEET_NAME = 'Sellers';
const SCRIPT_VERSION = '2.2';

const DEFAULT_INCOME_CATEGORIES = [
  'Salary & Wages',
  'Freelance / Consulting',
  'Investments & Dividends',
  'Rental Income',
  'Business / Sales',
  'Bonus & Rewards',
  'Gifts & Grants',
  'Other Income'
];

const DEFAULT_EXPENSE_CATEGORIES = [
  'Stock Purchased',
  'Housing & Rent',
  'Groceries & Supermarket',
  'Food & Dining Out',
  'Transportation & Fuel',
  'Utilities (Power/Water/Net)',
  'Healthcare & Medical',
  'Entertainment & Leisure',
  'Shopping & Clothing',
  'Software & Subscriptions',
  'Personal Care',
  'Education & Books',
  'Travel & Vacation',
  'Insurance',
  'Debt & Loan Repayment',
  'Miscellaneous Expense'
];

const DEFAULT_ITEMS = [
  'Soft Toys',
  'Mechanical Toys',
  'Learning Toys',
  'Kids Water Bottle',
  'Kids School Bags'
];

const DEFAULT_SELLERS = [
  'Selvamani articles, Chennai',
  'Baybee Pvt Ltd, Chennai'
];

function getSpreadsheet() {
  if (SHEET_ID && SHEET_ID !== 'YOUR_GOOGLE_SHEET_ID_HERE') {
    try {
      return SpreadsheetApp.openById(SHEET_ID);
    } catch (e) {
      return SpreadsheetApp.getActiveSpreadsheet();
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function findSheetCaseInsensitive(ss, targetName) {
  const direct = ss.getSheetByName(targetName);
  if (direct) return direct;
  const sheets = ss.getSheets();
  const cleanTarget = targetName.trim().toLowerCase();
  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getName().trim().toLowerCase() === cleanTarget) {
      return sheets[i];
    }
  }
  return null;
}

function ensureSheetsExist(ss) {
  let dataSheet = findSheetCaseInsensitive(ss, DATA_SHEET_NAME);
  const dataHeaders = ['Timestamp', 'Date', 'Type', 'Category', 'Amount', 'Note', 'Item', 'Seller Details', 'TxID', 'Attachments'];
  
  if (!dataSheet) {
    dataSheet = ss.insertSheet(DATA_SHEET_NAME);
    dataSheet.appendRow(dataHeaders);
    dataSheet.getRange(1, 1, 1, dataHeaders.length).setFontWeight('bold').setBackground('#f3f4f6');
  } else if (dataSheet.getLastRow() === 0) {
    dataSheet.appendRow(dataHeaders);
    dataSheet.getRange(1, 1, 1, dataHeaders.length).setFontWeight('bold').setBackground('#f3f4f6');
  } else {
    // Check and expand columns if needed
    const lastCol = dataSheet.getLastColumn();
    if (lastCol < 7) {
      dataSheet.getRange(1, 7).setValue('Item').setFontWeight('bold').setBackground('#f3f4f6');
    }
    if (lastCol < 8) {
      dataSheet.getRange(1, 8).setValue('Seller Details').setFontWeight('bold').setBackground('#f3f4f6');
    }
    if (lastCol < 9) {
      dataSheet.getRange(1, 9).setValue('TxID').setFontWeight('bold').setBackground('#f3f4f6');
    }
    if (lastCol < 10) {
      dataSheet.getRange(1, 10).setValue('Attachments').setFontWeight('bold').setBackground('#f3f4f6');
    }
  }

  let settingsSheet = findSheetCaseInsensitive(ss, SETTINGS_SHEET_NAME);
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet(SETTINGS_SHEET_NAME);
    settingsSheet.appendRow(['Income Categories', 'Expences Categories']);
    settingsSheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#f3f4f6');
    
    const maxRows = Math.max(DEFAULT_INCOME_CATEGORIES.length, DEFAULT_EXPENSE_CATEGORIES.length);
    for (let i = 0; i < maxRows; i++) {
      settingsSheet.appendRow([
        DEFAULT_INCOME_CATEGORIES[i] || '',
        DEFAULT_EXPENSE_CATEGORIES[i] || ''
      ]);
    }
  }

  let usersSheet = findSheetCaseInsensitive(ss, USERS_SHEET_NAME);
  if (!usersSheet) {
    usersSheet = ss.insertSheet(USERS_SHEET_NAME);
    usersSheet.appendRow(['Name (USERNAME)', 'Password', 'Role']);
    usersSheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#f3f4f6');
    usersSheet.appendRow(['Jaya Narasimha Rao', 'Naidu@1993', 'Admin']);
    SpreadsheetApp.flush();
  } else if (usersSheet.getLastRow() === 0) {
    usersSheet.appendRow(['Name (USERNAME)', 'Password', 'Role']);
    usersSheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#f3f4f6');
    usersSheet.appendRow(['Jaya Narasimha Rao', 'Naidu@1993', 'Admin']);
    SpreadsheetApp.flush();
  }

  let itemsSheet = findSheetCaseInsensitive(ss, ITEMS_SHEET_NAME);
  if (!itemsSheet) {
    itemsSheet = ss.insertSheet(ITEMS_SHEET_NAME);
    itemsSheet.appendRow(['Item Name']);
    itemsSheet.getRange(1, 1).setFontWeight('bold').setBackground('#f3f4f6');
    for (let i = 0; i < DEFAULT_ITEMS.length; i++) {
      itemsSheet.appendRow([DEFAULT_ITEMS[i]]);
    }
    SpreadsheetApp.flush();
  } else if (itemsSheet.getLastRow() === 0) {
    itemsSheet.appendRow(['Item Name']);
    itemsSheet.getRange(1, 1).setFontWeight('bold').setBackground('#f3f4f6');
    for (let i = 0; i < DEFAULT_ITEMS.length; i++) {
      itemsSheet.appendRow([DEFAULT_ITEMS[i]]);
    }
    SpreadsheetApp.flush();
  }

  let sellersSheet = findSheetCaseInsensitive(ss, SELLERS_SHEET_NAME);
  if (!sellersSheet) {
    sellersSheet = ss.insertSheet(SELLERS_SHEET_NAME);
    sellersSheet.appendRow(['Seller Details']);
    sellersSheet.getRange(1, 1).setFontWeight('bold').setBackground('#f3f4f6');
    for (let s = 0; s < DEFAULT_SELLERS.length; s++) {
      sellersSheet.appendRow([DEFAULT_SELLERS[s]]);
    }
    SpreadsheetApp.flush();
  } else if (sellersSheet.getLastRow() === 0) {
    sellersSheet.appendRow(['Seller Details']);
    sellersSheet.getRange(1, 1).setFontWeight('bold').setBackground('#f3f4f6');
    for (let s = 0; s < DEFAULT_SELLERS.length; s++) {
      sellersSheet.appendRow([DEFAULT_SELLERS[s]]);
    }
    SpreadsheetApp.flush();
  }

  return { dataSheet, settingsSheet, usersSheet, itemsSheet, sellersSheet };
}

/**
 * Handles GET requests:
 */
function doGet(e) {
  try {
    const action = String(e && e.parameter && e.parameter.action ? e.parameter.action : 'getData').trim();

    if ((action === 'add' || action === 'addTransaction') && e.parameter.data) {
      const payload = JSON.parse(decodeURIComponent(e.parameter.data));
      return handleAddTransaction(payload);
    }

    if (action === 'saveUser') {
      let payload = {};
      if (e.parameter.data) {
        try {
          payload = JSON.parse(decodeURIComponent(e.parameter.data));
        } catch (err) {}
      }
      if (!payload.name && e.parameter.name) {
        payload.name = decodeURIComponent(e.parameter.name);
        payload.password = e.parameter.password ? decodeURIComponent(e.parameter.password) : '';
        payload.role = e.parameter.role ? decodeURIComponent(e.parameter.role) : 'User';
      }
      return handleSaveUser(payload);
    }

    if (action === 'deleteUser' && (e.parameter.name || e.parameter.username)) {
      const targetName = e.parameter.name || e.parameter.username;
      return handleDeleteUser(decodeURIComponent(targetName));
    }

    if (action === 'editTransaction' || action === 'updateTransaction') {
      let payload = {};
      if (e.parameter.data) {
        try { payload = JSON.parse(decodeURIComponent(e.parameter.data)); } catch (err) {}
      }
      return handleEditTransaction({ ...e.parameter, ...payload });
    }

    if (action === 'deleteTransaction') {
      return handleDeleteTransaction(e.parameter);
    }

    if (action === 'bulkDeleteTransactions') {
      let payload = {};
      if (e.parameter.data) {
        try { payload = JSON.parse(decodeURIComponent(e.parameter.data)); } catch (err) {}
      }
      return handleBulkDeleteTransactions({ ...e.parameter, ...payload });
    }

    if (action === 'deduplicateSheet' || action === 'cleanDuplicates') {
      return handleDeduplicateSheet();
    }

    if (action === 'saveItem') {
      const name = e.parameter.name ? decodeURIComponent(e.parameter.name) : '';
      return handleSaveItem(name);
    }
    if (action === 'deleteItem') {
      const name = e.parameter.name ? decodeURIComponent(e.parameter.name) : '';
      return handleDeleteItem(name);
    }
    if (action === 'saveSeller') {
      const name = e.parameter.name ? decodeURIComponent(e.parameter.name) : '';
      return handleSaveSeller(name);
    }
    if (action === 'deleteSeller') {
      const name = e.parameter.name ? decodeURIComponent(e.parameter.name) : '';
      return handleDeleteSeller(name);
    }

    return handleGetData();
  } catch (err) {
    return createJsonResponse({
      status: 'error',
      message: err.toString()
    });
  }
}

/**
 * Handles POST requests:
 * CRITICAL FIX: Only calls handleAddTransaction if action is explicitly 'add' or 'addTransaction'.
 * Never creates duplicate rows for delete, edit, or unrecognized requests.
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = String(
      (e && e.parameter && e.parameter.action) ||
      payload.action ||
      ''
    ).trim();

    if (action === 'saveUser') {
      return handleSaveUser(payload);
    }
    if (action === 'deleteUser') {
      return handleDeleteUser(payload.name || payload.username || (e && e.parameter && (e.parameter.name || e.parameter.username)));
    }
    if (action === 'saveItem') {
      return handleSaveItem(payload.name || (e && e.parameter && e.parameter.name));
    }
    if (action === 'deleteItem') {
      return handleDeleteItem(payload.name || (e && e.parameter && e.parameter.name));
    }
    if (action === 'saveSeller') {
      return handleSaveSeller(payload.name || (e && e.parameter && e.parameter.name));
    }
    if (action === 'deleteSeller') {
      return handleDeleteSeller(payload.name || (e && e.parameter && e.parameter.name));
    }
    if (action === 'editTransaction' || action === 'updateTransaction') {
      return handleEditTransaction(payload);
    }
    if (action === 'deleteTransaction') {
      return handleDeleteTransaction(payload);
    }
    if (action === 'bulkDeleteTransactions') {
      return handleBulkDeleteTransactions(payload);
    }
    if (action === 'bulkEditTransactions') {
      return handleBulkEditTransactions(payload);
    }
    if (action === 'deduplicateSheet' || action === 'cleanDuplicates') {
      return handleDeduplicateSheet();
    }
    if (action === 'add' || action === 'addTransaction') {
      return handleAddTransaction(payload);
    }

    // NEVER default to handleAddTransaction - return structured error
    return createJsonResponse({
      status: 'error',
      message: 'Unrecognized action in POST request: ' + (action || 'empty')
    });
  } catch (err) {
    return createJsonResponse({
      status: 'error',
      message: err.toString()
    });
  }
}

function handleGetData() {
  const ss = getSpreadsheet();
  const { dataSheet, settingsSheet, usersSheet, itemsSheet, sellersSheet } = ensureSheetsExist(ss);

  // 1. Fetch Categories from Settings Tab
  const settingsData = settingsSheet.getDataRange().getValues();
  let incomeCategories = [];
  let expenseCategories = [];

  if (settingsData.length > 1) {
    for (let r = 1; r < settingsData.length; r++) {
      const inc = settingsData[r][0];
      const exp = settingsData[r][1];
      if (inc !== undefined && inc !== null && String(inc).trim() !== '') {
        incomeCategories.push(String(inc).trim());
      }
      if (exp !== undefined && exp !== null && String(exp).trim() !== '') {
        expenseCategories.push(String(exp).trim());
      }
    }
  }

  if (incomeCategories.length === 0) incomeCategories = DEFAULT_INCOME_CATEGORIES;
  if (expenseCategories.length === 0) expenseCategories = DEFAULT_EXPENSE_CATEGORIES;

  // 2. Fetch Historical Records from Data Tab
  const dataValues = dataSheet.getDataRange().getValues();
  const transactions = [];

  let itemCol = -1;
  let sellerCol = -1;
  let txIdCol = -1;
  let attCol = -1;

  if (dataValues.length > 0) {
    const headers = dataValues[0];
    for (let c = 0; c < headers.length; c++) {
      const h = String(headers[c] || '').trim().toLowerCase();
      if (h === 'item' || h.includes('item')) itemCol = c;
      else if (h.includes('seller')) sellerCol = c;
      else if (h === 'txid' || h === 'id' || h.includes('tx id') || h === 'tx_id') txIdCol = c;
      else if (h.includes('attach') || h.includes('bill')) attCol = c;
    }
  }

  if (itemCol === -1) itemCol = 6;
  if (sellerCol === -1) sellerCol = 7;
  if (txIdCol === -1) txIdCol = 8;
  if (attCol === -1) attCol = 9;

  if (dataValues.length > 1) {
    for (let i = 1; i < dataValues.length; i++) {
      const row = dataValues[i];
      // Skip blank rows or corrupted empty entries
      if (!row[1] && !row[4]) continue;
      if (!row[1] && Number(row[4]) === 0 && !row[5]) continue;
      
      let formattedDate = row[1];
      if (row[1] instanceof Date) {
        formattedDate = Utilities.formatDate(row[1], Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }

      const rawTimestamp = row[0] instanceof Date ? row[0].toISOString() : String(row[0] || '');
      
      // Determine stable ID
      let stableId = '';
      if (txIdCol >= 0 && row[txIdCol] && String(row[txIdCol]).trim() !== '') {
        stableId = String(row[txIdCol]).trim();
      } else {
        const timePart = row[0] instanceof Date 
          ? row[0].getTime() 
          : String(rawTimestamp).replace(/[^0-9]/g, '').slice(-8) || i;
        stableId = 'tx_' + i + '_' + timePart;
      }

      // Parse attachments if present
      let parsedAttachments = [];
      if (attCol >= 0 && row[attCol]) {
        const rawAtt = String(row[attCol]).trim();
        if (rawAtt.startsWith('[') || rawAtt.startsWith('{')) {
          try {
            const parsed = JSON.parse(rawAtt);
            parsedAttachments = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) {}
        }
      }

      transactions.push({
        id: stableId,
        rowNumber: i + 1,
        timestamp: rawTimestamp,
        date: String(formattedDate || ''),
        type: String(row[2] || 'Expense').trim(),
        category: String(row[3] || 'General').trim(),
        amount: Number(row[4]) || 0,
        note: String(row[5] || ''),
        item: String(row[itemCol] !== undefined ? row[itemCol] : '').trim(),
        sellerDetails: String(row[sellerCol] !== undefined ? row[sellerCol] : '').trim(),
        attachments: parsedAttachments,
        attachment: parsedAttachments[0] || undefined
      });
    }
  }

  // 3. Fetch Users from Users Tab
  const usersData = usersSheet.getDataRange().getValues();
  const usersList = [];

  let nameCol = 0;
  let passCol = 1;
  let roleCol = 2;

  if (usersData.length > 0) {
    const headers = usersData[0];
    for (let c = 0; c < headers.length; c++) {
      const h = String(headers[c] || '').trim().toLowerCase();
      if (h.includes('name') || h.includes('user')) nameCol = c;
      else if (h.includes('pass')) passCol = c;
      else if (h.includes('role')) roleCol = c;
    }
  }

  if (usersData.length > 1) {
    for (let u = 1; u < usersData.length; u++) {
      const uRow = usersData[u];
      const uName = String(uRow[nameCol] !== undefined ? uRow[nameCol] : (uRow[0] || '')).trim();
      const uPass = String(uRow[passCol] !== undefined ? uRow[passCol] : (uRow[1] || '')).trim();
      const uRole = String(uRow[roleCol] !== undefined ? uRow[roleCol] : (uRow[2] || 'User')).trim();
      if (!uName) continue;
      usersList.push({
        name: uName,
        password: uPass,
        role: uRole === 'Admin' || uRole === 'Business User' ? uRole : 'User'
      });
    }
  }

  if (usersList.length === 0) {
    usersList.push({
      name: 'Jaya Narasimha Rao',
      password: 'Naidu@1993',
      role: 'Admin'
    });
  }

  // 4. Fetch Items from Items Tab
  const itemsData = itemsSheet.getDataRange().getValues();
  const itemsList = [];
  if (itemsData.length > 1) {
    for (let i = 1; i < itemsData.length; i++) {
      const val = String(itemsData[i][0] || '').trim();
      if (val && !itemsList.includes(val)) {
        itemsList.push(val);
      }
    }
  }
  if (itemsList.length === 0) {
    for (let i = 0; i < DEFAULT_ITEMS.length; i++) {
      itemsList.push(DEFAULT_ITEMS[i]);
    }
  }

  // 5. Fetch Sellers from Sellers Tab
  const sellersData = sellersSheet.getDataRange().getValues();
  const sellersList = [];
  if (sellersData.length > 1) {
    for (let s = 1; s < sellersData.length; s++) {
      const val = String(sellersData[s][0] || '').trim();
      if (val && !sellersList.includes(val)) {
        sellersList.push(val);
      }
    }
  }
  if (sellersList.length === 0) {
    for (let s = 0; s < DEFAULT_SELLERS.length; s++) {
      sellersList.push(DEFAULT_SELLERS[s]);
    }
  }

  return createJsonResponse({
    status: 'success',
    sheetId: SHEET_ID,
    backendVersion: SCRIPT_VERSION,
    categories: {
      income: incomeCategories,
      expense: expenseCategories
    },
    transactions: transactions,
    users: usersList,
    items: itemsList,
    sellers: sellersList
  });
}

function handleAddTransaction(payload) {
  const ss = getSpreadsheet();
  const { dataSheet } = ensureSheetsExist(ss);

  const timestamp = payload.timestamp || new Date().toISOString();
  const date = payload.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const type = payload.type || 'Expense';
  const category = payload.category || 'General';
  const amount = Number(payload.amount) || 0;
  const note = String(payload.note || '').trim();
  const clientTxId = String(payload.id || payload.clientTxId || ('tx_' + Date.now())).trim();

  const isStockPurchased = String(category).trim().toLowerCase() === 'stock purchased';
  const item = isStockPurchased ? String(payload.item || '').trim() : '';
  const sellerDetails = isStockPurchased ? String(payload.sellerDetails || payload.seller_details || '').trim() : '';

  // Prepare attachments metadata string
  let attachmentsJson = '';
  const attList = payload.attachments && payload.attachments.length > 0
    ? payload.attachments
    : (payload.attachment ? [payload.attachment] : []);
  
  if (attList.length > 0) {
    const cleanAtts = attList.map(function(a) {
      return {
        id: a.id || ('att_' + Date.now()),
        name: a.name || 'Attachment',
        type: a.type || 'application/octet-stream',
        size: a.size || 0,
        dataUrl: a.dataUrl || ''
      };
    });
    attachmentsJson = JSON.stringify(cleanAtts);
  }

  // --- DEDUPLICATION CHECK ---
  // If the same clientTxId or same (date, type, category, amount, note) was already written within recent rows,
  // do not duplicate! Return existing record.
  const existingValues = dataSheet.getDataRange().getValues();
  if (existingValues.length > 1) {
    let txIdCol = -1;
    const headers = existingValues[0];
    for (let c = 0; c < headers.length; c++) {
      const h = String(headers[c] || '').trim().toLowerCase();
      if (h === 'txid' || h === 'id' || h.includes('tx id') || h === 'tx_id') {
        txIdCol = c;
        break;
      }
    }

    // Check last 35 rows for exact match
    const startRow = Math.max(1, existingValues.length - 35);
    for (let r = existingValues.length - 1; r >= startRow; r--) {
      const row = existingValues[r];
      const rowId = txIdCol >= 0 ? String(row[txIdCol] || '').trim() : '';
      
      let rowDate = row[1];
      if (row[1] instanceof Date) {
        rowDate = Utilities.formatDate(row[1], Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }
      rowDate = String(rowDate || '').trim();
      
      const rowType = String(row[2] || '').trim();
      const rowCategory = String(row[3] || '').trim();
      const rowAmount = Number(row[4]) || 0;
      const rowNote = String(row[5] || '').trim();

      const idMatch = clientTxId && rowId && rowId === clientTxId;
      const fieldMatch = rowDate === String(date).trim() &&
                         rowType.toLowerCase() === type.toLowerCase() &&
                         rowCategory.toLowerCase() === category.toLowerCase() &&
                         Math.abs(rowAmount - amount) < 0.01 &&
                         rowNote === note;

      if (idMatch || fieldMatch) {
        return createJsonResponse({
          status: 'success',
          message: 'Transaction already recorded (deduplicated)',
          record: {
            id: rowId || clientTxId,
            rowNumber: r + 1,
            timestamp: row[0] instanceof Date ? row[0].toISOString() : String(row[0] || ''),
            date: rowDate,
            type: rowType,
            category: rowCategory,
            amount: rowAmount,
            note: rowNote,
            item: item,
            sellerDetails: sellerDetails,
            attachments: attList,
            attachment: attList[0] || undefined
          }
        });
      }
    }
  }

  // Ensure headers exist for columns 7, 8, 9, 10
  const lastCol = dataSheet.getLastColumn();
  if (lastCol < 7) dataSheet.getRange(1, 7).setValue('Item').setFontWeight('bold').setBackground('#f3f4f6');
  if (lastCol < 8) dataSheet.getRange(1, 8).setValue('Seller Details').setFontWeight('bold').setBackground('#f3f4f6');
  if (lastCol < 9) dataSheet.getRange(1, 9).setValue('TxID').setFontWeight('bold').setBackground('#f3f4f6');
  if (lastCol < 10) dataSheet.getRange(1, 10).setValue('Attachments').setFontWeight('bold').setBackground('#f3f4f6');

  // Append new row
  dataSheet.appendRow([timestamp, date, type, category, amount, note, item, sellerDetails, clientTxId, attachmentsJson]);
  SpreadsheetApp.flush();

  const newRowNumber = dataSheet.getLastRow();

  return createJsonResponse({
    status: 'success',
    message: 'Transaction saved to Google Sheet successfully',
    record: {
      id: clientTxId,
      rowNumber: newRowNumber,
      timestamp: timestamp,
      date: date,
      type: type,
      category: category,
      amount: amount,
      note: note,
      item: item,
      sellerDetails: sellerDetails,
      attachments: attList,
      attachment: attList[0] || undefined
    }
  });
}

function handleSaveUser(payload) {
  const ss = getSpreadsheet();
  const { usersSheet } = ensureSheetsExist(ss);

  const name = String(payload.name || payload.username || '').trim();
  const password = String(payload.password || '').trim();
  const role = String(payload.role || 'User').trim();

  if (!name) {
    return createJsonResponse({ status: 'error', message: 'Name (Username) is required' });
  }

  const values = usersSheet.getDataRange().getValues();
  let nameCol = 0;
  let passCol = 1;
  let roleCol = 2;

  if (values.length > 0) {
    const headers = values[0];
    for (let c = 0; c < headers.length; c++) {
      const h = String(headers[c] || '').trim().toLowerCase();
      if (h.includes('name') || h.includes('user')) nameCol = c;
      else if (h.includes('pass')) passCol = c;
      else if (h.includes('role')) roleCol = c;
    }
  }

  let foundRow = -1;

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][nameCol]).trim().toLowerCase() === name.toLowerCase()) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow > 0) {
    if (password) usersSheet.getRange(foundRow, passCol + 1).setValue(password);
    usersSheet.getRange(foundRow, roleCol + 1).setValue(role);
  } else {
    const maxCol = Math.max(nameCol, passCol, roleCol);
    const newRow = [];
    for (let c = 0; c <= maxCol; c++) {
      if (c === nameCol) newRow.push(name);
      else if (c === passCol) newRow.push(password);
      else if (c === roleCol) newRow.push(role);
      else newRow.push('');
    }
    usersSheet.appendRow(newRow);
  }

  SpreadsheetApp.flush();

  return createJsonResponse({
    status: 'success',
    message: 'User saved to Users sheet successfully',
    user: { name: name, role: role }
  });
}

function handleDeleteUser(nameToDelete) {
  const ss = getSpreadsheet();
  const { usersSheet } = ensureSheetsExist(ss);
  const target = String(nameToDelete || '').trim().toLowerCase();

  const values = usersSheet.getDataRange().getValues();
  let nameCol = 0;
  if (values.length > 0) {
    const headers = values[0];
    for (let c = 0; c < headers.length; c++) {
      const h = String(headers[c] || '').trim().toLowerCase();
      if (h.includes('name') || h.includes('user')) {
        nameCol = c;
        break;
      }
    }
  }

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][nameCol]).trim().toLowerCase() === target) {
      usersSheet.deleteRow(i + 1);
      SpreadsheetApp.flush();
      return createJsonResponse({
        status: 'success',
        message: 'User removed from Users sheet'
      });
    }
  }

  return createJsonResponse({
    status: 'error',
    message: 'User not found in Users sheet'
  });
}

function handleSaveItem(name) {
  const ss = getSpreadsheet();
  const { itemsSheet } = ensureSheetsExist(ss);
  let cleanName = String(name || '').trim();
  if (cleanName.includes('%')) {
    try { cleanName = decodeURIComponent(cleanName); } catch (e) {}
  }
  if (!cleanName) {
    return createJsonResponse({ status: 'error', message: 'Item name cannot be empty' });
  }

  const values = itemsSheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0] || '').trim().toLowerCase() === cleanName.toLowerCase()) {
      return createJsonResponse({
        status: 'success',
        message: 'Item already exists in Items sheet',
        name: cleanName
      });
    }
  }

  itemsSheet.appendRow([cleanName]);
  SpreadsheetApp.flush();
  return createJsonResponse({
    status: 'success',
    message: 'Item saved to Items sheet successfully',
    name: cleanName
  });
}

function handleDeleteItem(name) {
  const ss = getSpreadsheet();
  const { itemsSheet } = ensureSheetsExist(ss);
  let target = String(name || '').trim().toLowerCase();
  if (target.includes('%')) {
    try { target = decodeURIComponent(target).toLowerCase(); } catch (e) {}
  }
  if (!target) {
    return createJsonResponse({ status: 'error', message: 'Item name cannot be empty' });
  }

  const values = itemsSheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0] || '').trim().toLowerCase() === target) {
      itemsSheet.deleteRow(i + 1);
      SpreadsheetApp.flush();
      return createJsonResponse({
        status: 'success',
        message: 'Item removed from Items sheet'
      });
    }
  }

  return createJsonResponse({
    status: 'error',
    message: 'Item not found in Items sheet'
  });
}

function handleSaveSeller(name) {
  const ss = getSpreadsheet();
  const { sellersSheet } = ensureSheetsExist(ss);
  let cleanName = String(name || '').trim();
  if (cleanName.includes('%')) {
    try { cleanName = decodeURIComponent(cleanName); } catch (e) {}
  }
  if (!cleanName) {
    return createJsonResponse({ status: 'error', message: 'Seller name cannot be empty' });
  }

  const values = sellersSheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0] || '').trim().toLowerCase() === cleanName.toLowerCase()) {
      return createJsonResponse({
        status: 'success',
        message: 'Seller already exists in Sellers sheet',
        name: cleanName
      });
    }
  }

  sellersSheet.appendRow([cleanName]);
  SpreadsheetApp.flush();
  return createJsonResponse({
    status: 'success',
    message: 'Seller saved to Sellers sheet successfully',
    name: cleanName
  });
}

function handleDeleteSeller(name) {
  const ss = getSpreadsheet();
  const { sellersSheet } = ensureSheetsExist(ss);
  let target = String(name || '').trim().toLowerCase();
  if (target.includes('%')) {
    try { target = decodeURIComponent(target).toLowerCase(); } catch (e) {}
  }
  if (!target) {
    return createJsonResponse({ status: 'error', message: 'Seller name cannot be empty' });
  }

  const values = sellersSheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0] || '').trim().toLowerCase() === target) {
      sellersSheet.deleteRow(i + 1);
      SpreadsheetApp.flush();
      return createJsonResponse({
        status: 'success',
        message: 'Seller removed from Sellers sheet'
      });
    }
  }

  return createJsonResponse({
    status: 'error',
    message: 'Seller not found in Sellers sheet'
  });
}

function findTransactionRow(dataSheet, payload) {
  const values = dataSheet.getDataRange().getValues();
  if (values.length <= 1) return -1;

  const reqId = String(payload.id || payload.clientTxId || '').trim();
  const reqRowNumber = Number(payload.rowNumber);
  const reqDate = String(payload.date || payload.targetDate || '').trim();
  const reqAmount = Number(payload.amount !== undefined ? payload.amount : payload.targetAmount);
  const reqCategory = String(payload.category || payload.targetCategory || '').trim().toLowerCase();
  const reqNote = String(payload.note || payload.targetNote || '').trim();
  const reqTimestamp = String(payload.timestamp || '').trim();

  let txIdCol = -1;
  const headers = values[0];
  for (let c = 0; c < headers.length; c++) {
    const h = String(headers[c] || '').trim().toLowerCase();
    if (h === 'txid' || h === 'id' || h.includes('tx id') || h === 'tx_id') {
      txIdCol = c;
      break;
    }
  }

  // 1. Direct ID match
  if (reqId && txIdCol >= 0) {
    for (let r = 1; r < values.length; r++) {
      if (String(values[r][txIdCol] || '').trim() === reqId) {
        return r + 1;
      }
    }
  }

  // 2. Verified row number match (check that date or amount matches)
  if (reqRowNumber && reqRowNumber >= 2 && reqRowNumber <= values.length) {
    const candidate = values[reqRowNumber - 1];
    let candDate = candidate[1];
    if (candidate[1] instanceof Date) {
      candDate = Utilities.formatDate(candidate[1], Session.getScriptTimeZone(), 'yyyy-MM-dd');
    }
    const candAmount = Number(candidate[4]) || 0;
    if ((reqDate && String(candDate || '').trim() === reqDate) || 
        (!isNaN(reqAmount) && Math.abs(candAmount - reqAmount) < 0.01)) {
      return reqRowNumber;
    }
  }

  // 3. Timestamp match
  if (reqTimestamp) {
    const cleanReqTime = reqTimestamp.replace(/[^0-9]/g, '').slice(0, 14);
    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      const rowTs = row[0] instanceof Date ? row[0].toISOString() : String(row[0] || '');
      const cleanRowTime = rowTs.replace(/[^0-9]/g, '').slice(0, 14);
      if (cleanReqTime && cleanRowTime && (cleanReqTime === cleanRowTime || rowTs.includes(reqTimestamp.substring(0, 16)))) {
        return r + 1;
      }
    }
  }

  // 4. Robust Fallback: Date + Amount + Category + Note
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    let rowDate = row[1];
    if (row[1] instanceof Date) {
      rowDate = Utilities.formatDate(row[1], Session.getScriptTimeZone(), 'yyyy-MM-dd');
    }
    rowDate = String(rowDate || '').trim();
    const rowAmount = Number(row[4]) || 0;
    const rowCategory = String(row[3] || '').trim().toLowerCase();
    const rowNote = String(row[5] || '').trim();

    if (reqDate && rowDate === reqDate && !isNaN(reqAmount) && Math.abs(rowAmount - reqAmount) < 0.01) {
      if (!reqCategory || rowCategory === reqCategory) {
        if (!reqNote || rowNote === reqNote) {
          return r + 1;
        }
      }
    }
  }

  // 5. Final fallback: Date + Amount alone
  if (reqDate && !isNaN(reqAmount)) {
    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      let rowDate = row[1];
      if (row[1] instanceof Date) {
        rowDate = Utilities.formatDate(row[1], Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }
      rowDate = String(rowDate || '').trim();
      const rowAmount = Number(row[4]) || 0;
      if (rowDate === reqDate && Math.abs(rowAmount - reqAmount) < 0.01) {
        return r + 1;
      }
    }
  }

  return -1;
}

function handleEditTransaction(payload) {
  const ss = getSpreadsheet();
  const { dataSheet } = ensureSheetsExist(ss);

  const targetRow = findTransactionRow(dataSheet, payload);

  if (targetRow > 1) {
    if (payload.date) {
      dataSheet.getRange(targetRow, 2).setValue(payload.date);
    }
    if (payload.type) {
      dataSheet.getRange(targetRow, 3).setValue(payload.type);
    }
    if (payload.category) {
      dataSheet.getRange(targetRow, 4).setValue(payload.category);
    }
    if (payload.amount !== undefined) {
      dataSheet.getRange(targetRow, 5).setValue(Number(payload.amount));
    }
    if (payload.note !== undefined) {
      dataSheet.getRange(targetRow, 6).setValue(payload.note);
    }
    if (payload.item !== undefined) {
      dataSheet.getRange(targetRow, 7).setValue(payload.item);
    }
    if (payload.sellerDetails !== undefined || payload.seller_details !== undefined) {
      dataSheet.getRange(targetRow, 8).setValue(payload.sellerDetails || payload.seller_details || '');
    }

    SpreadsheetApp.flush();
    return createJsonResponse({
      status: 'success',
      message: 'Transaction updated successfully in Google Sheet',
      record: payload
    });
  }

  return createJsonResponse({
    status: 'error',
    message: 'Transaction record not found to update in Google Sheet'
  });
}

function handleDeleteTransaction(payload) {
  const ss = getSpreadsheet();
  const { dataSheet } = ensureSheetsExist(ss);

  const targetRow = findTransactionRow(dataSheet, payload);

  if (targetRow > 1) {
    dataSheet.deleteRow(targetRow);
    SpreadsheetApp.flush();
    return createJsonResponse({
      status: 'success',
      message: 'Transaction deleted successfully from Google Sheet',
      deletedRow: targetRow
    });
  }

  return createJsonResponse({
    status: 'error',
    message: 'Transaction record not found to delete in Google Sheet'
  });
}

function handleBulkDeleteTransactions(payload) {
  const ss = getSpreadsheet();
  const { dataSheet } = ensureSheetsExist(ss);
  const records = payload.records || [];
  if (!records.length) {
    return createJsonResponse({ status: 'success', message: 'No records to delete', count: 0 });
  }

  const rowsToDelete = [];
  records.forEach(function(rec) {
    const rowNum = findTransactionRow(dataSheet, rec);
    if (rowNum > 1 && !rowsToDelete.includes(rowNum)) {
      rowsToDelete.push(rowNum);
    }
  });

  // Sort rows descending to delete from bottom up without shifting indices
  rowsToDelete.sort(function(a, b) { return b - a; });
  let deletedCount = 0;
  rowsToDelete.forEach(function(rowNum) {
    if (rowNum >= 2 && rowNum <= dataSheet.getLastRow()) {
      dataSheet.deleteRow(rowNum);
      deletedCount++;
    }
  });

  SpreadsheetApp.flush();
  return createJsonResponse({
    status: 'success',
    message: 'Deleted ' + deletedCount + ' transactions from Google Sheet',
    count: deletedCount
  });
}

function handleBulkEditTransactions(payload) {
  const records = payload.records || [];
  let updatedCount = 0;
  records.forEach(function(rec) {
    try {
      const res = handleEditTransaction(rec);
      if (res && JSON.parse(res.getContent()).status === 'success') {
        updatedCount++;
      }
    } catch (e) {}
  });
  SpreadsheetApp.flush();
  return createJsonResponse({
    status: 'success',
    message: 'Updated ' + updatedCount + ' transactions in Google Sheet',
    count: updatedCount
  });
}

/**
 * Automatically cleans duplicate rows and corrupt empty rows in the Data sheet.
 */
function handleDeduplicateSheet() {
  const ss = getSpreadsheet();
  const { dataSheet } = ensureSheetsExist(ss);
  const values = dataSheet.getDataRange().getValues();
  if (values.length <= 1) {
    return createJsonResponse({ status: 'success', message: 'No records to deduplicate', count: 0 });
  }

  const seenSignatures = {};
  const rowsToDelete = [];

  for (let i = values.length - 1; i >= 1; i--) {
    const row = values[i];
    
    // Corrupt or empty row check
    const isCorruptOrEmpty = (!row[1] && !row[4]) || (!row[1] && Number(row[4]) === 0 && !row[5]);
    if (isCorruptOrEmpty) {
      rowsToDelete.push(i + 1);
      continue;
    }

    let dateStr = row[1];
    if (row[1] instanceof Date) {
      dateStr = Utilities.formatDate(row[1], Session.getScriptTimeZone(), 'yyyy-MM-dd');
    }
    dateStr = String(dateStr || '').trim();

    const typeStr = String(row[2] || '').trim().toLowerCase();
    const catStr = String(row[3] || '').trim().toLowerCase();
    const amtStr = Number(row[4]) || 0;
    const noteStr = String(row[5] || '').trim();
    const itemStr = String(row[6] || '').trim();
    const sellerStr = String(row[7] || '').trim();

    const sig = dateStr + '_' + typeStr + '_' + catStr + '_' + amtStr + '_' + noteStr + '_' + itemStr + '_' + sellerStr;

    if (seenSignatures[sig]) {
      rowsToDelete.push(i + 1);
    } else {
      seenSignatures[sig] = true;
    }
  }

  let deletedCount = 0;
  for (let k = 0; k < rowsToDelete.length; k++) {
    const rowNum = rowsToDelete[k];
    if (rowNum >= 2 && rowNum <= dataSheet.getLastRow()) {
      dataSheet.deleteRow(rowNum);
      deletedCount++;
    }
  }

  SpreadsheetApp.flush();
  return createJsonResponse({
    status: 'success',
    message: 'Removed ' + deletedCount + ' duplicate/corrupt row(s) from Google Sheet',
    count: deletedCount
  });
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
