# know3 — Local RAG + Training Data Engine

> **100% Offline · Ollama LLM + Embeddings · In-Memory Vector Store · Zero Cloud Cost**

![Version](https://img.shields.io/badge/version-v3.1-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/platform-Browser%20%2B%20Ollama-darkblue)

know3 is a powerful, **completely offline** training data generation engine. Upload your documents, and it automatically creates high-quality instruction/output pairs optimized for fine-tuning language models.

## ✨ Key Features

### 🎯 Core Functionality
- **Document Ingestion**: Upload PDF, DOCX, EPUB, TXT files
- **Intelligent Chunking**: Automatic text splitting with configurable chunk sizes
- **Smart Generation**: Domain-specific training pair generation
- **RAG Query**: Semantic search + retrieval-augmented generation
- **Multi-Format Export**: JSONL, JSON, Alpaca, ShareGPT, CSV

### 🔧 Phase 2 Enhancements
- **Settings Drawer**: Centralized configuration panel for all settings
- **ChatGPT-Style Conversation**: Multi-turn RAG conversations with history
- **Custom Data Loading**: Upload JSON/JSONL files for custom collections
- **RAG Integration**: Temperature, top-K, source citations, conversation context
- **Persistent Storage**: localStorage-based conversation and settings history

### 🚀 Technical Highlights
- **100% Offline**: Everything runs locally — no cloud APIs, no subscriptions
- **Ollama Integration**: Use any Ollama-compatible LLM + embeddings model
- **In-Memory Vector Store**: Fast semantic search with cosine similarity
- **Responsive UI**: Works on desktop and mobile browsers
- **Zero Dependencies**: Pure HTML/CSS/JavaScript (except Ollama backend)

## 📋 Supported Domains

Generate training pairs optimized for:
- **Generic**: General-purpose instruction/output pairs
- **Coding & APIs**: Code examples, method signatures, parameters
- **Scientific & Math**: Equations, derivations, technical concepts
- **Literature & Humanities**: Textual analysis, themes, literary criticism
- **Legal Documents**: Contract clauses, legal terminology, obligations
- **Business & Economics**: Business models, metrics, financial reasoning
- **Research Papers**: Methodology, findings, implications

## 🚀 Quick Start

### Prerequisites
- **Ollama**: Download from [ollama.com](https://ollama.com)
- **Models**: Pull at least one LLM and embedding model

### Installation

```bash
# 1. Install Ollama
# Visit: https://ollama.com/download

# 2. Pull required models
ollama pull llama3.2:3b      # LLM for generation
ollama pull nomic-embed-text # Embeddings for RAG

# 3. Set CORS (one-time setup)
# Mac:
launchctl setenv OLLAMA_ORIGINS "*"
# Then restart Ollama

# Windows:
# Set environment variable OLLAMA_ORIGINS=* in System Properties

# Linux:
OLLAMA_ORIGINS="*" ollama serve
```

### Running know3

```bash
# Option 1: Python HTTP Server
python -m http.server 8000

# Option 2: Node.js HTTP Server
npx http-server -p 3000

# Option 3: Node Simple Server (included in .claude/launch.json)
node -e "require('http').createServer((req,res)=>require('fs').readFile('.'+(req.url==='/'?'/know3.html':req.url),(e,d)=>res.end(e?'404':d))).listen(5000)"
```

Then open: **http://localhost:5000** (or your chosen port)

## 📖 Usage Workflow

### 1️⃣ **Ingest Documents**
- Drag and drop PDF, DOCX, EPUB, TXT files
- Automatic chunking with configurable size (default: 800 chars)
- Preview and filter chunks before generation

### 2️⃣ **Configure Generation**
- Choose domain (affects prompts and question types)
- Select number of pairs per chunk (1-3)
- Customize model selection in Settings

### 3️⃣ **Generate Training Data**
- Click "Generate" to create instruction/output pairs
- Real-time progress tracking
- Quality review with filtering options

### 4️⃣ **Query with RAG** (Phase 2B)
- Have conversations with your documents
- Semantic search + retrieval-augmented generation
- Multi-turn context awareness
- Adjustable temperature and top-K results

### 5️⃣ **Load Custom Data** (Phase 2C)
- Upload your own JSON/JSONL files
- Automatic embedding and indexing
- Create custom collections for RAG queries

### 6️⃣ **Export & Use**
- Download in 5 formats (JSONL, JSON, Alpaca, ShareGPT, CSV)
- Ready for HuggingFace, Ollama, LLaMA, Mistral fine-tuning

## 🎛️ Settings Panel (Phase 2A)

Access via **⚙️** button in top bar:

### Models
- **LLM Model**: Choose any Ollama model for generation
- **Embedding Model**: Vector embeddings for semantic search

### RAG Settings
- **RAG Mode**: Search-only or Ask (with generation)
- **Temperature**: 0.1 (precise) to 1.0 (creative)
- **Top-K Results**: Number of chunks to retrieve (1-20)
- **Include Sources**: Display source citations

### Generation
- **Domain**: Content type for specialized prompts
- **Pairs Per Chunk**: Quality/speed tradeoff

### Advanced
- **Chunk Size**: Text splitting granularity
- **Collection Name**: Organize chunks by source
- **Clear Data**: Remove all indexed chunks

## 💬 RAG Conversation (Phase 2B)

Multi-turn conversation interface mimicking ChatGPT:
- **User Messages**: Right-aligned, blue background
- **Assistant Messages**: Left-aligned, accent background
- **Source Citations**: Automatic attribution to source documents
- **Context Window**: Last 3 messages used for follow-up questions
- **Persistent History**: Saved to localStorage, survives page reloads

## 📤 Custom Data Loading (Phase 2C)

Load your own data for RAG queries:

### Supported Formats
- **JSON**: Array or single object
- **JSONL**: One JSON object per line

### Example JSON
```json
[
  { "text": "Machine learning is...", "source": "wiki", "tags": ["ml"] },
  { "text": "Neural networks...", "source": "paper", "tags": ["ai"] }
]
```

### Example JSONL
```
{"text": "LLM definition...", "source": "doc1"}
{"text": "RAG explanation...", "source": "doc2"}
```

## 🏗️ Architecture

### Frontend
- Pure HTML/CSS/JavaScript (no build step)
- Responsive tab-based UI
- Real-time progress tracking
- localStorage persistence

### Vector Store
- In-memory collections (like Weaviate)
- Cosine similarity search
- Configurable top-K retrieval
- Metadata tracking per chunk

### Ollama Integration
- Streaming document generation
- Embeddings API for semantic search
- Configurable temperature & model selection
- Error handling with user feedback

## 📊 File Structure

```
know3.html              # Complete single-file application
├─ HTML (UI Components)
│  ├─ Header/Top Bar
│  ├─ Tab Navigation (Ingest, Generate, Export, Tools)
│  ├─ Settings Drawer
│  ├─ Modals (Tutorial, Help, About)
│  ├─ RAG Conversation
│  └─ Custom Data Loader
├─ CSS (Styling & Animations)
│  ├─ Theme Variables
│  ├─ Component Styles
│  ├─ Responsive Design
│  └─ Dark Mode Support
└─ JavaScript
   ├─ Global Scope (Modals, Settings, Initialization)
   └─ Module Scope (Core Logic)
      ├─ Vector Store Operations
      ├─ Ollama API Calls
      ├─ Document Processing
      ├─ Training Pair Generation
      ├─ RAG Conversation
      ├─ Custom Data Loading
      └─ Export Functions
```

## 🔌 Ollama Models

### Recommended LLMs
```bash
ollama pull llama3.2:3b        # Fast, good for training data
ollama pull mistral:7b         # Higher quality, slower
ollama pull phi:2.7b           # Compact, good accuracy
```

### Recommended Embedding Models
```bash
ollama pull nomic-embed-text   # Best free embedding model
ollama pull all-minilm:22m     # Lightweight alternative
```

## 📈 Performance Tips

- **Chunk Size**: Smaller = more pairs, faster; Larger = higher quality
- **Pairs Per Chunk**: 1-2 for speed, 3 for quality
- **Domain Selection**: Improves pair relevance significantly
- **Temperature**: Lower (0.1-0.3) for consistency, higher (0.7-1.0) for variety
- **Top-K**: 3-5 for faster RAG, 10+ for comprehensive context

## ⚡ Limitations & Known Issues

- **Single Page**: All data in-memory (browser memory limited)
- **Large Documents**: May need chunking; max 1GB per file
- **Model Size**: Limited by available RAM on your system
- **Ollama Required**: No online/cloud fallback currently
- **CORS**: Must configure Ollama CORS for browser access

## 🛠️ Development

### Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Ollama (local LLM inference)
- **Storage**: Browser localStorage + in-memory vector store
- **Build**: No build step required (pure browser app)

### Key JavaScript Features
- ES6 modules
- Async/await for API calls
- localStorage for persistence
- Cosine similarity for vector search
- Real-time progress tracking

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- [ ] Support for additional file formats (Word, PowerPoint, Images)
- [ ] Streaming progress indicators for large documents
- [ ] Advanced filtering and quality metrics
- [ ] Model comparison tools
- [ ] Batch processing
- [ ] API server for programmatic access

## 📚 Resources

- [Ollama Documentation](https://ollama.com)
- [HuggingFace Model Hub](https://huggingface.co/models)
- [RAG Papers & Research](https://arxiv.org/search/?query=retrieval+augmented+generation)
- [LLM Fine-tuning Guide](https://huggingface.co/docs/transformers/training)

## 🐛 Troubleshooting

### "Connecting to Ollama..." stuck
- Verify Ollama is running: `ollama list`
- Check CORS is configured (see Quick Start)
- Ensure port 11434 is not blocked

### Models not loading
- Pull models: `ollama pull llama3.2:3b`
- Check Ollama is running: `ollama serve`
- Verify model names in know3 UI

### Out of memory
- Use smaller models: `phi:2.7b` instead of `mistral:7b`
- Reduce chunk size
- Clear data between runs
- Close other applications

### Slow generation
- Use smaller/faster model (phi, llama-7b)
- Reduce pairs per chunk to 1
- Increase chunk size (fewer, larger chunks)

## 📞 Support

Issues, questions, or feature requests?
- Open an issue on GitHub
- Check existing issues first
- Include: OS, Ollama version, model names, file types tested

---

**Made with ❤️ for the open-source community**

Built to demonstrate the power of local, private, offline machine learning.
