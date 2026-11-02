/**
 * La Roca Cleaning Services LLC — Google Apps Script receiver.
 * In Google Sheets: Extensions > Apps Script, paste this code.
 * Configure SPREADSHEET_ID and NOTIFICATION_EMAIL.
 * Deploy as web app (execute as you, access anyone).
 * Use Cloudflare Pages Function as a proxy with secret verification.
 */
const SPREADSHEET_ID = 'PASTE_GOOGLE_SHEET_ID_HERE';
const NOTIFICATION_EMAIL = 'saraname339@gmail.com';
const TAB_NAME = 'LEADS';
const TOKEN_PROPERTY = 'LA_ROCA_FORM_SECRET';
function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const secret = PropertiesService.getScriptProperties().getProperty(TOKEN_PROPERTY);
    if (!secret || data.token !== secret) return reply_({ok:false,error:'unauthorized'});
    const name = sanitize_(data.name, 120);
    const phone = sanitize_(data.phone, 50);
    const email = sanitize_(data.email, 180);
    const service = sanitize_(data.service, 180);
    const area = sanitize_(data.area, 90);
    const message = sanitize_(data.message, 1800);
    const source = sanitize_(data.page, 400);
    if (!name || !phone || !service || !area) return reply_({ok:false,error:'missing_fields'});
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      let sheet = ss.getSheetByName(TAB_NAME) || ss.insertSheet(TAB_NAME);
      if(sheet.getLastRow() === 0) sheet.appendRow(['Fecha','Nombre','Telefono','Email','Servicio','Ciudad','Detalles','Pagina']);
      sheet.appendRow([new Date(),name,phone,email,service,area,message,source].map(safeCell_));
    } finally { lock.releaseLock(); }
    MailApp.sendEmail({
      to: NOTIFICATION_EMAIL,
      subject: 'Nueva solicitud de limpieza - ' + area,
      body: 'Nombre: '+name+'\nTelefono: '+phone+'\nEmail: '+email+'\nServicio: '+service+'\nCiudad: '+area+'\nDetalles: '+message+'\nPagina: '+source
    });
    return reply_({ok:true});
  } catch (error) {
    console.error(error);
    return reply_({ok:false,error:'processing_error'});
  }
}
function sanitize_(x, max) { return String(x == null ? '' : x).trim().slice(0,max); }
function safeCell_(s) {
  if(s instanceof Date) return s;
  s = String(s);
  return /^[=+@\-\t\r]/.test(s) ? "'"+s : s;
}
function reply_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
