# Quick Start — know3 Enhancement Installation

**Time to integrate:** 5-10 minutes
**Complexity:** Easy
**Risk:** None (fully backward compatible)

---

## 30-Second Summary

1. **Copy new files** into know3 directory
2. **Edit index.html** (4 small changes)
3. **Restart browser** → hybrid search works
4. **Optional:** Run Python backend for Docling

---

## Step 1: Copy Files (1 minute)

Copy these files to your know3 directory:

- `know3_enhancements.js` — Browser enhancement module (680 lines)
- `know3_enhanced_backend.py` — Optional Python backend (360 lines)
- `ENHANCEMENT_GUIDE.md` — Full documentation
- `CODE_CHANGES_SUMMARY.md` — Line-by-line changes
- This file

**Directory structure:**

```
know3/
├── index.html ← you'll edit this
├── know3_enhancements.js ← copy here (new)
├── know3_enhanced_backend.py ← copy here (new, optional)
├── README.md
├── LICENSE
└── QUICKSTART.md ← this file
```

---

## Step 2: Edit index.html (3 minutes)

### Change 1: Add script import (around line 15)

**Find this:**

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
```

**Add after it:**

```html
<script src="know3_enhancements.js"></script>
```

### Change 2: Replace parsePDF function (around line 3023)

**Delete lines 3023-3036** (the old `parsePDF` function)

**Paste this instead:**

```javascript
// LINE 3023: Enhanced PDF parsing with Docling fallback
async function parsePDF(file) {
  if (!window.enhancedSearch) {
    // Fallback: use original PDF.js parser
    if (!pdfjsLib) throw new Error('PDF.js not loaded');
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      text += pageText + '\n\n';
    }
    log(`PDF: ${pdf.numPages} pages extracted`, 'ok');
    return text;
  }

  try {
    const parsed = await window.enhancedSearch.enhancedPDFParser.parsePDFEnhanced(file);
    if (parsed.success) {
      log(`PDF: ${parsed.pageCount} pages extracted via ${parsed.method}`, 'ok');
      return parsed.text;
    } else {
      log(`⚠ Enhanced parser failed (${parsed.error}), using PDF.js`, 'warn');
      return await parsePDF_Fallback(file);
    }
  } catch (e) {
    log(`⚠ Enhanced parser error: ${e.message}, falling back to PDF.js`, 'warn');
    return await parsePDF_Fallback(file);
  }
}

// LINE 3060: Fallback PDF.js parser
async function parsePDF_Fallback(file) {
  if (!pdfjsLib) throw new Error('PDF.js not loaded');
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    text += pageText + '\n\n';
  }
  return text;
}
```

### Change 3: Replace sendRAGMessage function (around line 3570)

**Delete lines 3570-3662** (the old `sendRAGMessage` function)

**Paste this instead:**

```javascript
// LINE 3570: Enhanced RAG with hybrid BM25 + Vector search
async function sendRAGMessage() {
  if (window.neuralBG) window.neuralBG.state = 'rag';
  console.log('📤 Sending RAG message with hybrid search...');

  const msgInput = document.getElementById('rag-msg-input');
  const message = msgInput.value.trim();
  if (!message) return;

  addMessageToHistory('user', message);
  msgInput.value = '';

  const topK = parseInt(document.getElementById('rag-topk').value) || 5;
  const collection = document.getElementById('rag-collection').value;
  const includeSources = document.getElementById('rag-include-sources').value === 'yes';
  const embedModel = embedSelect.value;

  try {
    let results = [];

    if (window.enhancedSearch && window.HybridSearchEngine) {
      let queryEmbedding = [];
      if (embedModel !== '__none__') {
        queryEmbedding = await ollamaEmbed(message, embedModel);
      }

      const hybridResults = await window.HybridSearchEngine.hybridSearch(
        message,
        queryEmbedding,
        topK,
        collection
      );

      results = hybridResults.map(r => ({
        score: r.combinedScore,
        text: r.text,
        collection: r.collection,
        meta: r.metadata,
        bm25Score: r.bm25Score,
        vectorScore: r.vectorScore
      }));

      console.log(`✓ Hybrid search: ${results.length} results (BM25+Vector)`);
    } else {
      let queryEmbedding = [];
      if (embedModel !== '__none__') {
        queryEmbedding = await ollamaEmbed(message, embedModel);
      }

      if (queryEmbedding.length > 0) {
        results = vectorStore.search(queryEmbedding, topK, collection);
      } else {
        results = keywordSearch(message, topK, collection);
      }
    }

    const ragSettings = JSON.parse(localStorage.getItem('ragSettings') || '{}');
    const ragMode = ragSettings.ragMode || 'ask';

    let assistantMessage = '';
    let sources = [];

    if (results.length === 0) {
      assistantMessage = '❌ No relevant documents found. Try ingesting documents first.';
    } else if (ragMode === 'search') {
      assistantMessage = `📚 Found ${results.length} relevant chunks:\n\n`;
      assistantMessage += results.map((r, i) => {
        let scoreInfo = `Score: ${(r.score * 100).toFixed(0)}%`;
        if (r.bm25Score !== undefined) {
          scoreInfo = `BM25: ${(r.bm25Score * 100).toFixed(0)}% + Vector: ${(r.vectorScore * 100).toFixed(0)}%`;
        }
        return `${i+1}. (${scoreInfo}) ${r.text.substring(0, 200)}${r.text.length > 200 ? '...' : ''}`;
      }).join('\n\n');
      sources = results.map((r, i) => ({
        index: i + 1,
        file: r.meta?.file || 'unknown',
        score: (r.score * 100).toFixed(0),
        bm25: r.bm25Score ? (r.bm25Score * 100).toFixed(0) : null,
        vector: r.vectorScore ? (r.vectorScore * 100).toFixed(0) : null
      }));
    } else {
      const context = results.map((r, i) =>
        `[Source ${i+1} - ${r.meta?.file || 'doc'}, relevance: ${(r.score*100).toFixed(0)}%]\n${r.text}`
      ).join('\n\n');

      const recentContext = ragConversationHistory.slice(-6).map(m =>
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
      ).join('\n');

      const answerPrompt = `You are a helpful assistant. Answer the question using ONLY the provided context. If the context doesn't contain enough information, say so honestly. Always cite which source(s) you used.

Recent conversation context:
${recentContext}

Current context:
${context}

User question: ${message}

Answer:`;

      const temperature = parseFloat(ragSettings.temperature) || 0.7;
      assistantMessage = await ollamaGenerate(answerPrompt, modelSelect.value, temperature);
      sources = results.map((r, i) => ({
        index: i + 1,
        file: r.meta?.file || 'unknown',
        score: (r.score * 100).toFixed(0),
        bm25: r.bm25Score ? (r.bm25Score * 100).toFixed(0) : null,
        vector: r.vectorScore ? (r.vectorScore * 100).toFixed(0) : null
      }));
    }

    addMessageToHistory('assistant', assistantMessage, includeSources ? sources : null);

  } catch(e) {
    console.error('❌ RAG error:', e);
    addMessageToHistory('assistant', `⚠️ Error: ${e.message}`);
  }
}
```

---

## Step 3: Test (1 minute)

1. **Refresh browser** (Ctrl+R / Cmd+R)
2. **Open developer console** (F12)
3. **Look for:** `✓ Enhanced search module loaded`
4. **Upload a PDF** → log should show method used (e.g., "extracted via pdfjs")
5. **Send RAG query** → log should show "Hybrid search: X results (BM25+Vector)"

**Success! BM25 hybrid search is now active.**

---

## Step 4 (Optional): Enable Backend with Docling (2 minutes)

### 4a. Install Python dependencies

```bash
pip install "docling>=2.75.0" "rank_bm25>=0.2.0" "flask>=3.0.0"

