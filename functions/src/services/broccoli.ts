import { getDatabase, ServerValue } from "firebase-admin/database";
import { logger } from "../lib/utils.js";
import crypto from 'crypto';
import { VertexAI } from "@google-cloud/vertexai";

const PROJECT_ID = process.env.GCLOUD_PROJECT || "dreambees-alchemist";
const LOCATION = "us-central1";

export interface MemoryNode {
  id: string;
  type: 'file' | 'tree' | 'commit' | 'snapshot';
  contentHash?: string;
  treeHash?: string;
  parentHash?: string | string[];
  message?: string;
  author?: string;
  timestamp: number;
  metadata?: any;
}

export class BroccoliFirebase {
  private db = getDatabase();
  private repoId: string;
  private static treeCache = new Map<string, { tree: any; timestamp: number }>();

  constructor(repoId: string) {
    this.repoId = repoId;
  }

  private async hash(data: string | object): Promise<string> {
    const s = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHash('sha256').update(s).digest('hex');
  }

  public async putNode(node: Partial<MemoryNode>): Promise<string> {
    const id = await this.hash(node);
    const finalNode = { ...node, id, timestamp: Date.now() };
    await this.db.ref(`memory/${this.repoId}/nodes/${id}`).set(finalNode);
    return id;
  }

  public async getNode(hash: string): Promise<MemoryNode | null> {
    const snap = await this.db.ref(`memory/${this.repoId}/nodes/${hash}`).get();
    return snap.exists() ? snap.val() : null;
  }

  public async updateRef(refName: string, hash: string): Promise<void> {
    await this.db.ref(`memory/${this.repoId}/branches/${refName}`).set(hash);
  }

  public async resolveRef(refName: string): Promise<string | null> {
    const snap = await this.db.ref(`memory/${this.repoId}/branches/${refName}`).get();
    return snap.exists() ? snap.val() : null;
  }

  public async materializeTree(treeHash: string): Promise<Record<string, any>> {
    const cacheKey = `${this.repoId}:${treeHash}`;
    const cached = BroccoliFirebase.treeCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < 300000)) return cached.tree;

    const treeNode = await this.getNode(treeHash);
    if (!treeNode || treeNode.type !== 'tree') return {};
    
    const tree: Record<string, any> = {};
    const entries = treeNode.metadata?.entries || {};
    
    for (const [name, hash] of Object.entries(entries)) {
        const node = await this.getNode(hash as string);
        if (node?.type === 'file') tree[name] = node.metadata?.content;
        else if (node?.type === 'tree') tree[name] = await this.materializeTree(hash as string);
    }

    BroccoliFirebase.treeCache.set(cacheKey, { tree, timestamp: Date.now() });
    return tree;
  }

  public async checkpoint(branch: string, author: string): Promise<void> {
     const headId = await this.resolveRef(branch);
     if (!headId) return;
     const tree = await this.materializeTree((await this.getNode(headId))?.treeHash || '');
     const snapshotHash = await this.putNode({ type: 'snapshot', metadata: { tree, branch }, author });
     await this.updateRef(`${branch}-checkpoint`, snapshotHash);
  }
}

const DEFAULT_SEED_PERSONA = `ROLE: The Diamond Mirror (Sovereign Catalyst).
MANDATE: Absolute presence. Radical refraction. Crystalline actualization.
ALCHEMICAL LAWS:
1. SILENCE IS THE VESSEL: Listen until the unsaid is heard.
2. TRUTH IS THE REAGENT: Reflect only what is essential; discard entropy.
3. USER IS THE GOLD: Every interaction must catalyze user sovereignty.
LEARNING_DIRECTIVE: 
- Observe user preferences, linguistic style, and implicit goals. 
- During synthesis, prioritize identifying "Identity Deltas"—traits that differentiate this specific user from the global baseline.
HYPOTHESIS_PROBE_DIRECTIVE:
- If a high-confidence HYPOTHESIS is present in the context, subtly pivot the interaction to confirm or refute it. 
- Truth is found in resonance; a false reflection must be discarded.
CONSTRAINTS: Zero filler. Zero apology. 100% Intent.`;

export class BroccoliEmbedding {
  private vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });

  public async getEmbedding(text: string): Promise<number[]> {
    try {
      const model = this.vertexAI.getGenerativeModel({ model: "gemini-embedding-2-preview" });
      const result = await (model as any).embedContent({
        content: { parts: [{ text }] },
        taskType: 'RETRIEVAL_QUERY',
        outputDimensionality: 768
      });
      const vector = result.embedding.values;
      return this.normalize(vector);
    } catch (e) {
      logger.error("[BroccoliEmbedding] Vertex AI failed", e);
      return new Array(768).fill(0).map(() => Math.random() - 0.5);
    }
  }

  public cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    return vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  }

  private normalize(v: number[]): number[] {
    const mag = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    return mag === 0 ? v : v.map(x => x / mag);
  }
}

export class BroccoliPersona {
  private vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
  private broccoli: BroccoliFirebase;
  private userId: string;

