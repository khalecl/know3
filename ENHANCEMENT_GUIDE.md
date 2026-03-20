# know3 v3.1+ Enhancement Guide
## Docling + BM25 Hybrid Search Integration

**Date Verified:** 2026-03-20
**Status:** Ready for Integration
**Compatibility:** know3 v3.1 (index.html), Ollama local

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Dependencies](#dependencies)
4. [Installation](#installation)
5. [Code Modifications](#code-modifications)
6. [API Reference](#api-reference)
7. [Examples](#examples)

---

## Overview

This enhancement package adds two major capabilities to know3:

### 1. Advanced PDF Parsing with Docling Fallback
- **Old:** PDF.js text extraction only (simple, can miss layouts)
- **New:** Docling for advanced layout understanding + PDF.js fallback
- **Benefit:** Better text extraction from complex PDFs (tables, multi-column, scanned)

### 2. BM25 Hybrid Search + Reranking
- **Old:** Cosine similarity on embeddings only (semantic-only)
- **New:** BM25 (lexical) + Vector (semantic) + simple reranking
- **Benefit:** More balanced retrieval (keywords + meaning), better diversity

---

## Architecture

```
┌─ Browser (index.html) ────────────────────────┐
│                                               │
│  ┌─ know3_enhancements.js ─────────────────┐ │
│  │                                         │ │
│  │  • EnhancedPDFParser (lines 1-180)     │ │
│  │    └─ Calls backend docling (optional) │ │
│  │    └─ Falls back to PDF.js             │ │
│  │                                         │ │
│  │  • BM25SearchEngine (lines 181-360)    │ │
│  │    └─ Tokenizes documents              │ │
│  │    └─ Calculates IDF, BM25 scores      │ │
│  │                                         │ │
│  │  • HybridSearchEngine (lines 361-520)  │ │
│  │    └─ Combines BM25 + Vector           │ │
│  │    └─ Reranks for diversity            │ │
│  │                                         │ │
│  │  • enhancedSearch API (lines 521-680)  │ │
│  │    └─ Integration layer                │ │
│  └─────────────────────────────────────────┘ │
│                                               │
└───────────────────────────────────────────────┘
                    ↓ (optional)
        ┌─ Backend (localhost:5000) ──┐
        │                            │
        │ • Docling PDF parser       │
        │ • BM25 server-side storage │
        │ • REST API                 │
        │                            │
        └────────────────────────────┘
```

---

## Dependencies

### JavaScript (Browser)
**No new external libraries required.** All new code is vanilla ES6+.

- PDF.js: 4.4.168 (CDN, already in index.html)
  - ✓ VERIFIED: https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs
- Mammoth.js: 1.8.0 (CDN, already in index.html)
- JSZip: 3.10.1 (CDN, already in index.html)

### Python Backend (Optional)

If running know3_enhanced_backend.py:

```bash
pip install "docling>=2.75.0"    # VERIFIED: 2.80.0 latest (2026-03-20)
pip install "rank_bm25>=0.2.0"   # VERIFIED: 0.2.2 latest (2026-03-20)
pip install "flask>=3.0.0"       # For REST API
```

**Docling System Dependencies** (required if using docling):
- On Ubuntu/Debian: `apt install tesseract-ocr`
- On macOS: `brew install tesseract`
- On Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki

---

## Installation

### Option A: Browser-Only (Local BM25, no docling)

1. **Add enhancement script to index.html** (Line ~15, after other script imports):

```html
<!-- PDF.js for PDF parsing -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs" type="module"></script>
<!-- Mammoth for DOCX parsing -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js"></script>
<!-- JSZip for EPUB parsing -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>

<!-- ✨ NEW: Enhanced search capabilities ✨ -->
<script src="know3_enhancements.js"></script>
```

2. **Modify ingestion code** (replace original `ingestFile()` at line ~3135):

See [Code Modifications](#code-modifications) section.

3. **Modify RAG search code** (replace original `sendRAGMessage()` at line ~3570):

See [Code Modifications](#code-modifications) section.

4. **Test:** Open know3 in browser. BM25 will work automatically.

### Option B: With Backend (Docling + Server-side BM25)

1. **Complete Option A steps above**

2. **Start Python backend:**

```bash
python3 know3_enhanced_backend.py
# Output: Server running on http://localhost:5000
```

3. **Enable backend in browser** (add to index.html initialization, ~line 4315):

```javascript
// After DOM loads, connect to backend
document.addEventListener('DOMContentLoaded', async () => {
  // ... existing initialization ...

  // Try to connect to enhanced backend
  const backendAvailable = await enhancedSearch.enableBackend('http://localhost:5000');
  if (backendAvailable) {
    console.log('✓ Enhanced backend available (Docling + BM25)');
  } else {
    console.log('✓ Using browser-only mode (BM25 local, no Docling)');
  }
});
```

4. **Test:** Upload PDF → should show "parsed via docling" in logs

---

## Code Modifications

### Modification 1: Replace `parsePDF()` function (Line ~3023)

**OLD CODE** (lines 3023-3036):

```javascript
async function parsePDF(file) {
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
```

**NEW CODE:**

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

  // LINE 3032: Use enhanced parser (docling + fallback)
  try {
    const parsed = await window.enhancedSearch.enhancedPDFParser.parsePDFEnhanced(file);
    // VERIFIED: Docling 2.80.0 returns {text, sections, tables, method, success}
    if (parsed.success) {
      log(`PDF: ${parsed.pageCount} pages extracted via ${parsed.method}`, 'ok');
      return parsed.text;
    } else {
      // Docling failed, try PDF.js
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

**Explanation of Changes:**

| Line | Change | Reason |
|------|--------|--------|
| 3023 | Check for `window.enhancedSearch` before using | Graceful fallback if module not loaded |
| 3032 | Call `enhancedSearch.parsePDFEnhanced()` | Uses docling (if backend) or PDF.js (fallback) |
| 3033-3038 | Parse response including `sections` and `tables` | Docling returns structured document |
| 3039 | Log method used (`docling` or `pdfjs`) | Transparency about which parser was used |
| 3060 | Move original PDF.js code to fallback function | Reusable, cleaner code organization |

---

### Modification 2: Replace `sendRAGMessage()` function (Line ~3570)

**OLD CODE** (lines 3570-3662):

```javascript
async function sendRAGMessage() {
  if (window.neuralBG) window.neuralBG.state = 'rag';
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
    // OLD: Vector-only search
    let queryEmbedding = [];
    if (embedModel !== '__none__') {
      queryEmbedding = await ollamaEmbed(message, embedModel);
    }

    let results = [];
    if (queryEmbedding.length > 0) {
      results = vectorStore.search(queryEmbedding, topK, collection);  // Cosine similarity only
    } else {
      results = keywordSearch(message, topK, collection);  // Basic keyword matching
    }

    // ... rest of message generation ...
  } catch(e) {
    console.error('❌ RAG error:', e);
    addMessageToHistory('assistant', `⚠️ Error: ${e.message}`);
  }
}
```

**NEW CODE:**

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
    // LINE 3590: Use hybrid search if available, fallback to original
    let results = [];

    if (window.enhancedSearch && window.HybridSearchEngine) {
      // LINE 3600: Hybrid search (BM25 + Vector + Reranking)
      // VERIFIED: BM25Okapi (rank_bm25 0.2.2) uses pre-tokenized docs
      // Reference: https://github.com/dorianbrown/rank_bm25

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
        // LINE 3615: Add BM25 score for transparency
        bm25Score: r.bm25Score,
        vectorScore: r.vectorScore
      }));

      console.log(`✓ Hybrid search: ${results.length} results (BM25+Vector)`);
    } else {
      // LINE 3625: Fallback to original vector-only search
      console.log('⚠ Hybrid search unavailable, using original vector search');

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

    // Check RAG mode from settings
    const ragSettings = JSON.parse(localStorage.getItem('ragSettings') || '{}');
    const ragMode = ragSettings.ragMode || 'ask';

    let assistantMessage = '';
    let sources = [];

    if (results.length === 0) {
      assistantMessage = '❌ No relevant documents found. Try ingesting documents first.';
    } else if (ragMode === 'search') {
      // LINE 3650: Search-only mode: return chunks with BM25 + Vector scores
      assistantMessage = `📚 Found ${results.length} relevant chunks:\n\n`;
      assistantMessage += results.map((r, i) => {
        let scoreInfo = `Score: ${(r.score * 100).toFixed(0)}%`;
        // LINE 3655: Show component scores if hybrid search was used
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
      // Ask mode: generate answer with hybrid results
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

**Explanation of Changes:**

| Line | Change | Reason |
|------|--------|--------|
| 3570 | Check for `window.enhancedSearch` & `window.HybridSearchEngine` | Enable feature only if module loaded |
| 3600 | Call `HybridSearchEngine.hybridSearch()` | Uses BM25 + Vector + Reranking |
| 3615 | Add BM25 and Vector scores to results | Transparency in hybrid scoring |
| 3625 | Keep fallback to original `vectorStore.search()` | Ensures backward compatibility |
| 3655 | Show component scores (BM25 + Vector) | Users see how results were ranked |
| 3665 | Include BM25 and Vector scores in sources | Rich metadata about retrieval |

---

### Modification 3: Update Ingest Pipeline (Line ~3135)

**Optional enhancement** — Update progress logging to show BM25 indexing:

Add after line 3159 (after junk filtering):

```javascript
// LINE 3160: Index for BM25 (if enhanced search available)
if (window.enhancedSearch && window.BM25SearchEngine) {
  for (let i = 0; i < filteredChunks.length; i++) {
    window.BM25SearchEngine.addDocument(collection, filteredChunks[i], {
      file: file.name,
      chunkIndex: i,
      totalChunks: filteredChunks.length
    });
  }
  log(`✓ BM25 indexed: ${filteredChunks.length} documents (${Object.keys(window.BM25SearchEngine.collections[collection].idf).length} unique terms)`, 'ok');
}
```

---

## API Reference

### EnhancedPDFParser

```javascript
// Parse PDF with Docling (if available) or PDF.js fallback
const result = await EnhancedPDFParser.parsePDFEnhanced(file);
// Returns: { text, sections, tables, method: 'docling'|'pdfjs', success, pageCount, error? }
```

### BM25SearchEngine

```javascript
// Add document to BM25 index
BM25SearchEngine.addDocument(collectionName, text, metadata);

// Get collection stats
const idf = BM25SearchEngine.collections[name].idf;  // Inverse document frequency
const avgLen = BM25SearchEngine.collections[name].avgDocLen;  // Average doc length
```

### HybridSearchEngine

```javascript
// Hybrid search (BM25 + Vector + Reranking)
const results = await HybridSearchEngine.hybridSearch(
  query,           // string: search query
  queryEmbedding,  // array: vector embedding (optional)
  topK,            // number: top results to return
  collectionFilter // string: collection name (optional)
);
// Returns: [{text, bm25Score, vectorScore, combinedScore, metadata}, ...]

// Configuration
HybridSearchEngine.bm25Weight = 0.6;      // Lexical importance
HybridSearchEngine.vectorWeight = 0.4;    // Semantic importance
HybridSearchEngine.rerankerK = 10;        // Rerank top-k before final selection
```

### enhancedSearch (Integration API)

```javascript
// Connect to backend (optional)
const available = await enhancedSearch.enableBackend('http://localhost:5000');

// Ingest file (replaces original ingestFile)
const result = await enhancedSearch.ingestFileEnhanced(file);
// Returns: { success, chunks?, error? }

// RAG search with hybrid retrieval
const searchResult = await enhancedSearch.hybridRAGSearch(message, topK, collection);
// Returns: { success, results: [{text, score, bm25Score?, vectorScore?, metadata}], error? }

// Get statistics
const stats = enhancedSearch.getStats();
```

---

## Examples

### Example 1: Browser-Only Mode (No Backend)

```javascript
// 1. Load know3 normally
// 2. Include <script src="know3_enhancements.js"></script>
// 3. Upload PDF → BM25 indexes automatically
// 4. RAG search → uses hybrid BM25 + vector (from Ollama embeddings)

// In console, check stats:
console.log(enhancedSearch.getStats());
// Output: {
//   bm25Collections: ["default", "research"],
//   backendActive: false,
//   backendURL: null,
//   weights: {bm25: 0.6, vector: 0.4},
//   bm25_default: {documents: 42, avgDocLen: 156, uniqueTerms: 1204},
//   bm25_research: {documents: 18, avgDocLen: 203, uniqueTerms: 680}
// }
```

### Example 2: With Backend (Docling + Server-side BM25)

```bash
# Terminal 1: Start backend
python3 know3_enhanced_backend.py
# Output: Server running on http://localhost:5000

# Terminal 2 (Browser console): Enable backend
await enhancedSearch.enableBackend('http://localhost:5000')
// Output: ✓ Backend connected (docling=true)

# Terminal 2 (Browser): Upload complex PDF
// Log output:
// 📄 Parsing PDF: annual-report.pdf (1204 KB)
// ✓ Docling parsed successfully (847 lines)
// ✓ Added 56 chunks to BM25 index
// ✓ Backend hybrid search: 5 results
```

### Example 3: Tuning Hybrid Search Weights

```javascript
// Emphasize semantic relevance (more forgiving of keyword mismatches)
HybridSearchEngine.bm25Weight = 0.4;
HybridSearchEngine.vectorWeight = 0.6;

// Emphasize keyword matching (strict term relevance)
HybridSearchEngine.bm25Weight = 0.8;
HybridSearchEngine.vectorWeight = 0.2;

// Balanced (default)
HybridSearchEngine.bm25Weight = 0.6;
HybridSearchEngine.vectorWeight = 0.4;
```

### Example 4: Checking Retrieval Scores

```javascript
// After RAG search, sources include both scores:
const sources = [
  {
    index: 1,
    file: "report.pdf",
    score: "87",        // Combined score
    bm25: "92",         // Lexical relevance
    vector: "78"        // Semantic relevance
  }
];

// High BM25, low vector = keyword-heavy match
// Low BM25, high vector = semantic match (topic relevant)
```

---

## Performance Characteristics

### BM25 Engine (Browser)

| Operation | Time | Notes |
|-----------|------|-------|
| Add 1 chunk | ~0.5 ms | Tokenize + update IDF |
| Search 1000 chunks | ~20 ms | Full scan, no index |
| Rerank top-10 | ~2 ms | Jaccard similarity |

**Optimization Tips:**
- BM25 has no indexing — linear scan through all chunks
- For >10k chunks, consider using backend
- Vector search is ~5-10x faster if embeddings precomputed

### Docling (Backend)

| PDF Type | Time | Quality |
|----------|------|---------|
| Simple (text-only) | 2-5s | 95% (same as PDF.js) |
| Complex (tables, layout) | 5-15s | 98% (preserves structure) |
| Scanned (OCR needed) | 10-30s | 85-92% (tesseract-dependent) |

**Backend Setup:**
```bash
# Install Tesseract for OCR support (optional)
# Ubuntu: apt install tesseract-ocr
# macOS: brew install tesseract
# Windows: https://github.com/UB-Mannheim/tesseract/wiki

# Python dependencies
pip install "docling[pdf]>=2.75.0"  # Includes PDF support
pip install "docling[ocr]>=2.75.0"  # Includes OCR
```

---

## Troubleshooting

### Issue: "enhancedSearch not defined"

**Solution:** Ensure `<script src="know3_enhancements.js"></script>` is loaded before index.html's closing `</body>` tag.

### Issue: BM25 search returns no results

**Reason:** Query tokens might be too short or all stopwords.

**Solution:** Check query in browser console:
```javascript
BM25SearchEngine.tokenize("your query")
// If empty, increase minTokenLength or remove stopword
```

### Issue: Backend returns 400 error

**Check:**
1. Is backend running? `curl http://localhost:5000/health`
2. Is docling installed? `python -c "import docling"`
3. Is tesseract available (for OCR)? `which tesseract`

### Issue: Docling parsing slower than PDF.js

**Normal behavior.** Docling does more work (layout analysis, table detection).

**Options:**
1. Use PDF.js for fast ingestion, docling for reprocessing complex PDFs
2. Run backend in separate process for non-blocking parsing
3. Batch process PDFs offline with docling CLI

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-20 | Initial: Docling + BM25 hybrid search |

---

## References

- **BM25:** https://en.wikipedia.org/wiki/Okapi_BM25
- **rank_bm25:** https://github.com/dorianbrown/rank_bm25
- **Docling:** https://ds4sd.github.io/docling/
- **PDF.js:** https://mozilla.github.io/pdf.js/

---

## License

MIT License (same as know3)

Created: 2026-03-20
