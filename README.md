# MailCraft AI — Professional Email Generator

> Transform basic inputs (recipient, topic, tone, key points) into fully drafted, tone-calibrated professional emails with structured sections, real-time preview, and export options.

![Version](https://img.shields.io/badge/version-2.5-6366F1)
![License](https://img.shields.io/badge/license-MIT-10B981)
![Platform](https://img.shields.io/badge/platform-Web-06B6D4)

---

## ✨ Features

### Template Generation
- **Structured Output**: Every email is generated with clearly formatted sections:
  - **Subject Line** (with 3 alternative suggestions)
  - **Salutation / Greeting** (formality-matched)
  - **Opening Hook & Context** (purpose-adapted)
  - **Body & Key Points** (prose or bullet format)
  - **Call to Action** (specific next steps)
  - **Sign-off & Signature** (tone-calibrated)

### Control Inputs
- **6 Tone Modes**: Formal & Executive, Polite & Warm, Concise & Direct, Persuasive & Value-Driven, Urgent & Time-Sensitive, Casual & Friendly
- **8 Email Categories**: Meeting Request, Project Update, Follow-Up, Thank You, Issue Apology, Cold Outreach, Job Application, Resignation Notice
- **Detail Level Control**: Brief, Standard, or Comprehensive output length
- **Bullet/Prose Toggle**: Choose structured bullet points or flowing narrative
- **Key Points Builder**: Add, edit, reorder, or auto-suggest agenda items
- **CTA Options**: Schedule Call, Review Document, Confirm Receipt, FYI Only, or Custom
- **Timeframe Input**: Specify deadlines for contextual urgency

### AI Engine
- **Built-in Heuristic Engine**: Works instantly offline — zero latency, no API key required
- **Optional Google Gemini Integration**: Connect your API key for live cloud LLM generation with automatic fallback
- **Quick AI Polish**: One-click rewrites — More Concise, More Polite, More Formal, Format as Bullets

### Export & Actions
- **Copy to Clipboard** with confetti celebration
- **Open in Email Client** via `mailto:` link (Outlook, Apple Mail, Gmail)
- **Download as .EML** (importable into any email client)
- **Download as Markdown (.md)**
- **Download as Plain Text (.txt)**

### User Experience
- **6 Pre-built Scenario Presets** for instant demonstration
- **3 Preview Modes**: Email Client Simulator, Structured Sections Breakdown, Raw Markdown
- **Dark / Light Theme Toggle** with persistent preference
- **Draft History**: Auto-saves last 20 drafts with restore capability
- **Live Metrics Dashboard**: Word count, reading time, tone label, formality index
- **Fully Editable Preview**: Click any section to edit directly inline

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v20+ 
- **npm** v10+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd email

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173/`

### Production Build

```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
email/
├── index.html              # Main HTML entry point (semantic, accessible)
├── package.json            # Project configuration
├── src/
│   ├── main.js             # App controller (events, state, UI sync)
│   ├── emailGenerator.js   # Email synthesis engine (sections, tone, rewrites)
│   ├── geminiApi.js        # Google Gemini API client (optional LLM)
│   ├── presets.js           # Preset scenarios & tone definitions
│   └── style.css           # Design system (glassmorphism, dark/light themes)
└── dist/                   # Production build output
```

---

## 🧠 How the AI Engine Works

### Built-in Heuristic Synthesis (Default)
The app ships with a powerful offline generation engine that:
1. Selects appropriate salutation format based on recipient title and tone
2. Generates contextual opening paragraphs matched to purpose × tone combinations
3. Weaves user key points into coherent body paragraphs (bulleted or prose)
4. Produces purpose-specific calls to action with timeframe integration
5. Applies tone-calibrated sign-offs and formatting

### Google Gemini Integration (Optional)
When an API key is provided:
1. Constructs a structured prompt with all user parameters
2. Sends to Gemini API with `responseMimeType: 'application/json'` for reliable parsing
3. Falls back to built-in engine automatically on any failure
4. Temperature is adjusted by tone (0.3 for formal/concise, 0.7 for creative tones)

---

## 🎨 Design System

- **Typography**: Plus Jakarta Sans (UI) + JetBrains Mono (code/metrics)
- **Theme**: Deep Obsidian dark theme with optional Light mode
- **Effects**: Glassmorphism cards, animated ambient glow orbs, shimmer CTA button
- **Responsive**: Full mobile-friendly layout with collapsing 2-column grid

---

## 🔧 Configuration

### Gemini API Key (Optional)
1. Click the ⚙️ Settings gear icon in the header
2. Enter your Google Gemini API key
3. Click "Save Settings"
4. Your key is stored in `localStorage` — never transmitted to external servers

---

## 📝 License

MIT License — free for personal and commercial use.
