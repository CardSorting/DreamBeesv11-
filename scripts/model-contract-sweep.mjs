const SDXL_ENDPOINT = 'https://mariecoderinc--sdxl-multi-model-a100-omniinferencea100-web.modal.run';
const Z_IMAGE_ENDPOINT = 'https://mariecoderinc--zit-a100-stable-fastapi-app.modal.run';

const models = process.argv.slice(2);
const modelIds = models.length ? models : [
  'nova-furry-xl',
  'scyrax-pastel',
  'ani-detox',
  'wai-illustrious',
  'rin-anime-blend',
  'rin-anime-popcute',
  'crystal-cuteness',
  'veretoon-v10',
  'nova-3d-cg-xl',
  'z-image-turbo-a100'
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function endpointFor(modelId) {
  return modelId === 'z-image-turbo-a100' ? Z_IMAGE_ENDPOINT : SDXL_ENDPOINT;
}

function bodyFor(modelId) {
  const common = {
    prompt: `backend contract test for ${modelId}, small golden bee icon on a clean studio table`,
    negative_prompt: 'low quality, blurry, watermark',
    steps: modelId === 'z-image-turbo-a100' ? 8 : 8,
    width: 1024,
    height: 1024
  };

  if (modelId === 'z-image-turbo-a100') {
    return {
      ...common,
      aspect_ratio: '1:1'
    };
  }

  return {
    ...common,
    model: modelId,
    cfg: 4,
    scheduler: 'DPM++ 2M Karras',
    hires_fix: modelId === 'wai-illustrious' || modelId === 'nova-3d-cg-xl'
  };
}

async function readResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('image/')) {
    const image = await res.arrayBuffer();
    return { kind: 'image', bytes: image.byteLength, contentType };
  }

  const text = await res.text();
  if (contentType.includes('application/json')) {
    try {
      return { kind: 'json', contentType, body: JSON.parse(text) };
    } catch {
      return { kind: 'text', contentType, body: text };
    }
  }

  return { kind: 'text', contentType, body: text };
}

async function testModel(modelId) {
  const endpoint = endpointFor(modelId);
  const started = Date.now();
  const submit = await fetch(`${endpoint}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'DreamBees/1.1'
    },
    body: JSON.stringify(bodyFor(modelId))
  });
  const submitPayload = await readResponse(submit);

  if (!submit.ok || submitPayload.kind !== 'json' || !submitPayload.body.job_id) {
    return {
      modelId,
      ok: false,
      phase: 'submit',
      status: submit.status,
      durationMs: Date.now() - started,
      payload: submitPayload
    };
  }

  const jobId = submitPayload.body.job_id;
  for (let poll = 0; poll < 100; poll++) {
    await sleep(poll === 0 ? 1000 : 3000);

    for (const route of ['/result/', '/jobs/']) {
      const res = await fetch(`${endpoint}${route}${jobId}`, {
        headers: { 'User-Agent': 'DreamBees/1.1' }
      });
      if (res.status === 202 || res.status === 404) continue;

      const payload = await readResponse(res);
      if (payload.kind === 'image') {
        return {
          modelId,
          ok: true,
          phase: 'result',
          status: res.status,
          route,
          jobId,
          durationMs: Date.now() - started,
          imageBytes: payload.bytes,
          contentType: payload.contentType
        };
      }

      const status = payload.kind === 'json' && typeof payload.body.status === 'string'
        ? payload.body.status.toLowerCase()
        : '';
      if (['queued', 'running', 'generating', 'processing', 'pending', 'started'].includes(status)) continue;

      return {
        modelId,
        ok: false,
        phase: 'result',
        status: res.status,
        route,
        jobId,
        durationMs: Date.now() - started,
        payload
      };
    }
  }

  return {
    modelId,
    ok: false,
    phase: 'timeout',
    durationMs: Date.now() - started,
    error: 'Timed out waiting for image result'
  };
}

const results = [];
for (const modelId of modelIds) {
  console.log(JSON.stringify({ phase: 'start', modelId }));
  try {
    const result = await testModel(modelId);
    results.push(result);
    console.log(JSON.stringify({ phase: 'result', ...result }, null, 2));
  } catch (error) {
    const result = {
      modelId,
      ok: false,
      phase: 'exception',
      error: error instanceof Error ? error.message : String(error)
    };
    results.push(result);
    console.log(JSON.stringify({ phase: 'result', ...result }, null, 2));
  }
}

const failed = results.filter((result) => !result.ok);
console.log(JSON.stringify({
  phase: 'summary',
  ok: failed.length === 0,
  total: results.length,
  passed: results.length - failed.length,
  failed: failed.length,
  results
}, null, 2));

process.exit(failed.length === 0 ? 0 : 1);
