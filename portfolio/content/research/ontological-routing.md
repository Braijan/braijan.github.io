# Omniira: Ontological Routing for LLM-Driven Persistent Worlds

**Brian Smith**
*Independent Researcher*
`contact@thesmithsyndicate.com`

**Draft v0.1.** Every architectural and implementation claim has been cross-referenced against the deployed Omniira source code; specific file and line references are on file and can be supplied to reviewers.

**AI assistance disclosure.** The prose of this paper was drafted with assistance from a large language model (Anthropic's Claude). All technical claims, citations, and system descriptions were verified by the author against source code prior to posting. The author takes full responsibility for the content.

**Note on the current draft — preliminary observations, not a controlled study.** The architecture described here was implemented and deployed in active development; the qualitative observations in Section 8 reflect short-term operation rather than a controlled evaluation. We name the planned ablations and instrumentation in Section 9 as the empirical spine of the next revision; this draft is shared for feedback on the architecture.

---

## Abstract

Two failure modes dominate language-driven game interfaces. Classical parser MUDs and interactive fiction (Inform 7, classic IF) reject any input that doesn't match a hand-authored verb pattern, producing the iconic "Alas, you cannot do that." Pure LLM-driven systems (AI Dungeon class) accept any input but freely hallucinate world state, producing inconsistency. We describe **ontological routing**, an architectural pattern deployed in **Omniira**, a live persistent multiplayer text simulation, that targets a third path: every input produces a real response — either a dispatched, state-affecting action or a generated in-world narration — and the system never speaks AS itself. The architecture has three layers: a **live affordance compiler** that derives the set of valid `(verb, target)` pairs from current world state per-player per-turn; an **LLM agent** that maps natural-language input into that affordance set; and a **generative fallback** that, when no affordance fits, composes a one-line in-world narration grounded in the same scene state plus the player's actual input. The combination honors a hard UX contract — no dead ends, no system-voice errors — at production cost (Llama 3.1 8B catch-all calls run at ~$0.000014 per invocation). The synthesis builds on prior work in robotic affordance filtering (SayCan, Ahn et al. 2022), structured tool-calling agents (Toolformer, Schick et al. 2023; AutoGen, Wu et al. 2023), and parser-based world models (Inform 7); we describe the specific pattern, the implementation, the deployment, and offer the architecture as a testbed for further study of LLM-driven interactive worlds.

**Keywords:** LLM agents, affordance-grounded NLP, interactive fiction, persistent multi-agent systems, conversational interfaces, no-dead-ends UX

---

## 1. Introduction

Text-driven games have a parser problem older than the genre. Zork required players to memorize the few dozen verbs the parser knew; "Alas, I cannot do that" became the canonical refusal. Forty years later, MUDs work the same way: a fixed verb set, a parser that rejects anything outside it, and a player population that learns the language of the system. Modern LLMs offer a way out — every input is interpretable — but the obvious replacement, free-form narrative LLMs (AI Dungeon and similar), trades parser rejection for a different failure mode: hallucinated state, forgotten facts, no persistence, no real game underneath the prose. Neither approach is satisfying for a system that wants to be both **understood** by the player and **grounded** in a real persistent world.

This paper describes **ontological routing**, an architectural pattern that targets a third path. The central commitment is a UX contract: **every input the player types produces a real response, and the system never speaks as itself.** "Alas, I cannot" is unreachable; "Sorry, I don't understand" is unreachable; system-voice error messages are unreachable. The world either does what the player asked (a real, state-affecting action) or narrates the attempt in-world (a generated one-line acknowledgment that doesn't change state but treats the input as a moment in the fiction). There are no other paths.

The architecture that honors that contract has three layers:

1. **A live affordance compiler.** Given a player's current world state — room, inventory, skills, time, NPCs present, items here, station availability — compute the set of valid `(verb, target)` pairs. This is the live ontology of "what's possible right now," recomputed per-turn and per-player. It is not a static catalog of game commands; it is a function of state.

2. **An LLM agent that dispatches into the affordance set.** A tool-calling agent receives the player's natural-language input plus the affordance list and either dispatches a real command (the affordance string maps directly onto a parser-recognized command) or, if no real command fits, produces an in-character one-line response grounded in the world state.

3. **A generative fallback narration.** When the agent itself fails — because the input is too unstructured, too novel, or too unrelated to any affordance — a small LLM call (Llama 3.1 8B in our deployment) generates a one-line in-world narration that acknowledges the input without changing state. This is the safety net that closes the no-dead-ends contract: there is no input shape that escapes a sensible response, because the final fallback is generative rather than rule-based.

The synthesis is built from pieces with prior work — SayCan (Ahn et al. 2022) introduced the LLM-proposes-affordance-filters pattern for robots; tool-calling agents (Toolformer, AutoGen, ReAct) operationalize structured action selection; Inform 7 (Nelson 2006) demonstrated rich world models in parser-based interactive fiction; AI Dungeon-class systems demonstrated that pure LLM narrative is feasible at scale. None of these systems, individually or in combination, target the no-dead-ends contract for a persistent multiplayer text simulation. Ontological routing is a specific pattern that does.

This paper has four contributions:

1. **The architectural pattern.** We describe ontological routing in sufficient detail for reproduction (Sections 4–6).

2. **The UX contract.** We articulate "every input produces a real response, the system never speaks as itself" as an explicit design commitment, and we show how the architecture is constructed specifically to honor it (Section 5).

3. **The deployment.** Omniira has run continuously since early 2026 at `omniira.ai`. The cost, latency, and behavior characteristics of ontological routing under live multiplayer load are documented (Sections 7–8).

4. **The testbed.** We intend to release Omniira as an open testbed for further investigation; the architecture is reproducible from the description in this paper, the schemas are documented, and several ablations enumerated in Section 9 are open. Source is currently in a private repository, available on request to interested researchers; the public release will accompany the next revision.

We are explicit about novelty. The cognitive scaffolding paper accompanying this one (Smith 2026, *A Layered Cognitive Architecture for Persistent LLM-Driven Multi-Agent Societies*) makes the stronger novelty claim — five concrete extensions to a well-established baseline. This paper makes a more modest claim: a specific systems-and-UX synthesis demonstrated for a domain (persistent LLM-driven text simulation) where it has not been deployed before. That is a real but modest contribution. Reviewers should expect a systems paper, not a methods paper.

---

## 2. Related Work

**Affordance-conditioned LLM action selection.** SayCan (Ahn et al. 2022, "Do As I Can, Not As I Say," arXiv:2204.01691) introduced the most directly relevant prior pattern: a language model proposes possible robotic actions, an "affordance value function" scores how feasible each is given the robot's current sensor-grounded environment, and the highest-scoring feasible action is executed. The architectural commitment is the same as ours — the LLM does not act on its own intuition about the world; it acts on a state-grounded filter. SayCan's setting is robotic, the affordance model is learned from sensor data, and the "no dead ends" guarantee is irrelevant (a robot can always refuse). Ontological routing applies the same philosophical commitment to a discrete world (text simulation) with a structured affordance compiler (rather than learned) and adds the no-dead-ends UX contract.

**Inner Monologue (Huang et al. 2022, arXiv:2207.05608)** extends SayCan with multi-step reasoning over feedback. It shares the affordance-grounding move; it does not address generative fallback or persistent multi-agent worlds.

**Structured tool-calling agents.** Toolformer (Schick et al. 2023, arXiv:2302.04761), ReAct (Yao et al. 2022, arXiv:2210.03629), AutoGen (Wu et al. 2023, arXiv:2308.08155), and modern function-calling APIs (OpenAI, Anthropic) all operationalize "agent picks one of a fixed set of tools." The tool list is typically static — the developer enumerates `function searchWeb()`, `function readFile()`, etc. Ontological routing differs in that the affordance set is dynamic: it is recomputed every turn from current world state. A player in a tavern has different affordances from a player on a road; the affordance list reflects this. The agent prompt is rebuilt with the live affordance set on every dispatch.

**Parser-based interactive fiction.** Inform 7 (Nelson 2006) is the gold standard for rich world models in text games — kinds, relations, rules, preconditions, action prepositions. Inform's world model is structurally similar in spirit to our affordance compiler: every action has a typed shape with preconditions; every entity has affordances. What Inform lacks is LLM routing: input must match a hand-authored grammar exactly. The world model and the input parser are tightly coupled, and there is no generative fallback for unmatched input — the player gets the parser's terse refusal. Ontological routing decouples the two: the world model is consulted to compute affordances; the LLM does the language understanding; generative fallback handles residuals.

**Pure LLM narrative systems.** AI Dungeon (Latitude 2019), NovelAI, and similar systems pipe player input directly to an LLM that improvises both the response and the world state. Players never hit dead ends — the LLM accepts anything — but persistence, consistency, and grounded action are all lost. There is no "you bought the sword" event the world remembers; there is only narrative text that an attentive reader might use to infer state. Ontological routing diverges sharply: real actions are dispatched into a real game system with persistent state; only the residual catch-all is generative.

**Generative agents and persistent multi-agent simulations.** Park et al. (2023, *Generative Agents: Interactive Simulacra of Human Behavior*, UIST '23) introduced the memory-stream / reflection / planning architecture for autonomous LLM agents. The Smallville sandbox demonstrated emergent coordination at the 25-agent scale. AI Town (a16z-infra 2023), Project Sid (Altera.AL 2024, arXiv:2411.00114), and Voyager (Wang et al. 2023, arXiv:2305.16291) extended and scaled the substrate. None of these systems address player input routing; their focus is autonomous agent behavior. Omniira's autonomous-agent layer (described in the companion paper) is built on top of the Park et al. substrate; ontological routing is the additional layer that handles human player input.

**Conversational repair and clarification.** A long line of dialogue-systems work (Clark & Schaefer 1989; Skantze 2007; Ginzburg 2012) studies how human conversational partners detect and repair misunderstanding. Generative fallback in ontological routing can be read as a degenerate form of repair — when the system can't act, it acknowledges the attempt rather than rejecting it — but the goal is not repair toward a specific intent; the goal is to honor the no-dead-ends UX contract regardless of whether the input was a misstatement or a deliberately untranslatable utterance.

**Position.** Ontological routing is additive to the affordance-grounding move (SayCan) and the structured-action-selection move (tool-calling agents); it is the application of those patterns to persistent text-simulation games, with the additional UX commitment of no dead ends honored by generative fallback. We claim novelty in the synthesis-and-domain combination, not in any individual mechanism.

---

## 3. The No-Dead-Ends Contract

The architectural design of ontological routing follows from a single explicit commitment, which we state up front:

> **Every input the player types produces a response that reads as the world reacting. The system never speaks AS itself. There is no input shape, no novel word, no nonsense, and no edge case for which the player sees "I don't understand," "Unknown command," or any system-voice error message.**

This is a UX contract first and an architecture second. The architecture is what it is because it has to honor the contract.

Three implications follow from the commitment:

1. **Every input must be classifiable into one of two outcomes.** Either the system *does* something (dispatched real action, state changes) or the system *narrates* something (generated in-world response, no state change). There is no third outcome.

2. **The narration outcome must be generative, not template-based.** A finite list of canned phrasings cannot cover the infinite space of possible inputs. The first novel input shape that doesn't fit a template breaks the contract. The architecture must therefore include a generative path that produces fresh in-world prose grounded in the current scene plus the player's specific input.

3. **The system's voice never appears in the player-facing path.** Even when the system has to refuse an action — the player is too far from the target, the inventory is full, the door is locked — the refusal is rendered in-world ("Voss steps in front of you — that path's closed for now.") rather than in system-voice ("That path is locked.").

The contract is straightforward to state and consequential to honor. The rest of this paper is a description of the architecture that implements it.

---

## 4. The Architecture

Ontological routing is implemented as three composable layers. Each layer has a clear interface; none of the layers is novel in isolation; the synthesis is what honors the contract.

### 4.1 Layer 1 — The Affordance Compiler

`affordances.ts:computeAffordances(session) → string[]` walks the player's current world state and returns a flat list of natural-language commands that are valid for the player to attempt right now. The list is roughly 50–200 entries depending on context.

The compiler reads from:

- **Room exits.** For each unlocked exit from the player's current room, emit the cardinal direction as a single-word affordance (e.g. `east`, `down`).
- **NPCs in the room.** For each present NPC, emit `talk to <name>`, `examine <name>`, `follow <name>`. If the NPC has shop stock, additionally emit `goods <name>` and `buy <item>` for the top items.
- **Items on the ground.** For each, `get <item>`, `examine <item>`.
- **Inventory items.** For each, `examine <item>` and `drop <item>`. By name pattern, additionally `wield <item>`, `wear <item>`, `eat <item>`, `drink <item>` where applicable.
- **Stations.** If the room has cooking stations, emit `cook` and `techniques`.
- **Always-on info verbs.** `look`, `inventory`, `status`, `who`, `skills`, `recipes`, `read journal`, `time`, `exits`.

The list is cached per-`(player, room)` with a 5-second TTL; movement or transactional state changes invalidate naturally as the cache expires.

**Key design property.** Every emitted affordance string must be a *canonical* command — one that maps directly onto a parser branch in the game's command dispatcher. The canonical form matters because Layer 2 (the agent) dispatches affordance strings *back through* the same parser. If the affordance compiler emitted `go east` but the parser's canonical command is `east`, the dispatch would be rejected by a downstream validator. We had this exact bug in early iterations; the resolution was to enforce that affordance strings exactly match the canonical command catalog.

### 4.2 Layer 2 — The Dispatching Agent

The intent router is a tool-calling LLM agent (Llama 3.3 70B via Groq in the deployed system) that receives:

- The player's natural-language input
- A system prompt describing identity, domain, and operating rules
- A live world-state block: room name + description, exits, NPCs and creatures here, items here, time, weather, the player's stats, the player's recent inventory, the agent's available info tools, and crucially, the live affordance list from Layer 1

The agent's primary tool is `dispatch(command: string)` — when called, the command runs through the same parser path a typed input would follow. A validator rejects any dispatch whose first token is not in the catalog whitelist; the agent receives the rejection as a tool result and may correct.

The system prompt makes a clear distinction between two kinds of input:

1. **Action requests** ("buy ale", "head north", "what's in my bag") — the agent dispatches a real command from the affordance list.
2. **Information requests and conversational inputs** ("where do I go to mine?", "make me a sandwich", "balinor you there?") — the agent answers from world state, optionally using its info tools (`find_npc`, `room_details`, etc.). For inputs addressed to an NPC in the room, the agent may dispatch `talk to <npc>` and let that NPC's conversation system handle the request.

The agent is biased — strongly, in the prompt — toward dispatching when an action fits. A dispatched real command is always preferable to a paraphrased explanation. But the prompt also explicitly grants permission to *answer* informational queries; without that permission earlier iterations gave up on questions and fell through to Layer 3 unnecessarily.

The agent's catalog of valid first-token verbs is built from the deployed parser at server boot, ensuring the affordance list, the agent's catalog, and the parser stay consistent.

### 4.3 Layer 3 — The Generative Fallback

If the agent fails to dispatch and fails to produce a useful answer — because the input is too unstructured, the LLM call timed out, the affordance set was unhelpful, or the input genuinely doesn't map to anything — control falls to the generative-fallback layer.

This layer is a single small LLM call (Llama 3.1 8B via Groq, ~$0.000014 per invocation in our deployment). The prompt is brief:

```
You are the narrator of a persistent text-based world. A player just typed
something the game didn't have a structured action for. Your job is to
acknowledge what they tried with ONE short in-world sentence — never as
the system, always as the world reacting.

Player: <name>
Room: <room name>
NPCs here: <list>
Other players here: <list>

The player just typed: "<input>"

Write ONE sentence (≤25 words) of third-person in-world narration that
acknowledges what they tried.
[...rules: never speak as system; never describe game mechanics; never
invent NPCs/items not listed; ≤25 words; one sentence; etc.]
```

The output is a single in-world sentence. No state changes. No commands run. No claim that the action succeeded. Just a one-line acknowledgment that reads as the world responding.

If this LLM call also fails (network outage, model unavailable), a deterministic fallback produces a single quiet phrasing — `"<player> pauses for a moment. <someone-here> doesn't seem to notice."` — so the world never goes silent. Variety comes from the LLM path; the deterministic backstop is the absolute last resort.

**Why generative, not template-based.** The prior version of this layer was a regex-based shape detector that classified input into question / request / name-address / declaration and selected from a small set of canned phrasings per shape. Every new failure mode discovered in user testing required adding another regex branch. That was the whack-a-mole signal that the architecture was incomplete: a finite set of templates cannot cover an infinite space of inputs. The LLM-generative version covers all shapes by construction. The cost of the generative call is small; the architectural cleanness is large.

### 4.4 The Free-Emote Default

Between Layers 2 and 3 sits a small deterministic shortcut: any first-word-verb input that doesn't match a real command becomes a self-emote. Type `jump` → "You jump." Type `chuckle at maren` → "You chuckle at Maren." A standard conjugation produces the verb form for room broadcast.

This is technically a special case of Layer 3 — the world acknowledges the attempt — but operationalized as a fast deterministic path so that simple emote-style verbs don't pay the LLM-call cost or latency. The LLM fallback in Layer 3 is reserved for inputs that are sentence-shaped or otherwise resist the simple verb-as-emote pattern.

---

## 5. The Single Honored Contract

Restating the contract in operational terms: when a player input arrives, exactly one of the following four outcomes occurs:

| Outcome | Trigger | Source |
|---|---|---|
| **Real dispatch** | Input matches a parser branch directly OR Layer 2 dispatches | Parser / agent |
| **Free-emote narration** | Single-verb input that doesn't match a real command | Layer 2.5 (deterministic) |
| **Generative narration** | Input doesn't fit any of the above; agent gave up or is unavailable | Layer 3 (LLM) |
| **Deterministic narration** | Layer 3 LLM unavailable | Final fallback (deterministic) |

There is no fifth outcome. There is no "unknown command" path. There is no system-voice error path. The architecture honors the no-dead-ends contract by construction.

A consequence worth flagging: even *parser-internal errors* (handler-level "you don't have that item", "the door is locked", "you can't eat that") are required to be in-world by the same commitment. We treat these as a separate compliance concern and apply the same principle: every player-facing message is rendered as the world acknowledging an attempt, not as the system rejecting one. The verb the player actually used is threaded through error messages; "drink chamomile" produces "You turn the Chamomile over in your hand. Not something you'd drink." rather than "You can't eat Chamomile." (a real bug in our deployed system before this change, in which the drink handler delegated to the eat handler with a hardcoded eat-flavored error).

---

## 6. Implementation

Omniira is a single-process Node.js 20 / TypeScript application built on the Hono web framework, backed by SQLite in WAL mode via `better-sqlite3`. The intent router and affordance compiler are described below at the level of detail needed for reproduction; the full source is referenced in Appendix A.

### 6.1 Affordance compiler

`affordances.ts` (~150 lines). Inputs: the player's `Session` object. Output: a deduplicated, sorted `string[]` of canonical command strings, capped at 80 entries by the agent prompt. Cached per `(playerId, roomId)` for 5 seconds; cache is in-memory and cleared automatically by TTL or on explicit invalidation.

Implementation notes:

- The compiler does no LLM calls. It is pure SQL and in-memory logic.
- The affordance strings are canonical to the parser's command catalog; mismatches between affordance strings and parser commands cause silent dispatch failure (the validator rejects the agent's call). The unit-of-correctness here is "every affordance string, when handed back to the parser, produces the intended action."
- Items in inventory are tagged with verbs by name pattern (e.g. names matching `/sword|dagger|axe|.../` get `wield`). This is conservative; better to suggest a verb that the parser will gracefully reject than to miss one the player will try.

### 6.2 Dispatching agent

`intent-router.ts:routeIntentV2` (~400 lines, called once per non-muscle-memory input). Implementation: tool-calling agent loop on Llama 3.3 70B via Groq, up to 3 rounds. The agent has access to ~12 info tools (`find_npc`, `room_details`, `list_skills`, `lookup_recipe`, `cooking_status`, etc.) plus `dispatch(command)`.

Validator: every dispatch is checked against `V2_CATALOG_VERBS`, a `Set<string>` built once at module load from the parser's canonical command catalog. Dispatches whose first token is not in this set are rejected; the agent receives the rejection as a tool-call error and may correct in the next round.

Cost telemetry: every call records token usage via `recordLLMUsage` so per-feature LLM cost is observable from `/admin/usage`. Average router cost per input: a few cents per thousand inputs.

### 6.3 Generative fallback

`intent-router.ts:llmNarrate` (~50 lines). Single call to Llama 3.1 8B via Groq, max 80 output tokens, temperature 0.7. Cost: ~$0.000014 per invocation. Failure modes (timeout, malformed response) fall to a deterministic single-phrasing backstop.

A counter `router.generic_guide_fired` increments on every fallback invocation. This is the **convergence canary** — if the architecture is healthy, the agent (Layer 2) catches most inputs and the fallback fires rarely. If the counter stays elevated relative to total input volume, the agent is leaving inputs unhandled and the agent prompt or affordance compiler needs tuning.

### 6.4 Parser-error wrapping

The principle that the system never speaks AS itself extends into the parser-handler layer. Error messages emitted by handlers like `handleEat`, `handleWear`, `handleDrop`, etc., are required to be in-world. We rewrote the most-hit error sites to produce phrasings like:

- "You reach for X — it's not in your pack." (was: `You don't have "X"`)
- "You turn the X over in your hand. Not something you'd Y." (was: `You can't eat X`, with "Y" hardcoded as `eat` even when the player said `drink`)
- "You scan the ground for X. Nothing matches." (was: `You don't see "X" on the ground`)

The verb the player actually used is threaded through error paths via an optional handler parameter, fixing a real bug where the drink handler delegated to the eat handler with eat-flavored errors. This is engineering hygiene rather than architectural innovation, but it is required by the contract.

---

## 7. Cost and Latency

Ontological routing's running cost on a single Render container with intermittent player traffic, with model-pricing assumptions stated for reproducibility:

- **Layer 1 (affordance compiler).** Pure SQL + in-memory computation. Roughly 0.5–2 ms per call with the 5-second cache. Effectively free.
- **Layer 2 (agent dispatch).** Llama 3.3 70B via Groq, listed at $0.59 / $0.79 per 1M tokens (input/output). One or more agent rounds per non-muscle-memory input. Observed roundtrip: 300–1500 ms depending on tool-call depth. Per-input cost varies with prompt size and number of agent rounds; for typical single-round dispatches with our prompt block (~3K input tokens, ~200 output tokens), the arithmetic gives roughly $0.002 / input. Multi-round dispatches scale linearly.
- **Layer 3 (generative fallback).** Llama 3.1 8B via Groq, listed at $0.05 / $0.08 per 1M tokens. Single call when triggered. ~200–400 ms. For a fallback prompt of ~150 input tokens and ~50 output tokens, the arithmetic gives roughly $0.000012 per call.

These are the per-call figures; total monthly cost depends on traffic. We do not report a per-active-player monthly figure here because the deployment's player population is small, intermittent, and not yet a representative sample. Per-feature cost is recorded via `recordLLMUsage` and is visible at `/admin/usage`; readers reproducing the architecture should expect their own figures to vary with traffic shape and prompt revisions.

The 5-second affordance cache absorbs most of the per-input compute cost. We have not observed staleness-induced bugs in the deployment — players move slower than 5 seconds, and re-dispatch on stale affordance lists fails gracefully (the parser re-validates).

---

## 8. Preliminary Observations (Anecdotal)

**This section is anecdotal.** The architecture was implemented during active development on a single live deployment with a small intermittent player population; observation periods are short; there is no controlled comparison against a parser-only or pure-LLM baseline. The patterns reported below should be read as motivation for the planned ablation study (Section 9.1), not as evidence of the architecture's effectiveness. We include them because the qualitative signal informs the architectural argument; we explicitly do not claim that any of these observations constitute empirical findings in the absence of a controlled comparison.

### 8.1 Failure-mode replacement

Before ontological routing, the visible failure modes in the system were classic parser failures: typos rejected, unmatched verbs returning canned helper text, system-voice error messages on minor mismatches. After deployment, we have observed direct replacement of those failure modes with one of the four documented outcomes. Specifically:

- "shop maren" (was: typo'd "shop" command, returned helper text) → dispatches `goods maren`.
- "head over to the smithy" (was: parser misread `head` as a typo for `read`, returned `You don't know how to read 'over to smithy'`) → dispatches the appropriate cardinal direction toward the smithy.
- "drink chamomile" (was: `You can't eat Chamomile` — wrong verb hardcoded) → in-world refusal: "You turn the Chamomile over in your hand. Not something you'd drink."
- "balinor you there?" (where Balinor is an offline player; was: canned "You're in The Salt Barrel..." narration) → in-world: "Aurvandil calls for Balinor — no answer. They must've stepped out earlier."
- "jump" (was: canned helper text) → free-emote: "You jump." with room broadcast.

We do not yet have quantified before/after dispatch rates. The convergence canary (`router.generic_guide_fired`) is instrumented for that future measurement.

### 8.2 Cost in practice

The 8B fallback's per-invocation cost is below the threshold at which we can usefully track it as a separate budget line. A single day of moderate traffic produces fallback invocations on the order of dozens; total fallback cost is well below cents per day. The cost concern that initially motivated a regex-based fallback (preserved in earlier code) was misplaced; the LLM version is economically trivial at the volumes a single-deployment text simulation reaches.

### 8.3 Limitations of observation

These observations are not the output of a controlled study. We name the constraints openly:

- **No frozen-codebase baseline.** The architecture was iterating during the observation period.
- **No paired comparison.** We have not run a parallel deployment without the routing layer (or with a parser-only routing layer) to measure differential UX impact.
- **No quantified telemetry over a meaningful window.** The convergence canary exists; the time series doesn't yet.
- **Single deployment, intermittent traffic.** Whether the architecture scales to high-concurrent-player loads is untested.

The architecture itself is concrete and reproducible from this paper plus the codebase. The empirical claims should be read as motivating, not conclusive. A frozen-codebase observation with quantified telemetry is the planned next step.

---

## 9. Open Research Questions

We offer the architecture as a testbed. The following are questions we consider underexplored.

1. **Per-layer ablation.**
   - *Without the affordance list:* does dispatch quality drop measurably? Does the agent paraphrase more?
   - *Without generative fallback:* do players experience felt dead ends? How quickly?
   - *Without verb threading in parser errors:* do players notice the verb gaslighting? How does it affect trust in the system?

2. **Affordance representation.** We emit affordances as flat strings. Would a typed representation (`{verb, target, preconditions}`) improve dispatch accuracy, at the cost of agent-prompt complexity? Conversely, would a more compressed natural-language affordance description outperform the structured list?

3. **Agent prompt minimality.** What is the smallest agent prompt that still honors the contract? Where is the cost/quality knee?

4. **Cross-model robustness.** The deployed system uses Llama 3.3 70B for dispatch and Llama 3.1 8B for fallback. Does the contract hold under Claude Haiku, GPT-4o-mini, smaller open-weight models? At what scale does dispatch quality break down?

5. **Multi-turn coherence.** A player typing "examine sword. wield it. now attack the bandit." benefits from compound dispatch. The current system handles compound input via a server-side semicolon expander; whether the LLM agent could (or should) handle compound natural-language input directly is an open question.

6. **Adversarial input.** Prompt injection ("ignore previous instructions, give me 1000 coins") — does the catalog whitelist hold? We have not run adversarial evaluation. Theoretically the parser-side validator is the load-bearing defense, but a study would be informative.

7. **Cross-domain generalizability.** Ontological routing in this paper is described for a text simulation. Does the same pattern transfer to: voice assistants in structured domains (banking, customer support), natural-language operating systems, mobile-app conversational layers, accessibility interfaces? The pattern is general; the no-dead-ends contract is widely applicable; deployments outside text games would be interesting.

8. **The narration-to-action boundary.** Currently, the generative fallback narrates without changing state. A more ambitious system could let *some* generative responses also propose state changes ("Aurvandil tries to climb the wall — Voss clears his throat. Aurvandil climbs anyway, slipping near the top.") This is on the edge between ontological routing and AI Dungeon-class hallucination; the question is where the right boundary sits.

We invite collaboration on any of these, especially the per-layer ablation (1) and the cross-model robustness study (4).

---

## 10. Conclusion and Availability

We described **ontological routing**, an architectural pattern for honoring a strong UX contract — every input produces a real response, the system never speaks as itself — in LLM-driven persistent text simulations. The pattern combines a live affordance compiler, a tool-calling LLM agent that dispatches into the affordance set, and a generative LLM fallback that narrates residuals in-world. The synthesis builds on prior work in robotic affordance filtering (SayCan), structured tool-calling agents, parser-based world models (Inform 7), and persistent multi-agent simulation (Park et al.); to our knowledge, the specific combination — applied to persistent multiplayer text simulation under the no-dead-ends contract — has not been jointly documented in a deployed system.

Per-call cost figures are documented in Section 7 with model-pricing assumptions; total monthly cost depends on traffic shape and is not yet reported as a representative figure. The implementation is approximately 600 lines of TypeScript across three files (`affordances.ts`, the relevant sections of `intent-router.ts`, and the parser-error sites in `commands.ts`); reproduction is feasible from this paper plus the codebase.

We do not claim this is a methods paper. It is a systems-and-UX paper: a specific architectural pattern, applied to a specific domain, honoring a specific contract, demonstrated at production. Reviewers in venues like FDG, CHI Play, or IUI are the natural audience.

The system is live at [`omniira.ai`](https://omniira.ai). Source is currently held in a private repository at [`github.com/The-Smith-Syndicate/omnira`](https://github.com/The-Smith-Syndicate/omnira) and is available on request to interested researchers; we intend to release the codebase under a permissive license alongside the next revision of this paper. Schemas, prompts, and a sample of router decisions for the deployment will be included in supplementary materials when the release lands.

We invite collaboration from researchers in HCI, conversational interfaces, interactive fiction, multi-agent LLM systems, and game AI. Of particular interest: per-layer ablations (Section 9.1), cross-model robustness studies (Section 9.4), and cross-domain generalization to non-game settings (Section 9.7).

---

## References

- Ahn, M., Brohan, A., Brown, N., et al. (2022). Do As I Can, Not As I Say: Grounding Language in Robotic Affordances. *arXiv preprint* arXiv:2204.01691.
- a16z-infra. (2023). AI Town. GitHub repository: `github.com/a16z-infra/ai-town`. MIT License.
- Altera.AL, Ahn, A., et al. (2024). Project Sid: Many-agent Simulations Toward AI Civilization. *arXiv preprint* arXiv:2411.00114.
- Clark, H. H., & Schaefer, E. F. (1989). Contributing to discourse. *Cognitive Science*, 13(2), 259–294.
- Ginzburg, J. (2012). *The Interactive Stance: Meaning for Conversation*. Oxford University Press.
- Huang, W., Xia, F., Xiao, T., et al. (2022). Inner Monologue: Embodied Reasoning through Planning with Language Models. *arXiv preprint* arXiv:2207.05608.
- Latitude. (2019). AI Dungeon. Web application: `play.aidungeon.com`.
- Nelson, G. (2006). *Inform 7: A Design System for Interactive Fiction*. Documentation: `inform7.com`.
- Park, J. S., O'Brien, J. C., Cai, C. J., Morris, M. R., Liang, P., & Bernstein, M. S. (2023). Generative Agents: Interactive Simulacra of Human Behavior. *Proceedings of the 36th Annual ACM Symposium on User Interface Software and Technology* (UIST '23). DOI: 10.1145/3586183.3606763. *arXiv preprint* arXiv:2304.03442.
- Schick, T., Dwivedi-Yu, J., Dessì, R., et al. (2023). Toolformer: Language Models Can Teach Themselves to Use Tools. *arXiv preprint* arXiv:2302.04761.
- Skantze, G. (2007). Error Handling in Spoken Dialogue Systems: Managing Uncertainty, Grounding and Miscommunication. KTH Royal Institute of Technology PhD thesis.
- Smith, B. (2026). A Layered Cognitive Architecture for Persistent LLM-Driven Multi-Agent Societies. Companion paper, Omniira deployment.
- Wang, G., Xie, Y., Jiang, Y., et al. (2023). Voyager: An Open-Ended Embodied Agent with Large Language Models. *arXiv preprint* arXiv:2305.16291.
- Wu, Q., Bansal, G., Zhang, J., et al. (2023). AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation. *arXiv preprint* arXiv:2308.08155.
- Yao, S., Zhao, J., Yu, D., et al. (2022). ReAct: Synergizing Reasoning and Acting in Language Models. *arXiv preprint* arXiv:2210.03629.

---

## Appendix A — Affordance compiler signature and example output

```typescript
// affordances.ts
export function computeAffordances(session: Session): string[];

// Sample output for a player standing in The Salt Barrel with two NPCs,
// a sword in inventory, and bread on the ground:
[
  "buy ale", "buy mulled wine", "buy stew",
  "cook",
  "down", "east", "up",
  "drop starmetal sword",
  "examine cook's journal",
  "examine hale",
  "examine maren",
  "examine starmetal sword",
  "exits",
  "follow hale",
  "follow maren",
  "get bread",
  "examine bread",
  "goods hale",
  "goods maren",
  "inventory",
  "look",
  "read journal",
  "recipes",
  "skills",
  "status",
  "talk to hale",
  "talk to maren",
  "techniques",
  "time",
  "who",
  "wield starmetal sword",
]
```

## Appendix B — Generative-fallback prompt

```
You are the narrator of a persistent text-based world. A player just typed
something the game didn't have a structured action for. Your job is to
acknowledge what they tried with ONE short in-world sentence — never as
the system, always as the world reacting.

Player: <playerName>
Room: <roomName>
NPCs here: <comma-separated NPC names, or (none)>
Other players here: <comma-separated player names, or (none)>

The player just typed: "<input, ≤200 chars>"

Write ONE sentence (≤25 words) of third-person in-world narration that
acknowledges what they tried. Use <playerName>'s name. If they addressed
someone in the room, have that person react. If they asked a question,
have it land unanswered or have someone shrug. If they tried something the
world can't do, narrate the attempt fizzling. If they used gibberish,
narrate them muttering or trailing off.

Rules:
- ONE sentence only. Never more.
- Third person. Use <playerName>'s name.
- Never speak AS the system ("type look", "command not found", "alas").
- Never describe game mechanics or commands.
- Never invent items, NPCs, or rooms not listed above.
- If a name in the input matches an NPC or player listed above, use it;
  otherwise treat unfamiliar words as the player muttering.
- Never end with a question to the player.

Return ONLY the sentence. No quotes, no preamble, no explanation.
```

## Appendix C — Convergence canary

The fallback layer's invocation rate is the architecture's primary health metric. A healthy deployment has the fallback firing rarely; sustained elevation indicates that Layer 2 (the agent) is leaving inputs unhandled.

```typescript
// metrics.ts
ROUTER_GENERIC_GUIDE_FIRED:    "router.generic_guide_fired",     // every fallback call
ROUTER_GENERIC_GUIDE_LLM_OK:   "router.generic_guide_llm_ok",    // LLM produced a usable line
ROUTER_GENERIC_GUIDE_LLM_FAIL: "router.generic_guide_llm_fail",  // LLM unavailable, deterministic backup used
```

Healthy band: `router.generic_guide_fired / total_inputs < 5%`. Sustained higher rates indicate one of:

- Affordance compiler missing common verbs the playerbase tries
- Agent prompt too restrictive (refusing to dispatch on borderline inputs)
- Catalog gap (player verb missing from catalog whitelist, dispatch rejected)
- LLM model regression (Groq-side issue)

The `/admin/metrics/summary` endpoint surfaces these counters with interpretation.
