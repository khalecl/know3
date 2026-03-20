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

know3 also includes a full **RAG (Retrieval-Augmented Generation)** system — have multi-turn streaming conversations with your documents, with source citations and adjustable parameters.

---

## What's New in v3.5

- 🎨 **Theme System** — 6 preset color themes (Emerald, Ocean, Sunset, Cyber Pink, Royal Gold, Monochrome) plus a custom accent color picker. Your entire UI adapts from a single color choice, saved across sessions.
- 💬 **Streaming RAG Chat** — Responses now stream token-by-token as the LLM generates them, with a typing indicator, ChatGPT-style message bubbles, copy buttons, and suggested prompts.
- 🧠 **Animated Neural Network Background** — Multi-layered canvas visualization with 3 node layers that reacts to your activity (color-shifts during generation, embedding, and RAG queries).
- 🚀 **Splash Screen** — Branded loading screen while Ollama connects.
- 📖 **7-Step Interactive Tutorial** — Auto-shown on first visit, covering Ollama setup through export.
- 👤 **Author Branding** — About modal with creator credentials, GitHub links, and MIT license badge.
- 📊 **Visitor Analytics** — Expandable footer with hit counter, live online count, and country flags.

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
                       │  Stream +    │
                       │  Cite        │
                       └──────────────┘
```

**The Workflow:**

1. **Ingest** — Drop your documents. know3 extracts text, removes junk, and splits it into optimized chunks. Each chunk is embedded into a vector for semantic search.

2. **Generate** — Select a content domain (Generic, Coding, Scientific, Legal, Business, Literature, Research Papers). know3 sends each chunk to your local LLM with domain-optimized prompts and generates instruction/output training pairs.

3. **Export** — Download your training data in 5 formats ready for fine-tuning any LLM.

4. **Chat (RAG)** — Have streaming, multi-turn conversations with your documents. know3 retrieves the most relevant chunks and generates AI-powered answers with source citations — tokens appear as they're generated.

---

## 🛠️ Quick Start

### 1. Install Ollama

Download and install Ollama from [ollama.com](https://ollama.com/download). It is compatible with Windows, Mac, and Linux.

### 2. Pull Required Models

You will need a generation model for training data and an embedding model for RAG functionality:

```bash
ollama pull llama3.2:3b          # Recommended generation model
ollama pull qwen2.5:1.5b         # Best for low-resource/CPU-only systems
ollama pull nomic-embed-text     # Required for search/RAG
```

### 3. Enable Browser Access (CORS)

To allow the browser-based interface to communicate with your local Ollama instance, configure the `OLLAMA_ORIGINS` environment variable:

| Platform | Command / Action |
|----------|------------------|
| **Windows** | Set Environment Variable `OLLAMA_ORIGINS` = `*` and restart Ollama. |
| **Mac** | Run `launchctl setenv OLLAMA_ORIGINS "*"` and restart Ollama. |
| **Linux** | Run `OLLAMA_ORIGINS="*" ollama serve`. |

### 4. Open the App

Visit [khalecl.github.io/know3](https://khalecl.github.io/know3). The status indicator will turn green once it detects the local Ollama connection.

---

## 🚀 Core Features

- **Document Ingestion** — Supports PDF, DOCX, EPUB, and TXT files
- **Data Generation** — Generates training pairs for fine-tuning LLaMA, Mistral, or Qwen models
- **Streaming RAG Chat** — Multi-turn conversations with real-time token streaming, source citations, and suggested prompts
- **Domain Presets** — Optimized prompts for Generic, Coding, Scientific, Legal, Business, Literature, and Research content
- **Flexible Export** — Supports JSONL, JSON, Alpaca, ShareGPT, and CSV formats
- **Theme Customization** — 6 preset themes plus custom accent color picker
- **Neural Network Visualization** — Animated background that reacts to processing activity
- **Privacy First** — 100% browser-based; no data ever leaves your machine

---

## 📊 Performance & Optimization

### Recommended Models

| Model | Use Case | Details |
|-------|----------|---------|
| **llama3.2:3b** | Balanced | Great balance of speed and quality |
| **qwen2.5:1.5b** | Low Resource / No GPU | Highly recommended for systems without dedicated VRAM |
| **mistral:7b** | High Quality | Highest quality, requires more RAM/GPU |
| **nomic-embed-text** | Embeddings | Required for semantic search |

### Tuning Tips

- **Chunk Size** — 800 characters is the default. Use 400 for shorter content and 1500+ for long-form content
- **Generation Speed** — If generation is slow, switch to a smaller model (like Qwen 1.5B), reduce pairs per chunk to 1, or increase chunk size to reduce total workload

---

## 🏗️ Architecture

know3 is a **single HTML file** — no build step, no framework, no server beyond Ollama.

- **Frontend** — Vanilla HTML5, CSS3, and ES6 JavaScript (modules)
- **Vector Store** — In-memory cosine similarity search with browser-side embeddings
- **AI Backend** — Local Ollama REST API via `localhost:11434` with streaming support
- **Persistence** — Settings, themes, and conversation history saved in browser `localStorage`
- **Visualization** — Canvas-based 3-layer neural network with state-driven color transitions

---

## ⚖️ License

MIT License. Created by [Dr. Khaled Diab](https://github.com/khalecl).

---

<div align="center">

**[🚀 Launch know3](https://khalecl.github.io/know3/)** • **[GitHub Issues](https://github.com/khalecl/know3/issues)**

Made with dedication by Dr. Khaled Diab for the open-source AI community.

</div>
