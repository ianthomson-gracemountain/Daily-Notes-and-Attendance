/**
 * Google Apps Script for Grace Mountain Daily Notes & Attendance
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheet
 * 2. Name the first sheet "Daily Notes"
 * 3. Go to Extensions > Apps Script
 * 4. Paste this entire script and save
 * 5. Run the setupSheet function once (it creates headers automatically)
 * 6. Click Deploy > New deployment
 * 7. Type: Web app
 * 8. Execute as: Me
 * 9. Who has access: Anyone
 * 10. Click Deploy and copy the URL
 * 11. Paste that URL into the Grace Mountain app Settings page
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Daily Notes");
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      sheet.setName("Daily Notes");
    }

    var data = JSON.parse(e.postData.contents);

    // Handle single note or array of notes
    var notes = Array.isArray(data) ? data : [data];

    notes.forEach(function(note) {
      // Check if this note already exists (update vs insert)
      var existingRow = findRow(sheet, note.clientId, note.date);

      var rowData = [
        note.id,
        note.providerName,
        note.providerId,
        note.clientName,
        note.clientId,
        note.date,
        note.servicesProvided ? "Yes" : "No",
        note.notes,
        note.createdAt,
        note.updatedAt,
        note.aiEnhanced ? "Yes" : "No",
        note.originalNotes || ""
      ];

      if (existingRow > 0) {
        // Update existing row
        sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
      } else {
        // Append new row
        sheet.appendRow(rowData);
      }
    });

    return ContentService.createTextOutput(
      JSON.stringify({ success: true, count: notes.length })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Daily Notes");
    if (!sheet) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: true, data: [] })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: true, data: [] })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var headers = data[0];
    var rows = data.slice(1).map(function(row) {
      var obj = {};
      headers.forEach(function(header, i) {
        var key = headerToKey(header);
        obj[key] = row[i];
      });
      return obj;
    });

    return ContentService.createTextOutput(
      JSON.stringify({ success: true, data: rows })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function findRow(sheet, clientId, date) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][4] === clientId && data[i][5] === date) {
      return i + 1; // 1-indexed
    }
  }
  return -1;
}

function headerToKey(header) {
  return header.charAt(0).toLowerCase() + header.slice(1).replace(/\s+/g, '');
}

/**
 * Run this once to set up the sheet headers automatically
 */
function setupSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.setName("Daily Notes");

  var headers = [
    "ID", "Provider Name", "Provider ID", "Client Name", "Client ID",
    "Date", "Services Provided", "Notes", "Created At", "Updated At",
    "AI Enhanced", "Original Notes"
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground("#365347")
    .setFontColor("#F1F1F1");

  // Auto-resize columns
  headers.forEach(function(_, i) {
    sheet.autoResizeColumn(i + 1);
  });

  // Set Date column format
  sheet.getRange("F:F").setNumberFormat("yyyy-mm-dd");

  // Freeze header row
  sheet.setFrozenRows(1);
}
