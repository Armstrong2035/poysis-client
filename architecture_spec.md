# Poysis Canvas Architecture Specification

## 1. Core Philosophy

The Poysis Canvas operates on a **Headless Dataflow Architecture**, distinguishing itself from traditional UI-first web builders (like Bubble or Webflow). 

It is designed to feel like a "smart document" (e.g., Notion or Obsidian) to the end-user while functioning as a localized Directed Acyclic Graph (DAG) under the hood. 

The architecture strictly separates **Compute Logic** (how an AI process executes) from **Presentation** (how data is displayed and gathered). This prevents the "blank canvas problem" and enables users to easily compose robust AI applications.

---

## 2. Integrated Flow Blocks

The Poysis Canvas uses a cohesive component-based flow. Rather than strictly decoupling invisible logic nodes from manual UI widgets on the canvas, each module (e.g., a Retrieval Engine) acts as an integrated pipeline encapsulating its entire lifecycle:

1. **Data Source** (The "Where from"): The index or inputs feeding the block (e.g., Workspace Library, User-generated File Uploader).
2. **Query Interface** (The "How"): What user interface component represents the input for this block (e.g., Chat, Search Bar, or Static parameters).
3. **Output Form** (The "What's next"): How the emitted data is handled. This can be bound to visual layouts (e.g., Looped Chat stream, Fixed Source Grid) or strictly passed downstream to another Agent.

The "App Composer" preview automatically tracks these active blocks and vertically stacks their UI representations, creating a dynamic, visual frontend builder experience.

---

## 3. The Configuration Triad

A Compute Block is defined by three rulesets established by the Notebook Creator:

### I. State Settings (The "What")
The static configuration rules for the engine.
*   *Example:* `min_score = 0.65`, `pinecone_namespace = "workspace-123"`.

### II. Data Bindings (The "Where" and "What")
Blocks act as transform nodes. The Creator must define both where the block gets its data (Inputs) and what the engine is restricted to returning (Outputs).

**1. Input Resolvers (Data In)**
Inputs can originate from three places:
1.  `user_generated`: Bound to a specific UI Component (e.g., read `query` from `ChatInput_1.value`).
2.  `dynamic`: Bound to the output of an upstream Compute Block (e.g., read `query` from `PDFAnalyzer_1.extracted_text`).
3.  `static_default`: Hardcoded by the Creator during configuration (e.g., `query: "Summarize this year's legal changes"`).

**2. Output Definitions (Data Out)**
Outputs are not just "whatever the API returns". The Creator configures *how* the AI shapes its data so the UI or downstream blocks can consume it predictably:
1.  `raw_generated`: Unconstrained, natural language from the underlying LLM/engine (Standard conversational stream).
2.  `rules_constrained`: The Creator enforces a strict shape or instruction on the output. (e.g., "AI must return a JSON array of key concepts", or "AI must translate the final answer to Spanish before emitting").

### III. Triggers (The "When")
Blocks do not execute automatically based on data changes (which prevents infinite reactive loops). Execution is governed by explicit events defined by the Creator:
*   **Manual Trigger:** Bound to a UI component event (e.g., `On ChatInput Submit -> Run RetrievalBlock_1`).
*   **Lifecycle Trigger:** Runs automatically on environment changes (e.g., `On Page Load -> Run ClusteringBlock_1`).
*   **Chained Trigger:** webhook-style execution upon completion of another block (e.g., `On RetrievalBlock_1 Complete -> Run SentimentBlock_1`).

---

## 4. The Central State Bus

To facilitate the decoupling of UI and Compute, the Notebook relies on a centralized Reactive Store (e.g., Zustand). 

When a UI element undergoes a state change (a user types a query), it updates the central store. The Compute Block reads the query from the store upon trigger, executes its API call, and writes its output stream back to the central store. Listening UI components reactively re-render to display the new data.

```json
{
  "compute_blocks": {
    "retrieval_1": {
      "status": "streaming",
      "inputs": { "query": "What is the ONE thing?" },
      "outputs": {
        "text_stream": "The ONE thing is a concept...",
        "citations": [ { "file": "book.pdf", "score": 0.89 } ]
      }
    }
  },
  "ui_components": {
    "chat_input_id": {
      "writes_to": "compute_blocks.retrieval_1.inputs.query"
    },
    "stream_panel_id": {
      "reads_from": "compute_blocks.retrieval_1.outputs.text_stream"
    }
  }
}
```

---

## 5. Templates & The User Experience

To circumvent the cognitive load of manual node wiring, Poysis utilizes **Templates**. 

When a user creates a new notebook, they do not start with a blank canvas. They select a template (e.g., "Knowledge Q&A" or "Data Extractor"). The system automatically provisions the correct Compute Blocks and UI Components and wires their Data Bindings and Triggers invisibly. 

The user simply experiences a functional, Opinionated Application matching their desired workflow, with the option to drill down into the configuration layer if custom logic is required.
