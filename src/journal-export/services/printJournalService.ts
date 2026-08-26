import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { DevotionalSummary } from '../../devotional-core/types';

export interface JournalPrintOptions {
  title?: string;
  subtitle?: string;
  verseRef?: string;
  coverMaterial?: string;
  authorName?: string;
  entries: DevotionalSummary[];
  includeCover?: boolean;
  includeTableOfContents?: boolean;
  paperLined?: boolean;
}

const COVER_STYLES: Record<string, { bg: string; text: string; accent: string; border: string }> = {
  vintage_leather: {
    bg: '#2C1D11',
    text: '#F2D399',
    accent: '#D4AF37',
    border: '#5C3E28',
  },
  forest_linen: {
    bg: '#172E1C',
    text: '#E2F0D9',
    accent: '#85C285',
    border: '#2E5936',
  },
  dark_slate: {
    bg: '#181A1E',
    text: '#E5E9F0',
    accent: '#88C0D0',
    border: '#3B4252',
  },
  warm_parchment: {
    bg: '#F5EBE1',
    text: '#2C221E',
    accent: '#B85042',
    border: '#D5C4B4',
  },
  default: {
    bg: '#2C1D11',
    text: '#F2D399',
    accent: '#D4AF37',
    border: '#5C3E28',
  },
};

/**
 * Escapes HTML characters to prevent XSS / formatting breaks
 */
