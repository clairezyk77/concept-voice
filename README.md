# Concept Voice

Navigate the space of ideas.

**Concept Voice** is an interactive concept navigation system. Instead of "learning" knowledge, you explore relationships between concepts across domains — tracing paths, discovering structures, and building your own mental map.

## Live Demo

[https://concept-voice.vercel.app/](https://concept-voice.vercel.app/)

## How It Works

### 1. Entry — Start Exploring
Enter a question, topic, or discipline. The system matches concepts from its knowledge pool using keyword relevance scoring and domain detection.

### 2. Concept Space — Navigate Relations
Each concept sits at the center of a ring of related concepts. Click a neighbor to navigate there, or use the action buttons to:
- **Activate** — save a concept to your exploration trail
- **Expand** — surface deeper, more distant connections
- **Refresh** — shuffle the ring for new perspectives
- **Pin** — keep a concept visible

### 3. Structures — Emergent Patterns
When you activate concepts across different domains, the system detects emerging structures — patterns that bridge fields. These are surfaced as synthetic knowledge structures.

### 4. Import Domain — Bring Your Own Field
Missing a domain? Use the Import Domain feature:
1. Enter a domain name (e.g. "Quantum Computing")
2. Copy the generated prompt
3. Send it to any AI
4. Paste the returned JSON — the system validates and imports it, automatically creating cross-domain bridge relations.

### 5. Knowledge & Output
- **Knowledge Page** — view your activation history, connections, and exploration paths
- **Output Page** — export your synthesized knowledge structures

## Tech Stack

- **React 19** + **TypeScript**
- **Vite 8** — build tool
- **Tailwind CSS v4** — styling
- **React Router v7** — routing
- **React Context** — state management
- **localStorage** — data persistence
- **Rule Engine** — all concept recommendations, relations, and structure detection are powered by deterministic rules, not AI (except optional domain import)

## Project Structure

```
src/
├── engine/            # Core logic (pure functions)
│   ├── conceptGrammar.ts     # 6 relation types
│   ├── densityEngine.ts      # Density-controlled recommendations
│   ├── recommendation.ts     # Neighbor recommendation engine
│   ├── structureDetection.ts # Cross-domain structure detection
│   └── entryGenerator.ts     # Entry point search
├── store/             # React Context state
├── components/
│   ├── space/         # Concept graph, ring, node, actions
│   ├── entry/         # Import domain modal
│   ├── knowledge/     # Activation map, connection graph
│   ├── structures/    # Structure cards
│   ├── output/        # Export panel
│   └── ui/            # Shared UI components
├── pages/             # Route pages
├── hooks/             # Custom React hooks
├── types/             # TypeScript type definitions
└── layout/            # Main layout + sidebar
```

## Local Development

```bash
git clone <repo-url>
cd concept-voice
npm install
npm run dev
```

Opens at `http://localhost:5173` (or the next available port).

### Build

```bash
npm run build
npm run preview   # preview the production build
```

## Philosophy

This project is built on a simple idea: **understanding is navigation.** Instead of consuming information linearly, you move through a network of ideas — zooming in and out, making connections, and letting structures emerge from your own exploration patterns.

The system never tells you what to learn. It shows you what's connected and lets you choose your path.
