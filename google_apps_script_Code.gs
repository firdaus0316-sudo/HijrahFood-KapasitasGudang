/**
 * HIJRAH FOOD WMS — Google Apps Script API (2-Way Sync)
 * Tempelkan kode ini ke: Extensions -> Apps Script di Google Spreadsheet Anda,
 * lalu Deploy -> New deployment -> Web app -> Execute as: Me -> Who has access: Anyone.
 */

const SHEET_CHAMBER = "DB_Chamber";
const SHEET_REEFER  = "DB_Reefer";
const SHEET_MASTER  = "Master_Gudang";

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const tz = ss.getSpreadsheetTimeZone();

    const chamberLogs = readChamberLogs_(ss.getSheetByName(SHEET_CHAMBER), tz);
    const reeferLogs  = readReeferLogs_(ss.getSheetByName(SHEET_REEFER), tz);
    const master      = readMaster_(ss.getSheetByName(SHEET_MASTER));

    return jsonOutput_({
      ok: true,
      spreadsheetTitle: ss.getName(),
      updatedAt: new Date().toISOString(),
      chamberLogs: chamberLogs,
      reeferLogs: reeferLogs,
      master: master
    });
  } catch (err) {
    return jsonOutput_({ ok: false, error: err.message });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const payload = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const tz = ss.getSpreadsheetTimeZone();

    if (payload.action === "upsert") {
      const type = payload.type; // "CHAMBER" or "REEFER"
      const dateStr = String(payload.date || "").trim(); // yyyy-MM-dd
      const code = String(payload.code || "").trim();
      if (!dateStr || !code) throw new Error("Tanggal dan Kode Gudang wajib diisi.");

      const dateObj = Utilities.parseDate(dateStr, tz, "yyyy-MM-dd");

      if (type === "CHAMBER") {
        const sh = ss.getSheetByName(SHEET_CHAMBER);
        const rowValues = [
          dateObj,
          code,
          numOrBlank_(payload.u1, true),
          numOrBlank_(payload.u2, false),
          numOrBlank_(payload.u3, false),
          numOrBlank_(payload.u4, false),
          numOrBlank_(payload.fl, true),
          payload.temp !== null && payload.temp !== "" && payload.temp !== undefined ? Number(payload.temp) : "",
          payload.note || ""
        ];
        const res = upsertRow_(sh, tz, dateStr, code, 2, 9, rowValues); // Cols B..J (startCol 2, 9 cols)
        SpreadsheetApp.flush();
        return jsonOutput_({ ok: true, mode: res.mode, row: res.row });
      } else if (type === "REEFER") {
        const sh = ss.getSheetByName(SHEET_REEFER);
        const rowValues = [
          dateObj,
          code,
          numOrBlank_(payload.u1, true),
          numOrBlank_(payload.u2, false),
          numOrBlank_(payload.u3, false),
          numOrBlank_(payload.u4, false),
          payload.temp !== null && payload.temp !== "" && payload.temp !== undefined ? Number(payload.temp) : "",
          payload.note || ""
        ];
        const res = upsertRow_(sh, tz, dateStr, code, 2, 8, rowValues); // Cols B..I (startCol 2, 8 cols)
        SpreadsheetApp.flush();
        return jsonOutput_({ ok: true, mode: res.mode, row: res.row });
      }
    }
    throw new Error("Action tidak dikenal.");
  } catch (err) {
    return jsonOutput_({ ok: false, error: err.message });
  } finally {
    lock.releaseLock();
  }
}

function upsertRow_(sh, tz, dateStr, code, startCol, numCols, rowValues) {
  const lastRow = sh.getLastRow();
  let lastDataRow = 1;
  if (lastRow >= 2) {
    const existing = sh.getRange(2, 2, lastRow - 1, 2).getValues(); // B=date, C=code
    for (let i = 0; i < existing.length; i++) {
      const d = formatDate_(existing[i][0], tz);
      const c = String(existing[i][1] || "").trim();
      if (d && c) {
        lastDataRow = i + 2;
      }
      if (d === dateStr && c === code) {
        const targetRow = i + 2;
        sh.getRange(targetRow, startCol, 1, numCols).setValues([rowValues]);
        return { mode: "updated", row: targetRow };
      }
    }
  }
  const newRow = Math.max(2, lastDataRow + 1);
  sh.getRange(newRow, startCol, 1, numCols).setValues([rowValues]);
  return { mode: "inserted", row: newRow };
}

function readChamberLogs_(sh, tz) {
  if (!sh || sh.getLastRow() < 2) return [];
  const vals = sh.getRange(2, 2, sh.getLastRow() - 1, 9).getValues(); // B..J
  const map = {};
  const keys = [];
  for (let i = 0; i < vals.length; i++) {
    const r = vals[i];
    const dateStr = formatDate_(r[0], tz);
    const code = String(r[1] || "").trim();
    if (!dateStr || !code) continue;
    const k = dateStr + "|" + code;
    if (!map[k]) keys.push(k);
    map[k] = {
      date: dateStr,
      code: code,
      u1: Number(r[2] || 0),
      u2: Number(r[3] || 0),
      u3: Number(r[4] || 0),
      u4: Number(r[5] || 0),
      fl: Number(r[6] || 0),
      temp: r[7] !== "" && r[7] !== null ? Number(r[7]) : null,
      note: String(r[8] || "")
    };
  }
  return keys.map(k => map[k]);
}

function readReeferLogs_(sh, tz) {
  if (!sh || sh.getLastRow() < 2) return [];
  const vals = sh.getRange(2, 2, sh.getLastRow() - 1, 8).getValues(); // B..I
  const map = {};
  const keys = [];
  for (let i = 0; i < vals.length; i++) {
    const r = vals[i];
    const dateStr = formatDate_(r[0], tz);
    const code = String(r[1] || "").trim();
    if (!dateStr || !code) continue;
    const k = dateStr + "|" + code;
    if (!map[k]) keys.push(k);
    map[k] = {
      date: dateStr,
      code: code,
      u1: Number(r[2] || 0),
      u2: Number(r[3] || 0),
      u3: Number(r[4] || 0),
      u4: Number(r[5] || 0),
      temp: r[6] !== "" && r[6] !== null ? Number(r[6]) : null,
      note: String(r[7] || "")
    };
  }
  return keys.map(k => map[k]);
}

function readMaster_(sh) {
  if (!sh || sh.getLastRow() < 2) return [];
  const vals = sh.getRange(2, 1, sh.getLastRow() - 1, 11).getValues();
  return vals.filter(r => r[0]).map(r => ({
    code: String(r[0]),
    dashName: String(r[1]),
    kategori: String(r[2]),
    satuan: String(r[3]),
    capacity: Number(r[4] || 0),
    addFloor: Number(r[5] || 0),
    palletCap: Number(r[6] || 0)
  }));
}

function formatDate_(val, tz) {
  if (!val) return "";
  if (Object.prototype.toString.call(val) === "[object Date]" && !isNaN(val)) {
    return Utilities.formatDate(val, tz, "yyyy-MM-dd");
  }
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return "";
}

function numOrBlank_(v, keepZero) {
  const n = Number(v || 0);
  if (!keepZero && n === 0) return "";
  return n;
}

function jsonOutput_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