function escapeHtml(str?: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Builds the complete publication-grade HTML document for hardbound printing
 */
export function generateJournalPrintHtml(options: JournalPrintOptions): string {
  const {
    title = 'SELAH DEVOTIONAL JOURNAL',
    subtitle = 'Daily Reflections in God’s Presence',
    verseRef = 'Psalm 46:10',
    coverMaterial = 'vintage_leather',
    authorName = 'Beloved of God',
    entries = [],
    includeCover = true,
    includeTableOfContents = true,
    paperLined = true,
  } = options;

  const coverStyle = COVER_STYLES[coverMaterial] || COVER_STYLES.default;
  const chronologicalEntries = [...entries].reverse();
  const printDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Cinzel:wght@500;700;800&family=Inter:wght@400;500;600;700&display=swap');

    @page {
      size: A5 portrait;
      margin: 14mm 14mm 16mm 14mm;
      @bottom-right {
        content: counter(page);
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Lora', Georgia, serif;
      color: #24211E;
      background-color: #FFFFFF;
      font-size: 10.5pt;
      line-height: 1.55;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page-break {
      page-break-after: always;
      break-after: page;
    }

    /* ══════════ 1. HARDBOUND COVER SPREAD ══════════ */
    .cover-page {
      min-height: 98vh;
      background: ${coverStyle.bg};
      color: ${coverStyle.text};
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
      padding: 40px 30px;
      border: 3px solid ${coverStyle.border};
      box-shadow: inset 0 0 40px rgba(0,0,0,0.5);
      position: relative;
    }

    .cover-frame-inner {
      border: 1.5px solid ${coverStyle.accent};
      padding: 30px 20px;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      flex: 1;
    }

    .cover-emblem {
      font-size: 32pt;
      color: ${coverStyle.accent};
      margin-bottom: 20px;
    }

    .cover-title {
      font-family: 'Cinzel', serif;
      font-size: 20pt;
      font-weight: 700;
      letter-spacing: 2px;
      color: ${coverStyle.accent};
      text-transform: uppercase;
      margin-bottom: 12px;
      line-height: 1.3;
    }

    .cover-subtitle {
      font-size: 11pt;
      font-style: italic;
      color: ${coverStyle.text};
      opacity: 0.9;
      max-width: 80%;
      margin-bottom: 24px;
    }

    .cover-verse {
      font-family: 'Cinzel', serif;
      font-size: 10pt;
      letter-spacing: 1.5px;
      color: ${coverStyle.accent};
      border-top: 1px solid ${coverStyle.accent}40;
      border-bottom: 1px solid ${coverStyle.accent}40;
      padding: 8px 16px;
      margin-top: 20px;
    }

    .cover-footer {
      font-family: 'Inter', sans-serif;
      font-size: 8.5pt;
      letter-spacing: 1px;
      opacity: 0.7;
      text-transform: uppercase;
    }

    /* ══════════ 2. DEDICATION & TITLE PAGE ══════════ */
    .title-page {
      min-height: 95vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 50px 30px;
    }

    .dedication-title {
      font-family: 'Cinzel', serif;
      font-size: 16pt;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: #377333;
      margin-bottom: 8px;
    }

    .dedication-sub {
      font-size: 11pt;
      font-style: italic;
      color: #666;
      margin-bottom: 35px;
    }

    .dedication-divider {
      width: 60px;
      height: 1.5px;
      background-color: #377333;
      margin: 20px auto;
    }

    .dedication-verse-box {
      background-color: #FAF6EE;
      border-left: 3px solid #377333;
      padding: 16px 20px;
      margin: 30px 0;
      max-width: 85%;
      text-align: left;
    }

    .dedication-verse-text {
      font-style: italic;
      font-size: 10.5pt;
      line-height: 1.6;
      color: #2C2621;
    }

    .dedication-verse-ref {
      font-family: 'Inter', sans-serif;
      font-size: 8.5pt;
      font-weight: 700;
      color: #377333;
      margin-top: 8px;
      text-align: right;
    }

    .title-page-author {
      margin-top: 40px;
      font-family: 'Inter', sans-serif;
      font-size: 9pt;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* ══════════ 3. TABLE OF CONTENTS ══════════ */
    .toc-page {
      padding: 20px 10px;
    }

    .toc-header {
      font-family: 'Cinzel', serif;
      font-size: 14pt;
      font-weight: 700;
      letter-spacing: 1px;
      color: #24211E;
      border-bottom: 1.5px solid #377333;
      padding-bottom: 8px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .toc-list {
      list-style: none;
    }

    .toc-item {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 7px 0;
      border-bottom: 1px dotted #D5CEC4;
      font-size: 9.5pt;
    }

    .toc-left {
      display: flex;
      align-items: baseline;
      gap: 8px;
      flex: 1;
      padding-right: 12px;
    }

    .toc-page-num {
      font-family: 'Inter', sans-serif;
      font-size: 8pt;
      font-weight: 700;
      color: #377333;
      min-width: 50px;
    }

    .toc-ref {
      font-weight: 600;
      color: #24211E;
    }

    .toc-date {
      font-family: 'Inter', sans-serif;
      font-size: 8pt;
      color: #777;
    }

    .toc-dots {
      flex: 1;
      border-bottom: 1px dotted #BBB;
      margin: 0 6px;
    }

    /* ══════════ 4. DEVOTIONAL ENTRY PAGES ══════════ */
    .devotion-page {
      padding: 10px 0;
      min-height: 92vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .page-folio-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #E2DBD0;
      padding-bottom: 6px;
      margin-bottom: 14px;
      font-family: 'Inter', sans-serif;
    }

    .folio-page-badge {
      font-size: 8pt;
      font-weight: 700;
      color: #377333;
      letter-spacing: 0.5px;
    }

    .folio-date {
      font-size: 8pt;
      color: #7A7268;
    }

    /* Rhema Box */
    .rhema-box {
      background-color: #FAF4EB;
      border: 1px solid #E5DACB;
      border-left: 3.5px solid #B85042;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 14px;
    }

    .rhema-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .step-badge {
      font-family: 'Inter', sans-serif;
      font-size: 7.5pt;
      font-weight: 800;
      letter-spacing: 0.5px;
      padding: 2px 6px;
      border-radius: 12px;
      display: inline-block;
    }

    .badge-rhema { background: #FDE8E5; color: #B85042; }
    .badge-reflection { background: #E6F4EA; color: #2D6A4F; }
    .badge-motivation { background: #FEF3D6; color: #C27000; }
    .badge-application { background: #E8F0FE; color: #1A73E8; }

    .rhema-ref {
      font-family: 'Inter', sans-serif;
      font-size: 8.5pt;
      font-weight: 700;
      color: #B85042;
    }

    .scripture-quote {
      font-style: italic;
      font-size: 10pt;
      line-height: 1.5;
      color: #24211E;
    }

    /* Ruled Sections */
    .ruled-section {
      margin-bottom: 14px;
      position: relative;
    }

    .section-title-row {
      margin-bottom: 4px;
    }

    .ruled-lines-content {
      font-size: 10pt;
      line-height: 24px;
      color: #1F1B18;
      ${paperLined ? `
        background-image: repeating-linear-gradient(
          transparent,
          transparent 23px,
          #E4DCD0 23px,
          #E4DCD0 24px
        );
        padding-top: 1px;
      ` : ''}
    }

    .empty-note {
      font-style: italic;
      color: #999;
      font-size: 9pt;
    }

    /* Page Footer */
    .page-folio-footer {
      border-top: 0.8px solid #EAE4D9;
      padding-top: 6px;
      margin-top: 14px;
      display: flex;
      justify-content: space-between;
      font-family: 'Inter', sans-serif;
      font-size: 7.5pt;
      color: #999;
    }

    /* ══════════ 5. CLOSING & BLESSING PAGE ══════════ */
    .closing-page {
      min-height: 90vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 40px 20px;
    }

    .closing-emblem {
      font-size: 28pt;
      color: #377333;
      margin-bottom: 16px;
    }

    .closing-title {
      font-family: 'Cinzel', serif;
      font-size: 14pt;
      font-weight: 700;
      color: #24211E;
      margin-bottom: 10px;
    }

    .closing-prayer {
      font-style: italic;
      font-size: 10.5pt;
      color: #555;
      line-height: 1.65;
      max-width: 80%;
      margin: 20px 0;
    }

    .stats-summary-pill {
      background: #F4EFE6;
      border: 1px solid #DDD4C6;
      border-radius: 20px;
      padding: 8px 18px;
      font-family: 'Inter', sans-serif;
      font-size: 8.5pt;
      font-weight: 700;
      color: #377333;
      margin-top: 20px;
    }
  </style>
</head>
<body>

  <!-- 1. COVER PAGE -->
  ${includeCover ? `
    <div class="cover-page page-break">
      <div class="cover-frame-inner">
        <div class="cover-emblem">✦</div>
        <div>
          <h1 class="cover-title">${escapeHtml(title)}</h1>
          <p class="cover-subtitle">${escapeHtml(subtitle)}</p>
          <div class="cover-verse">${escapeHtml(verseRef)}</div>
        </div>
        <div class="cover-footer">
          SELAH • PHYSICAL HARDBOARD EDITION • ${chronologicalEntries.length} DEVOTIONALS
        </div>
      </div>
    </div>
  ` : ''}

  <!-- 2. DEDICATION & TITLE PAGE -->
  <div class="title-page page-break">
    <div class="dedication-title">SELAH DEVOTIONS</div>
    <div class="dedication-sub">A Personal Walk with God Through the Holy Scriptures</div>
    <div class="dedication-divider"></div>

    <div class="dedication-verse-box">
      <div class="dedication-verse-text">
        “Your word is a lamp to my feet and a light to my path.”
      </div>
      <div class="dedication-verse-ref">PSALM 119:105</div>
    </div>

    <div class="title-page-author">
      JOURNAL OF ${escapeHtml(authorName.toUpperCase())}<br>
      PRINTED ON ${printDate}
    </div>
  </div>

  <!-- 3. TABLE OF CONTENTS -->
  ${includeTableOfContents && chronologicalEntries.length > 0 ? `
    <div class="toc-page page-break">
      <div class="toc-header">
        <span>TABLE OF DEVOTIONS</span>
        <span style="font-size: 9pt; font-family: 'Inter'; font-weight: 600;">PAGE</span>
      </div>
      <ul class="toc-list">
        ${chronologicalEntries.map((e, idx) => {
          const pageNum = idx + 1;
          const entryDate = new Date(e.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          return `
            <li class="toc-item">
              <div class="toc-left">
                <span class="toc-page-num">PAGE ${pageNum}</span>
                <span class="toc-ref">${escapeHtml(e.rhemaReference)}</span>
                <span class="toc-date">• ${entryDate}</span>
              </div>
              <div class="toc-dots"></div>
              <span style="font-family: 'Inter'; font-weight: 700; font-size: 8.5pt;">${pageNum}</span>
            </li>
          `;
        }).join('')}
      </ul>
    </div>
  ` : ''}

  <!-- 4. DEVOTIONAL ENTRY PAGES -->
  ${chronologicalEntries.map((e, idx) => {
    const pageNum = idx + 1;
    const dateFormatted = new Date(e.createdAt).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    return `
      <div class="devotion-page page-break">
        <div>
          <!-- Header Folio -->
          <div class="page-folio-header">
            <span class="folio-page-badge">PAGE ${pageNum} OF ${chronologicalEntries.length}</span>
            <span class="folio-date">${dateFormatted}</span>
          </div>

          <!-- 1. Rhema Scripture Box -->
          <div class="rhema-box">
            <div class="rhema-header-row">
              <span class="step-badge badge-rhema">✦ RHEMA</span>
              <span class="rhema-ref">${escapeHtml(e.rhemaReference)}</span>
            </div>
            <div class="scripture-quote">“${escapeHtml(e.rhemaText)}”</div>
          </div>

          <!-- 2. Reflection -->
          <div class="ruled-section">
            <div class="section-title-row">
              <span class="step-badge badge-reflection">✦ REFLECTION</span>
            </div>
            <div class="ruled-lines-content">
              ${escapeHtml(e.reflection || e.reflectionPreview) || '<span class="empty-note">No reflection recorded</span>'}
            </div>
          </div>

          <!-- 3. Motivation -->
          <div class="ruled-section">
            <div class="section-title-row">
              <span class="step-badge badge-motivation">✦ MOTIVATION</span>
            </div>
            <div class="ruled-lines-content">
              ${escapeHtml(e.motivation) || '<span class="empty-note">No motivation recorded</span>'}
            </div>
          </div>

          <!-- 4. Application -->
          <div class="ruled-section">
            <div class="section-title-row">
              <span class="step-badge badge-application">✦ APPLICATION</span>
            </div>
            <div class="ruled-lines-content">
              ${escapeHtml(e.application) || '<span class="empty-note">No application recorded</span>'}
            </div>
          </div>
        </div>

        <!-- Footer Folio -->
        <div class="page-folio-footer">
          <span>SELAH DAILY DEVOTIONS</span>
          <span>PAGE ${pageNum}</span>
        </div>
      </div>
    `;
  }).join('')}

  <!-- 5. CLOSING BLESSING PAGE -->
  <div class="closing-page">
    <div class="closing-emblem">✝</div>
    <div class="closing-title">THE LORD BLESS YOU AND KEEP YOU</div>
    <div class="closing-prayer">
      “The Lord make His face shine upon you and be gracious to you;
      The Lord lift up His countenance upon you and give you peace.”<br>
      — Numbers 6:24-26
    </div>

    <div class="stats-summary-pill">
      ✦ COMPLETED ${chronologicalEntries.length} DEVOTIONALS • SELAH JOURNAL
    </div>
  </div>

</body>
</html>
  `;
}

/**
 * Generates and shares/saves a printable PDF of the devotional journal
 */
export async function exportJournalToPdf(options: JournalPrintOptions): Promise<string> {
  const html = generateJournalPrintHtml(options);
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: `${options.title || 'Selah Journal'} - Hardbound Edition`,
    });
  }

  return uri;
}

/**
 * Directly prints the journal using system AirPrint / Android Print Dialog
 */
export async function directPrintJournal(options: JournalPrintOptions): Promise<void> {
  const html = generateJournalPrintHtml(options);
  await Print.printAsync({
    html,
  });
}
