<div align="center">

# 🧠 know3

### Local RAG + Training Data Engine

**Turn your documents into AI training data — 100% offline, 100% private.**

Created by **[Dr. Khaled Diab](https://github.com/khalecl)** · PhD Electrical Power Engineering

[![Version](https://img.shields.io/badge/version-v3.5-00e5a0?style=for-the-badge)](https://github.com/khalecl/know3)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)
[![Ollama](https://img.shields.io/badge/Powered_by-Ollama-white?style=for-the-badge)](https://ollama.com)
[![GitHub Pages](https://img.shields.io/badge/Live_Demo-GitHub_Pages-purple?style=for-the-badge)](https://khalecl.github.io/know3/)

[**🚀 Launch know3**](https://khalecl.github.io/know3/) · [Report Bug](https://github.com/khalecl/know3/issues) · [Request Feature](https://github.com/khalecl/know3/issues)

</div>

---

## What is know3?

know3 is a powerful, **completely offline** training data generation engine that transforms your documents into high-quality instruction/output pairs optimized for fine-tuning large language models.

Upload your PDFs, Word documents, eBooks, or text files, and know3 uses a locally running LLM (via [Ollama](https://ollama.com)) to generate domain-specific training pairs — ready for HuggingFace, LLaMA, Mistral, or any fine-tuning pipeline.

**No cloud APIs. No subscriptions. No data ever leaves your machine.**

know3 also includes a full **RAG (Retrieval-Augmented Generation)** system — have multi-turn conversations with your documents, with real-time streaming, source citations, and hybrid search.

---

## How It Works

```
Your Documents          Ollama (Local AI)         Training Data
┌──────────┐           ┌──────────────┐          ┌──────────────┐
│  PDF     │           │              │          │  JSONL       │
│  DOCX    │──ingest──▶│  Chunk +     │──gen────▶│  JSON        │
│  EPUB    │           │  Embed +     │          │  Alpaca      │
│  TXT     │           │  Generate    │          │  ShareGPT    │
└──────────┘           └──────────────┘          │  CSV         │
                                                  └──────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │  RAG Chat    │
                       │  Hybrid Search│
                       │  + Streaming │
                       └──────────────┘
```

**The Workflow:**

1. **Ingest** — Drop your documents. know3 extracts text, removes junk, and splits it into optimized chunks. Each chunk is embedded into a vector for semantic search.

2. **Generate** — Select a content domain (Generic, Coding, Scientific, Legal, Business, Literature, Research Papers). know3 sends each chunk to your local LLM with domain-optimized prompts and generates instruction/output training pairs.

3. **Export** — Download your training data in 5 formats ready for fine-tuning any LLM.

4. **Chat (RAG)** — Have multi-turn conversations with your documents using hybrid search (vector + keyword + Reciprocal Rank Fusion). Responses stream in real-time with source citations.

---

## 🛠️ Quick Start

### 1. Install Ollama

Download and install Ollama from [ollama.com](https://ollama.com/download). Compatible with Windows, Mac, and Linux.

### 2. Pull Required Models

```bash
ollama pull llama3.2:3b          # Recommended generation model
ollama pull qwen2.5:1.5b         # Best for low-resource/CPU-only systems
ollama pull nomic-embed-text     # Required for search/RAG
```

### 3. Enable Browser Access (CORS)

| Platform | Command / Action |
|----------|------------------|
| **Windows** | Set Environment Variable `OLLAMA_ORIGINS` = `*` and restart Ollama |
| **Mac** | Run `launchctl setenv OLLAMA_ORIGINS "*"` and restart Ollama |
| **Linux** | Run `OLLAMA_ORIGINS="*" ollama serve` |

### 4. Open the App

Visit [khalecl.github.io/know3](https://khalecl.github.io/know3). The status indicator turns green once Ollama is detected.

---

## 🚀 Core Features

### Document Processing
- **Multi-format ingestion** — PDF, DOCX, EPUB, TXT
- **Intelligent chunking** — configurable chunk sizes with automatic junk filtering
- **Chunk review** — preview, select, and filter chunks before generating
- **Multiple collections** — organize documents by topic or project

### Training Data Generation
- **7 domain-specific prompts** — Generic, Coding, Scientific, Legal, Business, Literature, Research
- **Quality-gated generation** — configurable pairs per chunk (1-3)
- **Real-time progress** — live tracking with time estimates
- **Neural network visualization** — background animation reacts to processing state

### RAG Conversation (v3.5)
- **Hybrid search** — combines vector similarity + keyword matching using Reciprocal Rank Fusion (RRF) for significantly better retrieval
- **Real-time streaming** — responses stream token-by-token as Ollama generates them
- **ChatGPT-style UI** — message bubbles with avatars, typing indicator, suggestion prompts
- **Source citations** — every answer references specific source documents with relevance scores
- **Multi-turn context** — conversation history is maintained for follow-up questions
- **Copy button** — hover to copy any response
- **Grounded answers** — improved prompting with strict anti-hallucination rules

### Customization
- **6 color themes** — Emerald, Ocean, Sunset, Cyber Pink, Royal Gold, Monochrome
- **Custom accent color** — pick any hex color and the full UI adapts
- **Theme persistence** — your choice is saved across sessions
- **Ollama connection settings** — connect to localhost or any LAN IP from the Settings panel

### Export
- **5 formats** — JSONL, JSON, Alpaca, ShareGPT, CSV
- **Source inclusion** — optionally include source chunks with exported pairs
- **Vector store export** — save your entire vector database

---

## 📊 Performance & Optimization

### Recommended Models

| Model | Use Case | Details |
|-------|----------|---------|
| **llama3.2:3b** | Balanced | Great balance of speed and quality |
| **qwen2.5:1.5b** | Low Resource / No GPU | Ideal for systems without dedicated VRAM |
| **mistral:7b** | High Quality | Best quality output, requires more RAM/GPU |
| **nomic-embed-text** | Embeddings | Required for semantic search and hybrid RAG |

### Tuning Tips

- **Chunk Size** — 800 characters default. Use 400 for short content, 1500+ for long-form
- **Generation Speed** — switch to a smaller model, reduce pairs per chunk, or increase chunk size
- **RAG Quality** — increase Top-K for broader context, lower temperature for more precise answers

---

## 🏗️ Architecture

- **Frontend** — Single HTML file, vanilla HTML5 + CSS3 + ES6 JavaScript
- **Vector Store** — In-memory cosine similarity search
- **Search** — Hybrid retrieval (vector + keyword) with Reciprocal Rank Fusion
- **AI Backend** — Local Ollama REST API with streaming support
- **Persistence** — Settings, themes, and conversation history in browser localStorage
- **Visualization** — Canvas-based 3-layer neural network with state-reactive animations

---

## 🎨 Theming

know3 includes a full theme system accessible from Settings → Theme:

| Theme | Accent Color |
|-------|-------------|
| Emerald (default) | `#00e5a0` |
| Ocean | `#38bdf8` |
| Sunset | `#fb923c` |
| Cyber Pink | `#f472b6` |
| Royal Gold | `#fbbf24` |
| Monochrome | `#94a3b8` |

You can also pick any custom color using the color picker — the entire UI automatically adapts.

---

## ⚖️ License

MIT License. Created by Dr. Khaled Diab.

---

<div align="center">

**[🚀 Launch know3](https://khalecl.github.io/know3/)** • **[GitHub Issues](https://github.com/khalecl/know3/issues)**

Made with ❤️ for the open-source community

</div>