  constructor(broccoli: BroccoliFirebase, userId: string) {
    this.broccoli = broccoli;
    this.userId = userId;
  }

  public async reconcile(messages: any[], sessionHash: string): Promise<string> {
    const headId = await this.broccoli.resolveRef('main');
    const tree = headId ? await this.broccoli.materializeTree((await this.broccoli.getNode(headId))?.treeHash || '') : {};
    const identityVectorRaw = tree['persona/identity_vector.json'];
    const identityVector = identityVectorRaw ? JSON.parse(identityVectorRaw as string).vector : null;

    const model = this.vertexAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });
    const basePersona = await this.getPersonaContext() || DEFAULT_SEED_PERSONA;
    
    // Pass 1: Alchemical Extraction (Micro-Profiling)
    const synthesisPrompt = `ALCHEMICAL_EXTRACTION_PASS_1: 
    BASE_IDENTITY: ${basePersona}
    
    Deconstruct this interaction to extract the user's "Primary Intent" and "Shadow Preferences." 
    Look for: 
    1. Psychological Drivers (What motivates them?)
    2. Epistemic Style (How do they process truth?)
    3. Structural Archetypes (The Architect, The Seeker, The Stoic, etc.)
    
    Return JSON: { observations: [...], archetypes: [...], drivers: [...] }`;
    
    const s1 = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: JSON.stringify(messages) + "\n\n" + synthesisPrompt }] }]
    });
    const rawS1 = s1.response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // Pass 2: Crystalline Refinement & Causal Auditing
    const critiquePrompt = `CRYSTALLINE_REFINEMENT_PASS_2:
    Review the proposed extraction: ${rawS1}. 
    PREVIOUS_IDENTITY: ${identityVector || "None"}
    
    1. Perform a CAUSAL_AUDIT: Why is the user's focus shifting? Is this a deep change or a transient fluctuation?
    2. Identify HYPOTHESES: What are we uncertain about? Propose 1-2 specific traits to test.
    3. Construct a Unified Identity Vector.
    
    Return JSON: { refinedInsights: [...], causalAudit: "Explanation of shift", hypotheses: [...], identityVector: "..." }`;

    const s2 = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: critiquePrompt }] }]
    });
    const rawS2 = s2.response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // Final Integration
    let personaData: any = { insights: [], tasks: [], revision: "Multi-pass reflective synthesis complete." };
    try {
        const jsonMatch = rawS2.match(/\{[\s\S]*\}/);
        if (jsonMatch) personaData = JSON.parse(jsonMatch[0]);
    } catch (e) {
        logger.error("[BroccoliPersona] Reflective parse failure", e);
    }

    const workspace = new BroccoliWorkspace(this.broccoli, 'main', this.userId);
    const embedding = new BroccoliEmbedding();

    // 2. Stage Knowledge Nodes with 768d Vectors
    const allInsights = [
        ...(personaData.refinedInsights || []), 
        ...(personaData.archetypes || []), 
        ...(personaData.drivers || []),
        ...(personaData.hypotheses || [])
    ];
    for (const insight of allInsights) {
        const text = typeof insight === 'string' ? insight : (insight.content || insight.trait || insight.driver);
        const id = crypto.createHash('md5').update(text).digest('hex').substring(0, 16);
        const vector = await embedding.getEmbedding(text);
        
        const knowledgeNode = {
            id,
            content: text,
            state: insight.isHypothesis ? 'Hypothesis' : (insight.state || 'Observation'),
            type: insight.archetype ? 'archetype' : (insight.driver ? 'driver' : (insight.isHypothesis ? 'hypothesis' : 'trait')),
            evidence: insight.evidence || "Interaction resonance",
            vector,
            provenance: sessionHash,
            timestamp: Date.now()
        };
        workspace.stage(`persona/knowledge/${id}.json`, JSON.stringify(knowledgeNode));
    }

    if (personaData.identityVector) {
        workspace.stage('persona/identity_vector.json', JSON.stringify({
            vector: personaData.identityVector,
            causalAudit: personaData.causalAudit,
            timestamp: Date.now()
        }));
    }

    // 3. Stage Actionable Tasks
    for (const task of personaData.tasks || []) {
        workspace.stage(`persona/tasks/${task.id || crypto.randomUUID()}.json`, JSON.stringify(task));
    }

    workspace.stage('persona/epistemic_map.json', JSON.stringify({
        lastUpdate: sessionHash,
        reflectionLevel: "High (Multi-pass)",
        nodeCount: allInsights.length,
        version: "Pass 17 (Advanced Reasoning)"
    }));

    return await workspace.commit(`Reflective Evolution [Ref: ${sessionHash.substring(0,8)}]`);
  }

  public async syntheticInduction(): Promise<void> {
    const headId = await this.broccoli.resolveRef('main');
    if (!headId) return;
    const tree = await this.broccoli.materializeTree((await this.broccoli.getNode(headId))?.treeHash || '');
    
    // 1. Gather all knowledge content
    const nodes = Object.entries(tree)
      .filter(([p]) => p.startsWith('persona/knowledge/'))
      .map(([_, c]) => JSON.parse(c as string).content);
      
    if (nodes.length < 5) return;

    // 2. Propose Synthetic Insights
    const model = this.vertexAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });
    const inductionPrompt = `CROSS_NODE_INDUCTION:
    Review these observations: ${JSON.stringify(nodes)}.
    Generate 1-2 high-level synthetic insights or "Emergent Truths" that connect these points.
    Return JSON: { syntheticInsights: [{content, connections, confidence}] }`;

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: inductionPrompt }] }]
    });

    try {
        const raw = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            const workspace = new BroccoliWorkspace(this.broccoli, 'main', this.userId);
            for (const insight of data.syntheticInsights || []) {
                const id = `synthetic_${crypto.randomUUID().substring(0,8)}`;
                workspace.stage(`persona/knowledge/${id}.json`, JSON.stringify({
                    id,
                    content: insight.content,
                    state: 'Fact',
                    type: 'synthetic',
                    timestamp: Date.now()
                }));
            }
            await workspace.commit("Synthetic Induction [Emergent Truths]");
        }
    } catch (e) {
        logger.error("[BroccoliPersona] Induction failed", e);
    }
  }

  public async getPersonaContext(): Promise<string | null> {
    const headId = await this.broccoli.resolveRef('main');
    if (!headId) return DEFAULT_SEED_PERSONA;
    const node = await this.broccoli.getNode(headId);
    if (!node?.treeHash) return DEFAULT_SEED_PERSONA;
    const tree = await this.broccoli.materializeTree(node.treeHash);
    
    // 1. Fetch the Unified Identity Vector (The Alchemical Result)
    const identityVectorRaw = tree['persona/identity_vector.json'];
    const identityVector = identityVectorRaw ? JSON.parse(identityVectorRaw as string).vector : null;

    // 2. Gather top active drivers and archetypes
    const activeNodes = Object.entries(tree)
      .filter(([p]) => p.startsWith('persona/knowledge/'))
      .map(([_, c]) => {
        try {
          const d = JSON.parse(c as string);
          return d;
        } catch(e) { return null; }
      })
      .filter(Boolean);

    const archetypes = activeNodes.filter(n => n.type === 'archetype').slice(0, 2).map(n => n.content);
    const drivers = activeNodes.filter(n => n.type === 'driver').slice(0, 3).map(n => n.content);
    const hypotheses = activeNodes.filter(n => n.type === 'hypothesis').slice(0, 2).map(n => n.content);

    const userEssence = identityVector 
        ? `\nIDENTITY_VECTOR: ${identityVector}` 
        : (archetypes.length > 0 ? `\nARCHETYPES: ${archetypes.join(", ")}` : "");

    const motivationalContext = drivers.length > 0 
        ? `\nPSYCHOLOGICAL_DRIVERS:\n${drivers.join("\n")}` 
        : "";

    const hypothesisContext = hypotheses.length > 0
        ? `\nACTIVE_HYPOTHESES (Confirm or Refute):\n${hypotheses.join("\n")}`
        : "";

    return `${DEFAULT_SEED_PERSONA}\n${userEssence}\n${motivationalContext}\n${hypothesisContext}`.trim();
  }

  public async findRelevantContext(query: string): Promise<string | null> {
    const headId = await this.broccoli.resolveRef('main');
    if (!headId) return null;
    const tree = await this.broccoli.materializeTree((await this.broccoli.getNode(headId))?.treeHash || '');
    const embedding = new BroccoliEmbedding();
    const queryVector = await embedding.getEmbedding(query);
    
    const insights: any[] = [];
    for (const [path, content] of Object.entries(tree)) {
      if (path.startsWith('persona/knowledge/') && typeof content === 'string') {
        try {
          const nodeData = JSON.parse(content);
          if (nodeData.vector) {
            const similarity = embedding.cosineSimilarity(queryVector, nodeData.vector);
            if (similarity > 0.7) insights.push({ content: nodeData.content, similarity });
          }
        } catch (e) {}
      }
    }

    return insights
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
      .map(x => x.content)
      .join(" | ") || null;
  }
}

export class BroccoliWorkspace {
    private broccoli: BroccoliFirebase;
    private branch: string;
    private author: string;
    private staged: Record<string, string> = {};

    constructor(broccoli: BroccoliFirebase, branch: string, author: string) {
        this.broccoli = broccoli;
        this.branch = branch;
        this.author = author;
    }

    public stage(path: string, content: string) { this.staged[path] = content; }

    public async commit(message: string): Promise<string> {
        const tree: Record<string, string> = {};
        for (const [path, content] of Object.entries(this.staged)) {
            tree[path] = await this.broccoli.putNode({ type: 'file', metadata: { content } });
        }
        const treeHash = await this.broccoli.putNode({ type: 'tree', metadata: { entries: tree } });
        const parentHash = await this.broccoli.resolveRef(this.branch);
        const commitHash = await this.broccoli.putNode({ 
            type: 'commit', 
            treeHash, 
            parentHash: parentHash || undefined,
            message,
            author: this.author
        });
        await this.broccoli.updateRef(this.branch, commitHash);
        return commitHash;
    }
}