# Optional: Install Tesseract for OCR on scanned PDFs
# Ubuntu/Debian: apt install tesseract-ocr
# macOS: brew install tesseract
# Windows: https://github.com/UB-Mannheim/tesseract/wiki
```

### 4b. Start backend server

```bash
python3 know3_enhanced_backend.py
# Output: Server running on http://localhost:5000
```

### 4c. Enable in browser (browser console)

```javascript
await enhancedSearch.enableBackend('http://localhost:5000')
// Output: ✓ Backend connected (docling=true)
```

**Now PDFs will parse via Docling** (better layout handling)

---

## Verification Checklist

After installation, verify:

- [ ] Script loads: `✓ Enhanced search module loaded` in console
- [ ] PDF ingestion: Shows "extracted via pdfjs" or "docling" in logs
- [ ] BM25 works: RAG search shows component scores (BM25: 85% + Vector: 90%)
- [ ] No errors: Check browser console for warnings/errors
- [ ] Backward compatible: know3 still works if `know3_enhancements.js` missing

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "enhancedSearch not defined" | Check `<script src="know3_enhancements.js"></script>` is in HTML |
| BM25 returns no results | Query too short? Try "hello world" instead of "a" |
| Backend won't connect | Is Python server running on :5000? Check: `curl http://localhost:5000/health` |
| Docling errors | Missing tesseract? Install: `apt install tesseract-ocr` |

---

## What Changed?

### Before
- PDF parsing: PDF.js only (simple text extraction)
- Search: Cosine similarity on embeddings (semantic only)

### After
- PDF parsing: Docling (if backend) → PDF.js fallback
- Search: BM25 (keywords) + Vector (semantic) + Reranking
- Result: Better text extraction + more balanced search

---

## Next Steps

1. **Read full docs:** See `ENHANCEMENT_GUIDE.md` for detailed API
2. **Tune search weights:** Edit `HybridSearchEngine.bm25Weight` and `.vectorWeight` in browser console
3. **Monitor stats:** Call `enhancedSearch.getStats()` in console to see indexing stats

---

## Questions?

- **Full documentation:** `ENHANCEMENT_GUIDE.md`
- **Code changes details:** `CODE_CHANGES_SUMMARY.md`
- **Python backend API:** `know3_enhanced_backend.py` (docstrings in code)
- **JavaScript API:** `know3_enhancements.js` (comments at each section)

---

**Setup completed!** You now have BM25 hybrid search + optional Docling support. 🚀
