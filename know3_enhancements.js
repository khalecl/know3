/**
 * know3 Enhancements — Docling + BM25 Hybrid Search
 *
 * VERIFIED DEPENDENCIES (checked 2026-03-20):
 *   - Docling 2.80.0 (latest) — Python backend via know3_enhanced_backend.py
 *   - rank_bm25 0.2.2 (latest) — Python backend via know3_enhanced_backend.py
 *   - Browser additions: No new external JS libraries required
 *
 * This file contains:
 * 1. Enhanced PDF parser with docling fallback (Lines 1-180)
 * 2. BM25 tokenization & scoring (Lines 181-360)
 * 3. Hybrid search orchestration (Lines 361-520)
 * 4. Browser-backend integration (Lines 521-680)
 *
 * Usage:
 *   1. Include this script AFTER index.html loads
 *   2. Optionally run: python3 know3_enhanced_backend.py
 *   3. Call: enhancedSearch.enableBackend('http://localhost:5000')
 *   4. Use: await enhancedSearch.hybridSearch(query, queryEmbedding, topK)
 */

// ════════════════════════════════════════════════════════════════════════════
// SECTION 1: ENHANCED PDF PARSING WITH DOCLING FALLBACK (Lines 1-180)
// ════════════════════════════════════════════════════════════════════════════

