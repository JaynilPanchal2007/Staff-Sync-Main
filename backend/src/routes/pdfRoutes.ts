import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dbService } from '../services/db.js';
import { emitToOrg } from '../sockets.js';
import { resolveAdmin, resolveOrgId } from '../utils/orgContext.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const pdfRouter = Router();

// ──────────────────────────────────────────────
// Public uploads directory  (backend/public/uploads)
// ──────────────────────────────────────────────
const UPLOADS_DIR = path.resolve(__dirname, '../../public/uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// In-memory PDF library (persisted in JSON sidecar file)
const LIBRARY_FILE = path.join(UPLOADS_DIR, '_library.json');

function readLibrary(): any[] {
  try {
    if (fs.existsSync(LIBRARY_FILE)) {
      return JSON.parse(fs.readFileSync(LIBRARY_FILE, 'utf-8'));
    }
  } catch { /* ignore */ }
  return [];
}

function writeLibrary(lib: any[]) {
  fs.writeFileSync(LIBRARY_FILE, JSON.stringify(lib, null, 2), 'utf-8');
}

// ──────────────────────────────────────────────
// Multer – disk storage
// ──────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${ts}_${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are accepted.'));
    }
  },
});

// ──────────────────────────────────────────────
// Parsing helpers
// ──────────────────────────────────────────────
function parseStaffRows(text: string): any[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 2);

  const rows: any[] = [];
  let idCounter = 1;

  for (const line of lines) {
    // Skip obvious header lines or timetable lines
    if (
      /^(sr\.?|no\.?|s\.?n|employee|faculty|staff|name|dept|department|qualification|roll|email|day|lect)\b/i.test(
        line
      ) &&
      line.split(/[,\t|]/).length > 2
    ) continue;

    // Try splitting by common delimiters: |, tab, comma, or 2+ spaces
    const parts = line
      .split(/[,\t|]|\s{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length < 2) continue;

    const name = parts[0];
    // Must look like a real name (at least 2 words or one word > 3 chars, no digits)
    if (!/^[A-Za-z][A-Za-z\s.'-]{2,}$/.test(name)) continue;

    const possibleId =
      parts.find((p) => /^[A-Z0-9_-]{2,12}$/i.test(p) && !/^[A-Za-z\s]+$/.test(p)) ||
      `EMP-${100 + idCounter++}`;

    const dept =
      parts.find((p) =>
        /computer|science|math|physics|english|mechanical|electrical|operations|assembly|quality|commerce|chemistry|biology|history|geography|civil|it\b|software|hr|management/i.test(
          p
        )
      ) ||
      parts[2] ||
      'General';

    const role =
      parts.find((p) =>
        /professor|assistant|teacher|faculty|lead|engineer|technician|operator|lecturer|principal|hod|head/i.test(
          p
        )
      ) || 'Staff Member';

    rows.push({
      name,
      employeeId: possibleId,
      department: dept,
      role,
      subjects: parts.length > 3 ? [parts[3]] : [dept],
      experience: '3',
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@staffsync.org`,
    });
  }

  return rows;
}

function parseTimetableRows(text: string): any[] {
  const rows: any[] = [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let currentDayIdx = 0;
  let currentDay = DAYS_ORDER[0];

  // Regex for grid cell subject pattern: e.g. "CNS (6TH IT)", "MPI(6TH CE)", "OOPJ (4TH CE2)", "DBMS (BCA-A)", "PPS (DIV B)"
  const gridSubjectRegex = /([A-Z0-9\s-]+)\s*\(([^)]+)\)/gi;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip generic institution headers
    if (/^(DEPARTMENT|MASTER TIMETABLE|SEMESTER|ACADEMIC YEAR|TOTAL LOAD)/i.test(line)) {
      continue;
    }

    // Check for explicit day mentions in text
    const dayMatch = line.match(/\b(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)\b/i);
    if (dayMatch) {
      const foundDay = dayMatch[1].charAt(0).toUpperCase() + dayMatch[1].slice(1).toLowerCase();
      if (DAYS_ORDER.includes(foundDay)) {
        currentDay = foundDay;
        currentDayIdx = DAYS_ORDER.indexOf(foundDay);
      }
    }

    // Check for Master Timetable grid row pattern: "Lect-1 09:00 to 10:00 ..."
    const lectMatch = line.match(/Lect\s*[-_]?\s*(\d+)\s+(\d{1,2}:\d{2})\s*(?:to|-)\s*(\d{1,2}:\d{2})/i);
    if (lectMatch) {
      const lectNo = parseInt(lectMatch[1], 10);
      const startTime = lectMatch[2];
      const endTime = lectMatch[3];

      // Automatically advance weekday index when Lect-1 starts a new cycle (if explicit day header wasn't matched)
      if (lectNo === 1 && rows.length > 0 && !dayMatch) {
        currentDayIdx = (currentDayIdx + 1) % DAYS_ORDER.length;
        currentDay = DAYS_ORDER[currentDayIdx];
      }

      // Collect line text + subsequent wrapped lines until next Lect/Header block
      let slotText = line.substring(lectMatch[0].length);
      let j = i + 1;
      while (
        j < lines.length &&
        !lines[j].match(/Lect\s*[-_]?\s*\d+/i) &&
        !lines[j].match(/^(DEPARTMENT|MASTER|DAY|Total|Lect-)/i)
      ) {
        slotText += ' ' + lines[j];
        j++;
      }

      let match;
      let matchedInLect = false;
      gridSubjectRegex.lastIndex = 0;
      while ((match = gridSubjectRegex.exec(slotText)) !== null) {
        const subjName = match[1].trim();
        const classInfo = match[2].trim();

        if (subjName.length > 1 && !/^(Lect|Time|Day|Total|BREAK)/i.test(subjName)) {
          matchedInLect = true;
          rows.push({
            day: currentDay,
            startTime,
            endTime,
            subject: subjName,
            room: classInfo.includes('LAB') ? 'Lab' : 'Lecture Hall',
            classGrade: classInfo,
            section: classInfo.includes('IT')
              ? 'IT'
              : classInfo.includes('CE')
              ? 'CE'
              : classInfo.includes('CSE')
              ? 'CSE'
              : classInfo.includes('BCA')
              ? 'BCA'
              : 'A',
          });
        }
      }

      // Fallback for simple single-entry slot lines
      if (!matchedInLect && slotText.trim().length > 3) {
        const parts = slotText.split(/[,\t|]|\s{2,}/).map((p) => p.trim()).filter(Boolean);
        if (parts.length > 0) {
          rows.push({
            day: currentDay,
            startTime,
            endTime,
            subject: parts[0],
            room: parts[1] || 'Room 101',
            classGrade: parts[2] || 'Grade 10',
            section: 'A',
          });
        }
      }

      continue;
    }

    // Standard linear tabular parsing (e.g. Day, Time, Subject, Room)
    if (/^(day|time|period|subject|room|faculty|slot)\b/i.test(line)) continue;
    const parts = line.split(/[,\t|]|\s{2,}/).map((p) => p.trim()).filter(Boolean);
    if (parts.length < 2) continue;

    const timeMatch = line.match(/(\d{1,2}:\d{2})\s*(?:-|to)\s*(\d{1,2}:\d{2})/i);
    if (timeMatch) {
      const day =
        DAYS_ORDER.find((d) => line.toLowerCase().includes(d.toLowerCase())) || currentDay;
      const subject =
        parts.find(
          (p) =>
            !DAYS_ORDER.some((d) => p.toLowerCase().includes(d.toLowerCase())) &&
            !/^\d{1,2}:\d{2}$/.test(p) &&
            !/^(room|hall|lab|lh|cr)\b/i.test(p) &&
            p.length > 2
        ) || parts[1] || 'Lecture';
      const room = parts.find((p) => /room|hall|lab|lh|cr|\b[A-Z]?\d{3}\b/i.test(p)) || 'Room 101';

      rows.push({
        day,
        startTime: timeMatch[1],
        endTime: timeMatch[2],
        subject,
        room,
        classGrade: 'Grade 10',
        section: 'A',
      });
    }
  }

  return rows;
}

// ──────────────────────────────────────────────
// GET /api/pdf/uploads  –  list saved PDFs
// ──────────────────────────────────────────────
pdfRouter.get('/pdf/uploads', (_req, res) => {
  try {
    const lib = readLibrary();
    res.json({ success: true, uploads: lib });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ──────────────────────────────────────────────
// POST /api/pdf/import  –  upload + parse
// ──────────────────────────────────────────────
pdfRouter.post('/pdf/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a valid PDF file.' });
    }

    const type: 'staff' | 'timetable' = (req.body.type as any) || 'staff';
    const filePath = req.file.path;
    const fileName = req.file.filename;
    const originalName = req.file.originalname;
    const publicUrl = `/uploads/${fileName}`;

    // ── parse ──
    let pdfData: any;
    try {
      const buffer = fs.readFileSync(filePath);

      // pdf-parse v2 API: construct with { data } then call getText()
      // getText() internally calls the private load() — we must NOT call it ourselves
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      pdfData = { text: textResult.text ?? '' };

      console.log('[PDF] Parse succeeded, text length:', pdfData.text.length);
    } catch (parseErr) {
      console.error('[PDF ERROR] name   :', (parseErr as any)?.name);
      console.error('[PDF ERROR] message:', (parseErr as any)?.message);
      console.error('[PDF ERROR] stack  :\n', (parseErr as any)?.stack);

      fs.unlinkSync(filePath);
      return res.status(400).json({
        error: `Failed to parse PDF: ${(parseErr as Error).message}. Ensure the file is not corrupted or password-protected.`,
      });
    }

    const text: string = pdfData.text || '';
    if (!text.trim()) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        error:
          'No readable text could be extracted. The PDF may be an image-only scan. Please use a text-based PDF.',
      });
    }

    const lines = text
      .split('\n')
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 2);

    let effectiveType: 'staff' | 'timetable' = (req.body.type as any) || 'staff';
    let extractedRows =
      effectiveType === 'staff' ? parseStaffRows(text) : parseTimetableRows(text);

    // Auto-detect fallback if 0 rows parsed or strong content markers present
    if (extractedRows.length === 0) {
      if (effectiveType === 'staff') {
        const fallbackTt = parseTimetableRows(text);
        if (fallbackTt.length > 0) {
          effectiveType = 'timetable';
          extractedRows = fallbackTt;
        }
      } else {
        const fallbackStaff = parseStaffRows(text);
        if (fallbackStaff.length > 0) {
          effectiveType = 'staff';
          extractedRows = fallbackStaff;
        }
      }
    }

    // ── save to library ──
    const lib = readLibrary();
    const entry = {
      id: `pdf_${Date.now()}`,
      fileName,
      originalName,
      publicUrl,
      type: effectiveType,
      uploadedAt: new Date().toISOString(),
      rowCount: extractedRows.length,
      imported: false,
    };
    lib.unshift(entry);
    writeLibrary(lib);

    res.json({
      success: true,
      type: effectiveType,
      fileId: entry.id,
      publicUrl,
      originalName,
      totalLines: lines.length,
      extractedCount: extractedRows.length,
      preview: extractedRows.slice(0, 100),
      rawSample: lines.slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ──────────────────────────────────────────────
// POST /api/pdf/confirm  –  commit to DB
// ──────────────────────────────────────────────
pdfRouter.post('/pdf/confirm', async (req, res) => {
  try {
    const admin = resolveAdmin(req);
    const orgId = resolveOrgId(req);
    const { type, records, fileId } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'No records provided to import.' });
    }

    const inserted: any[] = [];
    const errors: string[] = [];

    if (type === 'staff') {
      const existingStaff = dbService.getStaff(orgId);

      for (const r of records) {
        if (!r.name) continue;
        const empId = r.employeeId || `EMP-${Date.now().toString().slice(-4)}`;
        if (existingStaff.some((s) => s.employeeId?.toLowerCase() === empId.toLowerCase())) {
          errors.push(`Skipped duplicate ID: ${empId}`);
          continue;
        }

        const newStaff = dbService.addStaff({
          organizationId: orgId,
          name: r.name,
          employeeId: empId,
          email: r.email || `${empId.toLowerCase()}@staffsync.org`,
          department: r.department || 'General',
          role: r.role || 'Staff Member',
          subjects: Array.isArray(r.subjects) ? r.subjects : [r.department || 'General'],
          skills: Array.isArray(r.skills) ? r.skills : [r.role || 'General'],
          qualification: r.qualification || 'Degree',
          experience: r.experience || '3',
          status: 'active',
        });
        inserted.push(newStaff);
      }
    } else {
      for (const t of records) {
        if (!t.subject || !t.day) continue;
        const entry = dbService.addTimetableEntry({
          organizationId: orgId,
          day: t.day,
          startTime: t.startTime || '09:00',
          endTime: t.endTime || '10:00',
          subject: t.subject,
          room: t.room || 'Room 101',
          classGrade: t.classGrade || 'Grade 10',
          section: t.section || 'A',
          facultyId: t.facultyId || '',
          facultyName: t.facultyName || 'Unassigned',
        });
        inserted.push(entry);
      }
    }

    // Mark library entry as imported
    if (fileId) {
      const lib = readLibrary();
      const idx = lib.findIndex((e) => e.id === fileId);
      if (idx !== -1) {
        lib[idx].imported = true;
        lib[idx].insertedCount = inserted.length;
        writeLibrary(lib);
      }
    }

    dbService.addAuditLog({
      actor: admin.name,
      action: 'IMPORT_PDF',
      entity: type === 'staff' ? 'Staff' : 'Timetable',
      entityId: `import_${Date.now()}`,
      metadata: { insertedCount: inserted.length, skippedCount: errors.length },
    });

    emitToOrg(orgId, 'dashboard:refresh', { type: 'pdf_import' });

    res.json({
      success: true,
      insertedCount: inserted.length,
      errors,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ──────────────────────────────────────────────
// DELETE /api/pdf/uploads/:id  –  remove a PDF
// ──────────────────────────────────────────────
pdfRouter.delete('/pdf/uploads/:id', (req, res) => {
  try {
    const lib = readLibrary();
    const idx = lib.findIndex((e) => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Upload not found.' });

    const entry = lib[idx];
    const filePath = path.join(UPLOADS_DIR, entry.fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    lib.splice(idx, 1);
    writeLibrary(lib);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
