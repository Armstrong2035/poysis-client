# Poysis Commerce & AI Canvas Roadmap

## 1. Product Scout Migration Strategy
**Objective:** Seamlessly migrate existing Shopify merchants using "Product Scout" over to the new Poysis platform, demonstrating the platform's extensible power without overwhelming them.

### Action Items
- [ ] **Create "Product Scout" Native Templates:** Add predefined templates on the `/workspace` dashboard specifically for the Product Scout use-case.
- [ ] **Pre-configured Canvas Layouts:** When a user selects a Product Scout template, the Notebook/Canvas should boot up with the exact existing feature set already pre-wired (e.g., Semantic Search Input bound to a Retrieval Engine and Product Catalog Source).
- [ ] **Extensibility Flow:** Ensure that while the template ships with the core Product Scout features, the canvas remains unlocked. This allows merchants to discover the "+ Add Engine" / "+ Add Interface" buttons and dynamically upgrade their copilot with new Poysis capabilities (like Classifiers or Check-out Streams) if they want to.

## 2. UX Paradigm Exploration (Ongoing)
**Objective:** Finalize the mental model for how non-technical merchants build copilots.

### The Two Paradigms (To be decided):
- **Logic-Driven Flow (Current Canvas):** The creator drops a strictly invisible backend "Engine" (e.g. Retrieval Block) first, and then binds "Data" and "UI Interactions" into that pipe. 
- **Interface-Driven Flow (Proposed Alternative):** The creator drops a visual "UI component" (e.g. Search Bar) onto the screen first, and then opens a settings panel to wire up backend "Engines" to power it.

## 3. Backend Integration (Next Steps)
- [ ] Replace mock `executeBlock` DAG logic in `useNotebookStore` with active REST/WebSocket calls to the Poysis Worker tier.
- [ ] Wire up real file ingestions (FileUploader -> LlamaParse pipeline).
- [ ] Implement database persistence for Canvas States (saving/loading templates).

## 4. Specialized Intelligence Blocks (V2)
- [ ] **Diagnosis Block:** A guided conversation engine using an empath/doctor model. Designed to arrive at the core of a user's intent through clinical-style discovery.
  - **Use Cases:** Guided onboarding, complex triage, needs-assessment for high-ticket commerce.
  - **UI:** Multi-turn chat with structured "Discovery Progress" indicators.