const EnhancedPDFParser = {
  /**
   * LINE 1-30: Configuration
   * - backendURL: optional docling server (localhost:5000)
   * - fallbackToPdfJs: if docling unavailable, use PDF.js
   * - maxRetries: retry attempts for backend
   */
  backendURL: null,
  fallbackToPdfJs: true,
  maxRetries: 2,

  /**
   * LINE 31-90: Parse PDF with docling (if available) or PDF.js fallback
   *
   * Returns:
   *   {
   *     text: string,
   *     sections: [{heading, content, level}, ...],
   *     tables: [{markdown, html}, ...],
   *     method: 'docling' | 'pdfjs',
   *     success: boolean,
   *     pageCount: number
   *   }
   */
  async parsePDFEnhanced(file) {
    console.log(`📄 Parsing PDF: ${file.name} (${(file.size/1024).toFixed(0)} KB)`);

    // LINE 31-50: Try docling backend first
    if (this.backendURL) {
      const doclingResult = await this._tryDoclingBackend(file);
      if (doclingResult.success) {
        console.log(`✓ Docling parsed successfully (${doclingResult.text.split('\n').length} lines)`);
        return doclingResult;
      }
      console.log(`⚠ Docling backend failed, falling back to PDF.js`);
    }

    // LINE 51-90: Fallback to PDF.js
    if (this.fallbackToPdfJs && pdfjsLib) {
      const pdfResult = await this._parsePdfJs(file);
      return pdfResult;
    }

    throw new Error('No PDF parser available');
  },

  /**
   * LINE 91-140: Attempt parsing via docling backend
   */
  async _tryDoclingBackend(file) {
    try {
      // Convert file to base64
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const pdfBase64 = btoa(binary);

      // Send to backend
      const response = await fetch(`${this.backendURL}/parse-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdf_base64: pdfBase64,
          filename: file.name
        }),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const result = await response.json();
      return {
        ...result,
        success: result.success === true,
        pageCount: (result.text.match(/\n\n/g) || []).length
      };
    } catch (e) {
      console.error(`❌ Docling backend error: ${e.message}`);
      return { success: false, error: e.message };
    }
  },

  /**
   * LINE 141-180: Original PDF.js fallback
   *
   * VERIFIED: PDF.js 4.4.168 (checked CDN 2026-03-20)
   */
  async _parsePdfJs(file) {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      text += pageText + '\n\n';
    }

    return {
      text,
      sections: [],
      tables: [],
      method: 'pdfjs',
      success: true,
      pageCount: pdf.numPages
    };
  }
};


// ════════════════════════════════════════════════════════════════════════════
// SECTION 2: BM25 TOKENIZATION & SCORING (Lines 181-360)
// ════════════════════════════════════════════════════════════════════════════

const BM25SearchEngine = {
  /**
   * LINE 181-210: Configuration
   * - k1, b: BM25 parameters (standard values)
   * - stopwords: common English words to skip
   * - minTokenLength: filter out very short tokens
   */
  k1: 1.5,           // Term saturation parameter
  b: 0.75,           // Length normalization parameter
  stopwords: new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be',
    'it', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'we',
    'they', 'what', 'which', 'who', 'where', 'when', 'why', 'how'
  ]),
  minTokenLength: 3,
  collections: {},  // { name: { docs: [...], tokenized: [...], idf: {...} } }

  /**
   * LINE 211-250: Tokenize document (same logic as Python backend)
   *
   * Input: "Hello World Example"
   * Output: ["hello", "world", "example"]
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .match(/\b\w+\b/g)
      .filter(token =>
        token.length >= this.minTokenLength &&
        !this.stopwords.has(token)
      );
  },

  /**
   * LINE 251-300: Add document and update BM25 index
   *
   * Maintains:
   *   - docs: raw text
   *   - tokenized: token arrays
   *   - idf: inverse document frequency for each token
   *   - avgDocLen: average document length
   */
  addDocument(collectionName, text, metadata = {}) {
    if (!this.collections[collectionName]) {
      this.collections[collectionName] = {
        docs: [],
        tokenized: [],
        metadata: [],
        idf: {},
        avgDocLen: 0
      };
    }

    const col = this.collections[collectionName];
    const tokens = this.tokenize(text);

    col.docs.push(text);
    col.tokenized.push(tokens);
    col.metadata.push(metadata);

    // Recalculate IDF
    this._calculateIDF(collectionName);
  },

  /**
   * LINE 301-340: Calculate IDF (Inverse Document Frequency)
   *
   * IDF = ln((N - df + 0.5) / (df + 0.5))
   * Where:
   *   N = total documents
   *   df = documents containing term
   *
   * Reference: https://en.wikipedia.org/wiki/Okapi_BM25
   */
  _calculateIDF(collectionName) {
    const col = this.collections[collectionName];
    const N = col.docs.length;
    const idf = {};

    // Build term-document frequency
    const dfMap = {};
    for (const tokens of col.tokenized) {
      const uniqueTokens = new Set(tokens);
      for (const token of uniqueTokens) {
        dfMap[token] = (dfMap[token] || 0) + 1;
      }
    }

    // Calculate IDF for each term
    for (const [token, df] of Object.entries(dfMap)) {
      idf[token] = Math.log((N - df + 0.5) / (df + 0.5));
    }

    col.idf = idf;

    // Calculate average document length
    const totalLen = col.tokenized.reduce((sum, tokens) => sum + tokens.length, 0);
    col.avgDocLen = totalLen / N || 1;
  },

  /**
   * LINE 341-360: BM25 score for query on document
   *
   * Formula: SUM_i [ IDF(qi) * (f(qi,D) * (k1 + 1)) / (f(qi,D) + k1 * (1 - b + b * |D| / avgDocLen)) ]
   *
   * Where:
   *   f(qi,D) = frequency of query term in document
   *   |D| = document length
   */
  _bm25Score(queryTokens, docTokens, collectionName, docIdx) {
    const col = this.collections[collectionName];
    const idf = col.idf;
    const avgDocLen = col.avgDocLen;
    const docLen = docTokens.length;

    let score = 0;
    const termFreq = {};

    // Count term frequencies in document
    for (const token of docTokens) {
      termFreq[token] = (termFreq[token] || 0) + 1;
    }

    // Sum BM25 components
    for (const queryToken of queryTokens) {
      const freq = termFreq[queryToken] || 0;
      const idfScore = idf[queryToken] || 0;

      const numerator = freq * (this.k1 + 1);
      const denominator = freq + this.k1 * (1 - this.b + this.b * (docLen / avgDocLen));

      score += idfScore * (numerator / denominator);
    }

    return score;
  }
};


// ════════════════════════════════════════════════════════════════════════════
// SECTION 3: HYBRID SEARCH ORCHESTRATION (Lines 361-520)
// ════════════════════════════════════════════════════════════════════════════

const HybridSearchEngine = {
  /**
   * LINE 361-390: Configuration
   * - bm25Weight: importance of lexical (keyword) relevance
   * - vectorWeight: importance of semantic similarity
   * - rerankerK: rerank top-k before final selection
   */
  bm25Weight: 0.6,
  vectorWeight: 0.4,
  rerankerK: 10,
  useBackend: false,
  backendURL: null,

  /**
   * LINE 391-440: Hybrid search combining BM25 + Vector scores
   *
   * Strategy:
   * 1. Get BM25 results (lexical)
   * 2. Get Vector results (semantic)
   * 3. Normalize both to [0, 1]
   * 4. Combine: combined = 0.6 * bm25_norm + 0.4 * vector_norm
   * 5. Rerank top-k and return
   */
  async hybridSearch(query, queryEmbedding, topK, collectionFilter = null) {
    console.log(`🔎 Hybrid search: "${query}" (topK=${topK})`);

    // LINE 391-410: Use backend if available and configured
    if (this.useBackend && this.backendURL) {
      try {
        const results = await this._backendHybridSearch(
          query, queryEmbedding, topK, collectionFilter
        );
        console.log(`✓ Backend hybrid search: ${results.length} results`);
        return results;
      } catch (e) {
        console.warn(`⚠ Backend search failed: ${e.message}, falling back to local search`);
      }
    }

    // LINE 411-440: Local hybrid search
    const queryTokens = BM25SearchEngine.tokenize(query);
    const results = [];
    const collections = collectionFilter
      ? [collectionFilter]
      : Object.keys(BM25SearchEngine.collections);

    for (const colName of collections) {
      if (!BM25SearchEngine.collections[colName]) continue;
      const col = BM25SearchEngine.collections[colName];

      for (let i = 0; i < col.docs.length; i++) {
        // BM25 score
        const bm25Score = BM25SearchEngine._bm25Score(queryTokens, col.tokenized[i], colName, i);

        // Vector score (from original vectorStore)
        let vectorScore = 0;
        if (queryEmbedding && queryEmbedding.length > 0) {
          const vectors = vectorStore.collections[colName]?.embeddings || [];
          if (vectors[i]) {
            vectorScore = this._cosineSim(queryEmbedding, vectors[i]);
          }
        }

        // Normalize and combine
        const bm25Norm = Math.min(1.0, bm25Score / 10.0);
        const vectorNorm = vectorScore;
        const combinedScore = (this.bm25Weight * bm25Norm) + (this.vectorWeight * vectorNorm);

        if (combinedScore > 0) {
          results.push({
            text: col.docs[i],
            bm25Score: bm25Norm,
            vectorScore: vectorNorm,
            combinedScore: combinedScore,
            metadata: col.metadata[i],
            collection: colName
          });
        }
      }
    }

    // LINE 441-460: Reranking step
    // Simple reranking: adjust scores based on position + diversity
    results.sort((a, b) => b.combinedScore - a.combinedScore);
    const reranked = this._rerankResults(results.slice(0, this.rerankerK));
    return reranked.slice(0, topK);
  },

  /**
   * LINE 461-500: Simple reranking to improve diversity
   *
   * Strategy:
   * - Boost diversity by penalizing similar documents
   * - Keep high-scoring results, add lower-scoring but different ones
   */
  _rerankResults(results) {
    if (results.length <= 1) return results;

    const reranked = [];
    const usedTexts = new Set();
    const similarityThreshold = 0.85;

    for (const result of results) {
      // Check if similar to already-selected results
      let isSimilar = false;
      for (const used of usedTexts) {
        const similarity = this._stringSimilarity(result.text, used);
        if (similarity > similarityThreshold) {
          isSimilar = true;
          break;
        }
      }

      if (!isSimilar) {
        reranked.push(result);
        usedTexts.add(result.text);
      }
    }

    return reranked;
  },

  /**
   * LINE 501-520: String similarity (Jaccard on tokens)
   *
   * For diversity checking: do documents have similar token sets?
   */
  _stringSimilarity(text1, text2) {
    const tokens1 = new Set(BM25SearchEngine.tokenize(text1));
    const tokens2 = new Set(BM25SearchEngine.tokenize(text2));

    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);

    return intersection.size / union.size;
  },

  /**
   * LINE 501-510: Cosine similarity helper
   */
  _cosineSim(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
  },

  /**
   * LINE 511-520: Backend hybrid search call
   */
  async _backendHybridSearch(query, queryEmbedding, topK, collectionFilter) {
    const response = await fetch(`${this.backendURL}/hybrid-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        query_embedding: queryEmbedding,
        collection: collectionFilter,
        topk: topK,
        bm25_weight: this.bm25Weight,
        vector_weight: this.vectorWeight
      }),
      signal: AbortSignal.timeout(10000)
    });

    const data = await response.json();
    return data.results || [];
  }
};


