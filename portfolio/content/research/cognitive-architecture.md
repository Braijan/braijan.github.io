# Omniira: A Layered Cognitive Architecture for Persistent LLM-Driven Multi-Agent Societies

**Brian Smith**
*Independent Researcher*
`contact@thesmithsyndicate.com`

**Draft v0.1.** All cited work has been verified against primary sources. Every technical claim about the Omniira system has been cross-referenced against the author's deployed source code; specific file and line references are on file and can be supplied to reviewers.

**AI assistance disclosure.** The prose of this paper was drafted with assistance from a large language model (Anthropic's Claude). All technical claims, citations, numerical results, and system descriptions were verified by the author against source code prior to posting. The author takes full responsibility for the content.

**Note on the current draft — preliminary observations, not a controlled study.** The qualitative observations reported in Section 9 were collected during a period of active development on the Omniira system. They are therefore exploratory: they document real behavior that occurred in the live system, but cannot be cleanly attributed to the system-as-designed because the prompts and code were changing during the period. A controlled observation with a frozen codebase, frozen prompts, and no operator intervention is planned and will form the empirical spine of the next revision. The architecture, related work, and research questions in this draft are intended to stand through that revision; Section 9 will be rewritten from clean data.

---

## Abstract

Generative-agent architectures (Park et al. 2023) have shown that prompt-conditioned large language models with memory streams, reflection, and planning can drive socially plausible behavior in persistent multi-agent simulations. Subsequent work (AI Town 2023; Project Sid 2024; Voyager 2023) has scaled and varied this substrate but has largely retained the original three-layer structure: observe, reflect, plan. We report from **Omniira**, a live, persistent, commodity-grounded LLM-driven multi-agent world running at `omniira.ai`, in which we extend that substrate along five concrete dimensions that, to our knowledge, have not been jointly documented in a live persistent multi-agent LLM system: **(1)** *self-tagged memory persistence*, in which NPCs choose what to remember in real time by emitting structured tags inline within their own dialogue; **(2)** *provenance-aware retrieval*, in which every memory carries the identity of who told it to the agent and hearsay is scored down relative to firsthand experience; **(3)** *gossip propagation with provenance preservation*, in which third-party mentions in NPC-to-NPC conversation are extracted and written to the listener as hearsay memories with the speaker recorded as provenance; **(4)** *emotional valence as a retrieval signal*, in which memories are tagged with discrete feelings (joy, anger, fear, trust, contempt, sorrow, surprise) that bias retrieval and bleed into the NPC's voice; and **(5)** *daily first-person autobiography*, a separate narrative-voice diary entry written per NPC per game day, distinct from interpersonal reflection and providing long-arc continuity. We describe the architecture and implementation in sufficient detail for reproduction, report preliminary observations from 175 game days of deployment with 29 named NPCs, and offer Omniira as a testbed (release planned). We argue that the layered cognitive scaffolding presented here is a small but consequential extension to the standard generative-agent substrate, with implications for any system that needs persistent, socially-embedded LLM agents at scale.

**Keywords:** LLM agents, generative agents, memory architectures, persistent multi-agent systems, computational social science, agent-based modeling

---

## 1. Introduction

The release of Park et al.'s *Generative Agents* (UIST 2023) crystallized a now-standard architecture for LLM-driven multi-agent societies: a memory stream of timestamped observations, a reflection pass that synthesizes recent observations into higher-level beliefs, and a planning layer that turns beliefs into daily schedules. The Smallville sandbox demonstrated emergent coordination, relationship formation, and group activities at the 25-agent scale. The architecture has been widely adopted: AI Town (a16z-infra 2023) is an MIT-licensed re-implementation on the Convex platform, now widely forked; Project Sid (Altera.AL 2024) scaled to 10–1000+ agents in Minecraft; Voyager (Wang et al. 2023) explored single-agent curriculum learning with similar substrate.

Less work has examined the *limits* of this substrate. The original generative-agent architecture treats memory as a passive byproduct of observation: the system writes observations to the stream, periodically computes reflections, and surfaces relevant memories at conversation time via a recency × importance × relevance score. Memory is something that *happens to* the agent. Reflections are scheduled, mechanical, written about the agent's experience by a system pass. Information transmission between agents — the "did you hear about X" gossip channel that gives social fabric its texture — is unmodeled in the original implementation; we are not aware of subsequent published work that addresses it directly with provenance preservation.

This paper reports from **Omniira**, a live LLM-driven multi-agent world running at `omniira.ai` since early 2026, in which we have extended the standard substrate in five concrete directions:

1. **Self-tagged memory persistence.** NPCs choose what to remember by emitting `[[REMEMBER]]`, `[[OPINION]]`, `[[CONCERN]]`, and `[[COMMITMENT]]` tags inline within their own dialogue. The server strips tags before display, parses the JSON payload, embeds the value, and writes the row. The NPC's *voice* and the NPC's *memory* are produced by the same forward pass.

2. **Provenance-aware retrieval.** Every memory row stores a nullable `provenance_npc_id` — who told the agent. Retrieval scoring downweights memories with provenance set (i.e., hearsay) by a fixed multiplier. Conversation prompts render provenance distinctly: "(heard from Voss) Aurvandil bought a sword" rather than treating it as firsthand observation.

3. **Gossip propagation with provenance preservation.** When two NPCs converse without a player present, a post-conversation extractor LLM identifies third-party mentions, validates them against a closed list of known subjects, and writes hearsay memories to the *listener* keyed against the third party, with the *speaker* recorded as provenance. Future conversations involving the listener and the third party retrieve these as secondhand information with appropriate weighting.

4. **Emotional valence in retrieval.** Memories are tagged with one of seven discrete emotions (joy, anger, fear, trust, contempt, sorrow, surprise) at write time — by the NPC itself in the case of self-tagged memories, by the extractor LLM in the case of post-hoc extraction. Feeling-tagged memories receive a small retrieval multiplier and the emotion is rendered in the conversation prompt, biasing the NPC's tone.

5. **Daily first-person autobiography.** Once per game day at the world rollover, every NPC — autonomous and non-autonomous — synthesizes the day's signals (memories formed today, current concerns, places visited, witnessed world events involving them) into a brief first-person diary entry. The entry is embedded and stored separately from interpersonal reflection. It surfaces in subsequent prompts as "What's been happening with you lately," providing long-arc continuity that interpersonal reflection alone does not.

These extensions sit on top of, not in place of, the core generative-agent substrate. Memory streams, reflection, and planning are all retained. The contribution is the additional cognitive scaffolding — five extensions — and our central claim is that these five additions, taken together, produce a qualitatively different texture of agent behavior: NPCs that remember what they choose to remember, weigh what they heard against what they saw, gossip with traceable rumor chains, carry emotional residue into future encounters, and accumulate a continuous interior life.

We describe the architecture (Sections 4–7), report on a live deployment of 175 game days with 29 named NPCs (Section 8), present preliminary qualitative observations (Section 9), and offer Omniira as an open testbed (Section 10).

---

## 2. Related Work

**Generative agents.** Park et al. (2023) introduced the memory stream / reflection / planning architecture that is the foundation of this work. The Smallville sandbox demonstrated that 25 LLM-driven agents could coordinate over multiple in-simulation days, including emergent group activities (a Valentine's Day party). The original implementation scored memory relevance via *recency* (exponential decay) × *importance* (LLM-assigned 1–10) × *relevance* (cosine similarity in a sentence-embedding space). Reflection was a periodic pass that asked the LLM to synthesize the most salient recent memories into higher-level abstractions. Memory in this architecture is observed by the system, not reported by the agent itself; gossip and rumor propagation are not modeled.

**Open re-implementations and scaling.** AI Town (a16z-infra 2023) is an MIT-licensed re-implementation built on Convex, widely forked, and serves as a reference implementation for the original architecture. Project Sid (Altera.AL 2024, arXiv:2411.00114) introduced PIANO (Parallel Information Aggregation via Neural Orchestration) and reported scaling to 10–1000+ agents in Minecraft, with emergent specialized roles, rule adherence, and cultural-religious transmission. Voyager (Wang et al. 2023, arXiv:2305.16291) explored single-agent curriculum learning in Minecraft via LLM-generated executable code, retaining the memory-then-reflect structure for skill accumulation.

**Cognitive architectures.** SOAR (Laird 2012) and ACT-R (Anderson 2007) are long-standing cognitive architectures with explicit declarative and procedural memory layers. Schank's scripts (Schank & Abelson 1977) and Conceptual Dependency theory frame memory as structured, action-grounded representations. These architectures predate LLMs and are decoupled from modern NLP, but inform the philosophical commitment of layered cognition that motivates our extensions.

**Memory in conversational agents.** Long-term memory for LLM chatbots has been explored in MemGPT (Packer et al. 2023, arXiv:2310.08560) and similar systems, which use external storage and retrieval to overcome context-window limits. These systems target single-user conversational fidelity; they do not address multi-agent gossip, provenance, or socially-embedded memory.

**Frame semantics and emotion in retrieval.** Affective computing (Picard 1997) and emotion-modulated memory in cognitive psychology (Kensinger 2009) establish that emotionally charged events are recalled more reliably and influence subsequent behavior. Operationalizing this in LLM agents — tagging memories with discrete emotions and using those tags as retrieval signals — has been proposed in narrative-AI contexts (Riedl & Bulitko 2013) but, to our knowledge, has not been deployed at scale in a live persistent simulation.

**Multi-agent gossip and information diffusion.** Classical agent-based modeling (Deffuant et al. 2002; Hegselmann & Krause 2002) studies opinion dynamics under bounded confidence and biased communication; these models prescribe behavior at the micro level. The combination of LLM agents capable of free-form dialogue plus a structured gossip extractor that propagates third-party mentions is, again to our knowledge, unreported in deployed multi-agent LLM systems.

**Position.** This paper is additive to Park et al. (2023) and the open generative-agent literature. We retain their substrate and propose five concrete extensions: self-tagging, provenance, gossip propagation, emotional valence in retrieval, and daily autobiography. Each extension is small and implementable; the claim is that together they produce a qualitatively different texture of agent behavior.

---

## 3. System Overview

Omniira runs as a single-process Node.js 20 / TypeScript application built on the Hono web framework, backed by SQLite in WAL mode via `better-sqlite3`. Two LLM tiers are used: `llama-3.3-70b-versatile` (Meta's 70-billion-parameter Llama 3.3 with a 128K context window) via Groq for character voice, conversation, and autobiography; and `deepseek-ai/DeepSeek-V3.1` via Together for reasoning-heavy synthesis tasks (reflection, gossip extraction). A smaller `llama-3.1-8b-instant` handles ambient flavor text and low-stakes follow-ups. Embeddings are computed locally in-process using `Xenova/gte-small` (384-dim, ~25MB ONNX weights) via `@xenova/transformers`; this avoids both an embedding API bill and the latency of a network hop on the hot path.

The client is a single-file HTML terminal; a WebSocket carries real-time events. The server codebase is approximately 37,000 lines of TypeScript. The deployment is hosted on a single Render container with a persistent disk mounted at `/data` for the SQLite database.

The world hosts 29 named NPCs with persistent identity, location-bound duties, and a cognitive loop described in Section 4. Game time advances at four real seconds per game minute; one game day takes ~96 real minutes. NPC autonomous decision ticks fire periodically (typically every several game minutes per NPC); reflection and autobiography passes fire at game-day rollover. The system has been running continuously since early 2026; at the time of writing the game clock reads day 175.

The tables most relevant to this paper are:

- `npc_memories` — keyed by `(npc_id, player_id, key)`, storing `value`, `learned_at`, `embedding` (BLOB), `importance` (1–10), `memory_source` (e.g. `self`, `gossip`, `extracted`), `provenance_npc_id`, `feeling`, `memory_kind`, `expires_at`.
- `npc_reflections` — synthesized higher-order beliefs per (npc, target) with their own embeddings.
- `npc_autobiography` — first-person diary entries per (npc, game_day) with embeddings.
- `npc_opinions`, `concerns`, `npc_plans` — auxiliary social state surfaced into prompts.

An abbreviated schema is reproduced in Appendix A.

---

## 4. Cognitive Loop

This section describes the per-conversation cognitive loop that runs each time an NPC speaks. Player→NPC and NPC→NPC conversations share the same pipeline; the differences are noted.

### 4.1 Conversation entry

When an NPC is addressed, the server assembles a system prompt comprising:

- **Identity block.** Name, role, personality, current location, why-they-are-there context. Front-loaded to minimize identity drift.
- **World state block.** Current game time, weather, posture flags (sleeping, in combat, hungry).
- **Social state block.** Opinion of the speaker (if any), reflections about the speaker, current concerns.
- **Memory block.** Output of the retrieval pass described in §4.4, formatted as:
  - "What you remember about \<speaker\>" — memories where `player_id == speaker_id`. Hearsay items are rendered with provenance: "(heard from Voss) Aurvandil bought a sword."
  - "What you've come to believe about \<speaker\>" — relevant reflections from `npc_reflections`.
  - "What's been happening with you lately" — the most recent autobiography entries.
- **Instruction block.** Including the self-persistence prompt described in §4.2.

The user message is the speaker's utterance. The model produces a reply, which is then run through the self-persistence parser and emitted to the player after tag stripping.

### 4.2 Self-tagged persistence

The instruction block teaches the LLM four tag families it may emit inline within its dialogue. The tags are stripped from the player-visible reply by a regex pass before display. The relevant prompt fragment is reproduced verbatim:

```
[[REMEMBER:{"key":"<short_snake_case>","value":"<one sentence>",
            "importance":<1-10>,
            "feeling":"<joy|anger|fear|trust|contempt|sorrow|surprise|neutral>"}]]

[[OPINION:"<first-person, brief>"]]

[[CONCERN:{"topic":"<short>","intensity":<1-5>}]]

[[COMMITMENT:{"to":"<id>","to_kind":"player"|"npc",
              "action":"travel_with"|"travel_to",
              "target":"<destination>","by":"<time hint>",
              "summary":"<first-person>"}]]
```

Each tag is parsed by `parseSelfPersistence` (`memory-tags.ts`); a parsed `RememberEmission` is embedded via `tryEmbed`, then `upsertMemory` writes the row with the embedding, importance, feeling, and `memory_source = "self"`. Opinions replace the prior `npc_opinions` row for the (npc, target) pair. Concerns are written to `concerns` with the supplied intensity. Commitments are converted into a structured plan row in `npc_plans` and additionally mirrored as a high-importance self-memory tagged with `feeling = "trust"` so retrieval surfaces it in future encounters.

The crucial property of this design is that **memory writes happen during the same forward pass that produces the dialogue**. The NPC is not being observed by an external system that decides what was important; the NPC chooses, in its own voice, what is worth keeping. This is supplemented by a passive post-conversation extractor (Section 4.5) for cases where the conversation LLM emits no tags, but the active voice is the primary source of self-tagged memory.

The prompt explicitly instructs the model to emit tags sparingly: "Most turns should emit zero tags." We have observed in practice that this guidance is followed — the metrics counter `self_persist.remember` runs at roughly 5–15% of `llm.talk_to_npc`, well within the healthy band documented in the project's metrics interpretation guide.

### 4.3 Memory schema

The `npc_memories` table is keyed on `(npc_id, player_id, key)` so a given memory key per (subject, NPC) pair is unique and updates idempotent. The column shape is:

| Column | Purpose |
|---|---|
| `npc_id` | The remembering NPC. |
| `player_id` | The subject of the memory (player or NPC id). |
| `key` | Stable string key — duplicates upsert. |
| `value` | The memory content (≤500 chars). |
| `learned_at` | ISO timestamp. |
| `embedding` | 384-dim Float32 BLOB from `Xenova/gte-small`. |
| `importance` | 1–10, clamped at write. |
| `memory_source` | `self` \| `extracted` \| `gossip` \| `self_committed`. |
| `provenance_npc_id` | Speaker, when memory came from gossip. NULL = firsthand. |
| `feeling` | One of seven discrete emotions, or NULL. |
| `memory_kind` | `event` \| `commitment` \| etc. |
| `expires_at` | Optional decay. |

Embeddings are stored as raw `Buffer` blobs; the `cosineSimilarity` helper unpacks them on read with an alignment-safe copy. There is no separate vector store. The hybrid retrieval described in §4.4 runs entirely within a single SQL query plus an in-memory scoring pass.

### 4.4 Hybrid retrieval

`retrieveRelevantMemories(npcId, entityId, queryText)` returns up to ~20 memories per call, drawn from two lanes that overlap and are then deduplicated:

- **Recency lane.** The 8 most recent memories about `entityId` (`RECENCY_SLOTS = 8`). These ride along regardless of similarity, so a brand-new fact is never buried under older but more relevant ones.
- **Similarity lane.** For each remaining memory with an embedding, compute cosine similarity against the embedded `queryText`. Keep those above `SIMILARITY_FLOOR = 0.25`. Score each as:

  ```
  score = sim
        × importanceMultiplier   // 0.7 + (importance/10) × 0.6   [0.76 .. 1.30]
        × provenanceMultiplier   // 0.8 if hearsay, 1.0 if firsthand
        × feelingMultiplier      // 1.1 if feeling tagged, 1.0 otherwise
  ```

  Take the top 12 by score (`SIMILARITY_SLOTS = 12`).

The two lanes are merged, deduplicated by key (recency winning on ties), and re-sorted chronologically so the LLM reads a narrative timeline rather than a relevance-ranked jumble. This last point matters empirically: ranking memories by relevance produces stilted responses that dump high-similarity items at the top regardless of when they happened.

Reflections are retrieved via the same mechanism (`retrieveRelevantReflections`) with the rule that the most recent reflection is *always* included regardless of similarity — a brand-new belief should always inform the next conversation.

### 4.5 Post-conversation extraction

After the player or NPC closes the conversation, an extractor LLM call examines the full transcript and produces structured memory candidates that the conversation LLM may have missed. This is a fallback, not a replacement: the `parseSelfPersistence` pass is the primary memory writer. The extractor handles cases where the conversation LLM produced no tags (often because the dialogue was short or routine). The extractor and the self-tagger share the same memory schema; both write into `npc_memories`.

The extractor is called once at conversation end (`extractConversationFacts`), not per-turn, to amortize cost. Metrics show approximately one extractor call per ended player conversation, matching design.

### 4.6 Gossip extraction

When two NPCs hold a conversation without a player present (an "N2N" exchange), the extracted facts are not the agents' impressions of each other — those go through a separate path — but their statements about *third parties*. `extractGossipFromN2N` (`npc.ts`) takes the full transcript, the speaker pair, and the closed list of currently-known NPC and recently-active player IDs, and returns a structured list of items:

```typescript
{
  speaker_id: string,       // npcA.id or npcB.id
  subject_id: string,       // a third party from the closed list
  fact: string,             // one sentence, third-person past tense
  importance: number,       // 1-10
  feeling: string,          // joy|anger|fear|trust|contempt|sorrow|surprise|neutral
}
```

Three validation rules are enforced post-LLM: (a) the speaker must be one of the two participants, (b) the subject must NOT be either participant (those are interpersonal memories, handled separately), (c) the subject must be in the closed list of valid IDs (no phantom characters).

Each surviving item is written as a memory on the *listener* — `listenerId = speaker_id == npcA.id ? npcB.id : npcA.id` — keyed against the `subject_id`, with `memory_source = "gossip"` and `provenance_npc_id = speakerId`. The fact is embedded so it participates in subsequent retrieval. The hearsay multiplier (0.8) in retrieval scoring ensures these items have appropriate weight relative to firsthand observations the listener may also hold about the same subject.

This produces observable rumor chains. A complaint Maren makes to Lyra about a player can resurface in Lyra's conversation with another player a game day later — tagged as hearsay, attributed to Maren, weighted appropriately.

---

## 5. Reflection and Autobiography

### 5.1 Daily reflection

Once per game day at world rollover, `runDailyReflections` (`reflections.ts`) iterates over a curated set of 21 *headline NPCs* and for each (npc, target) pair where the listener has accumulated at least `RECENT_MEMORY_THRESHOLD = 4` new memories since the last reflection, calls the reasoning LLM to synthesize 0–2 higher-order beliefs.

The prompt feeds the most recent 25 memories with hearsay items prefixed `(heard from X)` so the synthesizer can weigh provenance. The instruction explicitly tells the synthesizer to "weight firsthand heavier than hearsay" and to skip the synthesis if prior beliefs already cover the pattern. The output is:

```typescript
{
  beliefs: [{ belief: string, importance: number }]   // 0-2 entries
  reasoning: string                                    // for logs only
}
```

Beliefs are written to `npc_reflections` with their own embeddings. They surface in conversation prompts under "What you've come to believe about \<target\>," distinct from the episodic memory list.

The headline-NPC restriction is a cost gate. Most NPCs in the world have low player traffic; reflecting daily on every (npc, target) pair would multiply LLM cost without improving felt behavior. The gate is empirical, not theoretical: bartenders Rowan and Hale are non-autonomous (don't make movement decisions) but reflect because players see them constantly. The seven workers reflect because they accumulate strong opinions about the players who buy from them.

### 5.2 Daily autobiography

Once per game day at world rollover, `writeAllAutobiographies` (`autobiography.ts`) iterates over **every** NPC and produces a brief first-person diary entry. The diary is the second extension to the standard substrate that we believe is novel. It is distinct from reflection in three ways:

1. **Voice.** The diary is first-person, in the NPC's natural register. Reflection is third-person belief-stating.
2. **Subject.** The diary is about the agent itself, weaving in interactions with others. Reflection is about a single target.
3. **Coverage.** The diary is written for every NPC, every day. Reflection is gated to headline NPCs and threshold-passing targets.

The diary prompt receives a structured signal block:

- Memories formed today (with subject names and provenance where applicable)
- Current concerns
- Places visited today
- World events that mentioned the NPC

The signals are presented as raw lists; the LLM is asked to synthesize, not recount. The output is:

```typescript
{
  entry: string,        // 1-3 sentence first-person diary entry
  importance: number,   // 1-10
}
```

Entries are embedded and stored in `npc_autobiography`. They surface in subsequent conversation prompts as "What's been happening with you lately" — providing long-arc continuity that interpersonal reflection alone does not.

An empty signal block means the diary call is skipped silently — no LLM call, no row written. This matters at scale: a deploy mid-day or a quiet day for a peripheral NPC produces no work.

### 5.3 Cost discipline

The two daily passes together account for a small fraction of total LLM spend. Reflection fires at most once per (npc, target) per day and is gated by the threshold; autobiography fires at most once per NPC per day and is gated by the empty-signals check. With 29 NPCs and 21 headline NPCs, an upper bound for a busy day is roughly `21 × N` reflection calls (where `N` is the average number of recently-talked-to subjects, typically 1–3) plus 29 autobiography calls — single-digit cents per day at current rates (Llama 3.3 70B at $0.59 input / $0.79 output per 1M tokens; DeepSeek V3.1 at $0.60 / $1.70). Per-feature cost is recorded via `recordLLMUsage` and visible at `/admin/usage`; readers should expect the actual figure to vary with traffic.

---

## 6. Provenance and Hearsay

The single column `provenance_npc_id` on `npc_memories` carries the gossip system's load. When set, it is the speaker who told this fact to the agent. NULL means firsthand: the agent witnessed or was told directly by the subject.

Three places in the system consume provenance:

1. **Retrieval scoring.** The `provenanceMultiplier = 0.8` for hearsay reduces the rank of secondhand items, ensuring firsthand observations dominate when both could fit in the budget.

2. **Conversation prompts.** When a hearsay memory is rendered into the prompt, it is prefixed with the speaker's display name: "(heard from Voss) Aurvandil bought a sword." The LLM is thus aware that this is gossip and tones its reply accordingly — typically by hedging ("I heard that...") rather than asserting ("you bought...").

3. **Reflection synthesis.** The reflection prompt explicitly instructs the synthesizer to weight firsthand heavier than hearsay and to make hearsay-only beliefs tentative ("I get the sense that...") or skip them entirely.

The combination of these three downstream consumers means that adding `provenance_npc_id` to a row is sufficient to thread it through the entire cognitive pipeline. There is no separate hearsay subsystem.

---

## 7. Emotional Valence

`npc_memories.feeling` carries one of seven discrete emotions or `NULL`. The discrete tag set was chosen from Ekman's basic emotions (Ekman 1992) with substitutions for the deployment context: `contempt` is included as a frequent NPC reaction (Ekman's seventh), `sorrow` substitutes for sadness, and `disgust`/`enjoyment` are absorbed into `anger`/`joy` to reduce LLM ambiguity.

Three integration points:

1. **Retrieval bias.** The `feelingMultiplier = 1.1` for tagged memories produces a small bump that surfaces emotionally charged events more reliably. The bump is intentionally modest — high-importance neutral memories should not be drowned by mild emotional ones.

2. **Reflection weighting.** Reflection prompts include the feeling tag inline; the synthesizer can recognize a pattern of fear-tagged memories about a player and produce a belief like "I keep my distance from them — they make me uneasy" rather than the bland "we have interacted often."

3. **Voice modulation.** The conversation LLM sees the feeling tag in the rendered memory list and tends to color tone accordingly. We have observed that an NPC with three anger-tagged memories about a player typically opens with a colder register than an NPC with three trust-tagged memories — consistent with the prompt-conditioning effect documented in instruction-tuned LLMs more broadly.

The feeling tag is supplied at write time by the LLM that produced the memory: by the conversation LLM in self-tagged emissions, by the gossip extractor for rumor-channel writes, by the post-conversation extractor for fallback writes. There is no system that *retrofits* feeling onto already-written memories; emotional valence is captured at the moment of memory formation, which is consistent with autobiographical-memory psychology (Kensinger 2009).

---

## 8. Deployment

Omniira has been running at `omniira.ai` since early 2026. It is hosted on a single Render container with a persistent disk mounted at `/data` for the SQLite database. The system recovers from restarts by hydrating agent state from SQLite and resuming the tick loop at the persisted game clock.

At the time of writing, the current game clock reads **day 175**. The world has hosted approximately 30+ player accounts to date; player traffic is intermittent, so much of the cognitive activity occurs during NPC-to-NPC autonomous interaction. Total LLM spend across the deployed period sits in the low single-digit dollars per day, with per-active-player marginal cost tracked by a separate observability system (see `usage.ts` in the codebase).

Embeddings are computed in-process by a single worker thread loading `Xenova/gte-small` lazily on first use. After load (~3 seconds), each embedding takes approximately 10ms on the deployed CPU. Memory writes are non-blocking from the conversation flow's perspective; a failed embedding is tolerated (the row is written without it and falls back to recency-only retrieval).

---

## 9. Preliminary Observations (Anecdotal)

**This section is anecdotal.** Observations were collected during active development on a single live deployment with a small intermittent player population; prompts and code were changing; there was no controlled comparison against a vanilla generative-agent substrate. The patterns reported below should be read as motivation for the planned controlled study (Section 10), not as empirical findings. We include them because the qualitative signal informs the architectural argument; we explicitly do not claim that any of these observations constitute evidence of the architecture's effectiveness in the absence of a frozen-codebase replication. A reader looking for empirical conclusions should wait for the next revision.

### 9.1 Self-tagging cadence

Over a sample of conversation turns, the metric `self_persist.remember` runs at approximately **5–15% of `llm.talk_to_npc`**. That is, in 5–15% of conversational turns, the conversation LLM emits a `[[REMEMBER]]` tag. Most turns are silent — consistent with the prompt's "most turns should emit zero tags" directive. We have not observed a regime where self-tagging dominates (which would suggest over-tagging), nor a regime where it goes dormant for extended periods (which would suggest the model has stopped using the affordance). The rate is stable across prompt revisions.

Anecdotally: when a self-tagged memory does appear, it is almost always about something a player just told the NPC — a name, a goal, an item, a request. It is rarely about something the NPC observed in the room, suggesting the LLM treats `[[REMEMBER]]` as a "this person told me a fact about themselves" affordance rather than a generic memory write. This is consistent with the prompt's framing.

### 9.2 Hearsay propagation

Over the deployment window we have observed multiple gossip chains that span more than one conversational hop. A representative example: a player tells Maren a complaint about a third NPC; Maren and Lyra hold an N2N conversation later that game day; the gossip extractor identifies the complaint and writes it to Lyra as hearsay with Maren as provenance; the next time the player speaks with Lyra, Lyra's memory list includes the hearsay item and Lyra's reply hedges appropriately ("I've heard you've had words with Voss"). We have not yet quantified the chain-length distribution; this is on the docket for the controlled observation.

The hearsay-downweight (0.8 multiplier) and the (heard from X) rendering appear in prompts as designed; we have not observed cases where a hearsay-only memory has solidified into a high-confidence reflection, consistent with the explicit weighting instruction in the reflection prompt.

### 9.3 Emotional valence and voice

Anecdotally — pending controlled measurement — NPCs with multiple anger-tagged memories about a particular player open conversations with that player in a noticeably cooler register than NPCs with primarily neutral or trust-tagged memories about the same player. The effect is most pronounced when the anger-tagged items are also high-importance. This is the design intent and is consistent with the broader literature on prompt-conditioning of LLMs, but the specific measurement (e.g., sentiment delta in opening sentences as a function of memory affect distribution) is not yet instrumented.

### 9.4 Autobiography continuity

Daily diary entries produce a consistent first-person voice across days. We have inspected sequences of 5–10 consecutive diary entries for several headline NPCs and observed coherent arcs: a brewery yield mentioned in one day's entry recurs in the next; a dispute with a neighbor compounds across two or three entries before resolving. The diary appears to do what it was designed to do: provide a long-arc interior continuity that interpersonal reflection alone does not capture.

Empty diary days are common (the empty-signals skip path triggers regularly for peripheral NPCs on quiet days), which is the desired behavior.

### 9.5 Limitations

Several aspects limit the strength of these observations:

- **No frozen-prompt baseline.** The prompts described in this paper are essentially current; older prompts produced qualitatively different cadences. A controlled observation with frozen prompts is the planned next step.
- **No comparison against a vanilla generative-agent substrate.** We have not run a paired deployment without the five extensions to measure their differential effect.
- **Small NPC and player population.** 29 NPCs, ~30 player accounts, intermittent traffic. Whether the observed cognitive effects scale to larger societies is untested.
- **Subjective qualitative reads.** The conversational-register observation in §9.3 is impressionistic; a quantified measurement is on the planning list.

We acknowledge these limits openly. The architecture described in Sections 4–7 is concrete and reproducible from this paper plus the codebase; the empirical claims in Section 9 should be read as motivating, not conclusive.

---

## 10. Open Research Questions

We offer Omniira as a testbed for further investigation. The following are questions we consider underexplored.

1. **Ablation per extension.** Which of the five extensions contributes most? Removing self-tagging and falling back to extraction-only — does memory quality drop measurably? Removing provenance and treating all memories as firsthand — does the reflection layer collapse into incoherent generalizations? Removing autobiography — do NPCs feel less continuous to players? These ablations are the obvious next step.

2. **Scaling NPC count.** The architecture as deployed runs comfortably at 29 NPCs. At 100? At 1000? Reflection is the most likely scaling bottleneck (LLM call per (npc, target) pair). Hierarchical reflection — daily individual, weekly cross-NPC summary — is a candidate optimization, with its own qualitative effects to measure.

3. **Adversarial gossip.** A deliberately deceptive NPC — one prompted to spread false rumors — would test the system's resilience. Does the provenance system make false rumors traceable? Do downstream listeners weight a known liar's hearsay differently? This connects to broader work on misinformation in LLM-driven societies.

4. **Player-driven memory shaping.** A player who repeatedly self-presents as a particular kind of person — generous, hostile, untrustworthy — should drift NPC opinions and reflections accordingly. Does the magnitude of drift match what a human social network would produce in the same time budget? This is testable.

5. **Cross-model robustness.** The deployed system uses Llama 3.3 70B (Groq) for character voice and DeepSeek V3.1 (Together) for reasoning. Does the cognitive scaffolding produce qualitatively similar behavior under Claude, GPT-4, or smaller open-weight models? At what scale does the self-tagging cadence become unreliable?

6. **Emotional tag set.** We chose seven discrete emotions. Is a continuous valence-arousal representation more useful? Is a smaller tag set (positive/negative/neutral) sufficient? The right answer is empirical and we have not run the comparison.

7. **Tooling for memory inspection.** Players and operators currently see the surface effects of memory but not the memory itself. A "what does this NPC remember about me" affordance, used judiciously, could be a research and debugging tool. Whether it would damage felt-immersion is also testable.

We invite collaboration on any of these.

---

## 11. Conclusion and Availability

We presented Omniira's cognitive scaffolding: five concrete extensions to the standard generative-agent substrate of Park et al. (2023). NPCs choose what to remember by emitting structured tags inline within their dialogue (self-tagging). Memories carry the identity of their source and hearsay is downweighted in retrieval (provenance). Third-party mentions in NPC-to-NPC conversation propagate to the listener as hearsay memories with the speaker recorded as provenance (gossip propagation). Memories are tagged with discrete emotional valence that biases retrieval and bleeds into voice (emotional valence in retrieval). Every NPC writes a brief first-person diary entry per game day, providing long-arc interior continuity (autobiography). Each extension is small, individually motivated, and implementable in tens to hundreds of lines of code; the claim is that taken together they produce a qualitatively different texture of agent behavior than the standard substrate alone.

The system is live at [`omniira.ai`](https://omniira.ai). Source is currently held in a private repository at [`github.com/The-Smith-Syndicate/omnira`](https://github.com/The-Smith-Syndicate/omnira) and is available on request to interested researchers; we intend to release the codebase under a permissive license alongside the next revision of this paper. Schemas, prompts, and a sample of memory rows from the deployment will be included in supplementary materials when the release lands.

We invite collaboration from researchers in multi-agent LLM systems, computational social science, AI safety, narrative AI, and cognitive modeling. Of particular interest: anyone with capacity to run the per-extension ablations (Section 10.1), and anyone working on adversarial-gossip resilience (Section 10.3).

---

## References

- a16z-infra. (2023). AI Town. GitHub repository: `github.com/a16z-infra/ai-town`. MIT License.
- Altera.AL, Ahn, A., et al. (2024). Project Sid: Many-agent Simulations Toward AI Civilization. *arXiv preprint* arXiv:2411.00114.
- Anderson, J. R. (2007). *How Can the Human Mind Occur in the Physical Universe?* Oxford University Press.
- Deffuant, G., Amblard, F., Weisbuch, G., & Faure, T. (2002). How can extremism prevail? A study based on the relative agreement interaction model. *Journal of Artificial Societies and Social Simulation*, 5(4).
- Ekman, P. (1992). An argument for basic emotions. *Cognition and Emotion*, 6(3-4), 169–200.
- Hegselmann, R., & Krause, U. (2002). Opinion Dynamics and Bounded Confidence Models, Analysis, and Simulation. *Journal of Artificial Societies and Social Simulation*, 5(3).
- Kensinger, E. A. (2009). Remembering the Details: Effects of Emotion. *Emotion Review*, 1(2), 99–113.
- Laird, J. E. (2012). *The Soar Cognitive Architecture*. MIT Press.
- Packer, C., Wooders, S., Lin, K., et al. (2023). MemGPT: Towards LLMs as Operating Systems. *arXiv preprint* arXiv:2310.08560.
- Park, J. S., O'Brien, J. C., Cai, C. J., Morris, M. R., Liang, P., & Bernstein, M. S. (2023). Generative Agents: Interactive Simulacra of Human Behavior. *Proceedings of the 36th Annual ACM Symposium on User Interface Software and Technology* (UIST '23). DOI: 10.1145/3586183.3606763. *arXiv preprint* arXiv:2304.03442.
- Picard, R. W. (1997). *Affective Computing*. MIT Press.
- Riedl, M. O., & Bulitko, V. (2013). Interactive narrative: An intelligent systems approach. *AI Magazine*, 34(1), 67–77.
- Schank, R. C., & Abelson, R. P. (1977). *Scripts, Plans, Goals, and Understanding: An Inquiry into Human Knowledge Structures*. Lawrence Erlbaum.
- Wang, G., Xie, Y., Jiang, Y., Mandlekar, A., Xiao, C., Zhu, Y., Fan, L., & Anandkumar, A. (2023). Voyager: An Open-Ended Embodied Agent with Large Language Models. *arXiv preprint* arXiv:2305.16291.

---

## Appendix A — Memory schema (abbreviated)

```sql
CREATE TABLE npc_memories (
  npc_id TEXT NOT NULL REFERENCES npcs(id),
  player_id TEXT NOT NULL,            -- subject id (player or npc)
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  learned_at TEXT NOT NULL,
  embedding BLOB,                      -- 384-dim Float32 from Xenova/gte-small
  importance INTEGER,                  -- 1-10
  memory_source TEXT,                  -- 'self' | 'extracted' | 'gossip' | 'self_committed'
  provenance_npc_id TEXT,              -- speaker id when memory came from gossip; NULL = firsthand
  feeling TEXT,                        -- joy|anger|fear|trust|contempt|sorrow|surprise|NULL
  memory_kind TEXT,                    -- 'event' | 'commitment' | etc.
  expires_at TEXT,
  PRIMARY KEY (npc_id, player_id, key)
);

CREATE TABLE npc_reflections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  npc_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  belief TEXT NOT NULL,
  importance INTEGER NOT NULL,
  memories_count INTEGER NOT NULL,
  embedding BLOB,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE npc_autobiography (
  npc_id TEXT NOT NULL,
  game_day INTEGER NOT NULL,
  entry TEXT NOT NULL,
  importance INTEGER NOT NULL,
  embedding BLOB,
  written_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (npc_id, game_day)
);

CREATE TABLE npc_opinions (
  npc_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  opinion TEXT NOT NULL,
  embedding BLOB,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (npc_id, target_id)
);

CREATE TABLE concerns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  npc_id TEXT NOT NULL,
  concern TEXT NOT NULL,
  source TEXT,
  intensity INTEGER NOT NULL DEFAULT 2,   -- 1-5
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## Appendix B — Self-persistence prompt fragment

The complete prompt block injected into every NPC's system message (excerpted from `memory-tags.ts`):

```
WHAT YOU CAN REMEMBER YOURSELF (optional, internal — players never see these):
You can save things mid-conversation by emitting any of these tags. They are
stripped from your reply before the player sees it. Use them sparingly — only
for things that GENUINELY matter for future conversations. Most turns should
emit zero tags. Never explain the tags or mention them in dialogue.

[[REMEMBER:{"key":"...","value":"...","importance":1-10,"feeling":"..."}]]
[[OPINION:"..."]]
[[CONCERN:{"topic":"...","intensity":1-5}]]
[[COMMITMENT:{"to":"...","to_kind":"player"|"npc","action":"travel_with"|
              "travel_to","target":"...","by":"...","summary":"..."}]]

If nothing rises to the bar, emit nothing. Silent turns are normal and good.
```

The full prompt with detailed per-tag guidance (~2000 tokens) is in `memory-tags.ts:SELF_PERSISTENCE_PROMPT`.

## Appendix C — Retrieval scoring

```typescript
// from npc.ts:retrieveRelevantMemories
const importance = row.importance ?? 5;
const importanceMultiplier = 0.7 + (importance / 10) * 0.6;   // 0.76 .. 1.30
const provenanceMultiplier = row.provenance_npc_id ? 0.8 : 1.0;
const feelingMultiplier = row.feeling ? 1.1 : 1.0;
const score = sim * importanceMultiplier * provenanceMultiplier * feelingMultiplier;

// Constants
const RECENCY_SLOTS = 8;
const SIMILARITY_SLOTS = 12;
const SIMILARITY_FLOOR = 0.25;
```
