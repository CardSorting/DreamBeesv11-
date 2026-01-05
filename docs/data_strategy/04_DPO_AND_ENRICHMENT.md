# 04. Workflow: DPO & Enrichment

This document explains how to utilize the data for specific Machine Learning tasks: **Direct Preference Optimization (DPO)** and **Automated Aesthetic Scoring**.

## Workflow A: Constructing DPO Pairs

Direct Preference Optimization requires datasets in the format `(Prompt, Chosen, Rejected)`. Ideally, the 'Chosen' and 'Rejected' images should ideally be generated from the **same** prompt and settings to isolate the aesthetic preference.

### The "Configuration Signature"
We solve this grouping problem at ingestion time using the `configuration_signature`.

**Signature Logic**:
```javascript
Signature = SHA256(ModelID + Prompt + NegativePrompt + CFG + Steps + AspectRatio)
```

**Note**: The **Seed** is excluded. This allows us to group different generations (different seeds) that share the same intent.

### SQL Extraction Strategy
You can run this query (in BigQuery or client-side aggregation) to generate your training set:

```sql
SELECT 
    t1.meta.prompt_cleaned as prompt,
    t1.asset_pointers.image_url as chosen_image,
    t2.asset_pointers.image_url as rejected_image
FROM training_feedback t1
JOIN training_feedback t2 
    ON t1.configuration_signature = t2.configuration_signature
WHERE 
    t1.dataset_split = 'train' AND
    t2.dataset_split = 'train' AND
    t1.rating = 1 AND  -- Chosen
    t2.rating = -1     -- Rejected
```

This query instantaneously yields valid training pairs without manual clustering.

---

## Workflow B: Automated Enrichement (The "Agent Worker")

To enable "Zero Manual Tagging", we implement a background worker that consumes the `agent_task`.

### Worker Logic (Python Pseudocode)

```python
import firebase_admin
from firebase_admin import firestore
from lmm_client import LLaVA  # or GPT4Visual

db = firestore.client()

def process_pending_feedback():
    # 1. Fetch Pending Tasks
    docs = db.collection('training_feedback')\
             .where('enrichment.status', '==', 'pending')\
             .limit(50)\
             .stream()

    for doc in docs:
        data = doc.to_dict()
        task = data['agent_task']
        
        # 2. Execute Task (Stateless)
        # The agent just follows the instruction_template
        result = LLaVA.analyze(
            image=task['input']['image_url'],
            prompt=task['instruction_template'],
            context=task['input']['user_prompt']
        )
        
        # 3. Parse Result (JSON)
        # Assume result is { "score": 8.5, "caption": "..." }
        
        # 4. Write Back
        doc.reference.update({
            'enrichment.status': 'completed',
            'enrichment.aesthetic_score': result['score'],
            'enrichment.generated_caption': result['caption'],
            'enrichment.tags': result['tags']
        })
        
        print(f"Enriched {doc.id}")

if __name__ == "__main__":
    while True:
        process_pending_feedback()
        sleep(5)
```

### Benefits
1.  **Asynchronous**: Does not slow down the user UI.
2.  **Scalable**: You can spin up 100 worker instances to handle high load.
3.  **Modular**: You can swap `LLaVA` for `GPT-5` in the python script without redeploying the React app.