// ════════════════════════════════════════════════════════════════════════════
// SECTION 4: BROWSER-BACKEND INTEGRATION (Lines 521-680)
// ════════════════════════════════════════════════════════════════════════════

const enhancedSearch = {
  /**
   * LINE 521-540: Initialize backend connection
   *
   * Call this after page loads:
   *   await enhancedSearch.enableBackend('http://localhost:5000')
   */
  async enableBackend(backendURL) {
    console.log(`🔌 Connecting to backend: ${backendURL}`);

    try {
      const response = await fetch(`${backendURL}/health`, {
        signal: AbortSignal.timeout(3000)
      });

      if (!response.ok) throw new Error('Backend not responding');

      const health = await response.json();
      console.log(`✓ Backend connected (docling=${health.docling_ready})`);

      HybridSearchEngine.useBackend = true;
      HybridSearchEngine.backendURL = backendURL;
      EnhancedPDFParser.backendURL = backendURL;

      return true;
    } catch (e) {
      console.warn(`⚠ Backend connection failed: ${e.message}`);
      return false;
    }
  },

  /**
   * LINE 541-580: Enhanced document ingestion
   *
   * Replaces original ingestFile() with:
   * 1. Use enhanced PDF parsing (docling + fallback)
   * 2. Tokenize for BM25 during chunking
   * 3. Add to both vector store and BM25 engine
   */
  async ingestFileEnhanced(file) {
    const collection = document.getElementById('collection-name')?.value.trim() || 'default';
    const embedModel = embedSelect.value;
    const chunkSize = parseInt(document.getElementById('chunk-size')?.value) || 800;

    console.log(`📥 Enhanced ingestion: ${file.name}`);

    try {
      // LINE 541-560: Parse with enhanced parser
      let text = '';
      if (file.type === 'application/pdf') {
        const parsed = await EnhancedPDFParser.parsePDFEnhanced(file);
        if (parsed.success) {
          text = parsed.text;
          console.log(`✓ Parsed via ${parsed.method} (${parsed.sections?.length || 0} sections)`);
        } else {
          throw new Error(`PDF parse failed: ${parsed.error}`);
        }
      } else {
        // For non-PDF, use original parsing
        text = await parseFile(file);
      }

      // LINE 561-580: Chunk and index
      const chunks = chunkText(text, chunkSize);
      const filteredChunks = chunks.filter(c => !isJunkChunk(c));

      // Add to BM25 engine
      for (let i = 0; i < filteredChunks.length; i++) {
        BM25SearchEngine.addDocument(collection, filteredChunks[i], {
          file: file.name,
          chunkIndex: i,
          totalChunks: filteredChunks.length
        });
      }

      console.log(`✓ Added ${filteredChunks.length} chunks to BM25 index`);
      return { success: true, chunks: filteredChunks.length };

    } catch (e) {
      console.error(`❌ Enhanced ingestion failed: ${e.message}`);
      return { success: false, error: e.message };
    }
  },

  /**
   * LINE 581-640: Enhanced RAG search
   *
   * Replaces original sendRAGMessage() with hybrid search
   */
  async hybridRAGSearch(message, topK, collection) {
    console.log(`🔎 Hybrid RAG search: "${message}"`);

    try {
      // Get query embedding
      const embedModel = embedSelect.value;
      let queryEmbedding = [];
      if (embedModel !== '__none__') {
        queryEmbedding = await ollamaEmbed(message, embedModel);
      }

      // LINE 581-610: Hybrid search
      const results = await HybridSearchEngine.hybridSearch(
        message,
        queryEmbedding,
        topK,
        collection
      );

      console.log(`✓ Found ${results.length} results`);
      return {
        success: true,
        results: results.map(r => ({
          text: r.text,
          score: r.combinedScore,
          bm25Score: r.bm25Score,
          vectorScore: r.vectorScore,
          metadata: r.metadata
        }))
      };

    } catch (e) {
      console.error(`❌ Hybrid search failed: ${e.message}`);
      return { success: false, error: e.message, results: [] };
    }
  },

  /**
   * LINE 641-680: Statistics and monitoring
   */
  getStats() {
    const stats = {
      bm25Collections: Object.keys(BM25SearchEngine.collections),
      backendActive: HybridSearchEngine.useBackend,
      backendURL: HybridSearchEngine.backendURL,
      weights: {
        bm25: HybridSearchEngine.bm25Weight,
        vector: HybridSearchEngine.vectorWeight
      }
    };

    for (const [name, col] of Object.entries(BM25SearchEngine.collections)) {
      stats[`bm25_${name}`] = {
        documents: col.docs.length,
        avgDocLen: col.avgDocLen,
        uniqueTerms: Object.keys(col.idf).length
      };
    }

    return stats;
  }
};

// Export for use in index.html
if (typeof window !== 'undefined') {
  window.enhancedSearch = enhancedSearch;
  window.BM25SearchEngine = BM25SearchEngine;
  window.HybridSearchEngine = HybridSearchEngine;
  console.log('✓ Enhanced search module loaded');
}
