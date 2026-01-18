/**
 * Direct test of backend inference endpoints
 * This tests the actual inference APIs without going through Firebase Functions
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 60000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, {
        ...options,
        signal: controller.signal
    });
    clearTimeout(id);
    return response;
}

async function testModalInference() {
    console.log("\n=== Testing Modal Inference Endpoints ===\n");

    const testCases = [
        {
            name: "SDXL Multi-Model H100 (Turbo)",
            modelId: "cat-carrier-h100",
            test: async () => {
                const baseUrl = "https://mariecoderinc--sdxl-multi-model-h100-model-web.modal.run";
                const body = {
                    prompt: "A beautiful sunset over mountains, cinematic lighting, 4k quality",
                    model: "wai-illustrious",
                    negative_prompt: "blurry, low quality",
                    steps: 30,
                    width: 1344,
                    height: 768,
                    scheduler: "DPM++ 2M Karras"
                };

                console.log(`   Submitting to: ${baseUrl}/generate...`);
                // 1. Submit
                const submitRes = await fetchWithTimeout(`${baseUrl}/generate`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                    timeout: 45000
                });
                if (!submitRes.ok) throw new Error(`Submit Failed: ${submitRes.status} ${await submitRes.text()}`);
                const { job_id } = await submitRes.json();
                console.log(`   Job ID: ${job_id}`);

                // 2. Poll
                for (let i = 0; i < 90; i++) {
                    await new Promise(r => setTimeout(r, 2000));
                    const res = await fetch(`${baseUrl}/result/${job_id}`);
                    if (res.status === 202) continue;
                    if (!res.ok) throw new Error(`Poll Failed: ${res.status}`);
                    const ct = res.headers.get('content-type');
                    if (ct && ct.includes('image/')) return res;
                }
                throw new Error("Timeout polling H100");
            }
        },
        {
            name: "SDXL Multi-Model A10G",
            modelId: "cat-carrier-a10g",
            test: async () => {
                const baseUrl = "https://mariecoderinc--sdxl-multi-model-a10g-model-web.modal.run";
                const body = {
                    prompt: "A beautiful sunset over mountains, cinematic lighting, 4k quality",
                    model: "wai-illustrious",
                    negative_prompt: "blurry, low quality",
                    steps: 30,
                    width: 1024,
                    height: 1024,
                    scheduler: "DPM++ 2M Karras"
                };

                console.log(`   Submitting to: ${baseUrl}/generate...`);
                // 1. Submit
                const submitRes = await fetchWithTimeout(`${baseUrl}/generate`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                    timeout: 45000
                });
                if (!submitRes.ok) throw new Error(`Submit Failed: ${submitRes.status} ${await submitRes.text()}`);
                const { job_id } = await submitRes.json();
                console.log(`   Job ID: ${job_id}`);

                // 2. Poll
                for (let i = 0; i < 90; i++) {
                    await new Promise(r => setTimeout(r, 2000));
                    const res = await fetch(`${baseUrl}/result/${job_id}`);
                    if (res.status === 202) continue;
                    if (!res.ok) throw new Error(`Poll Failed: ${res.status}`);
                    const ct = res.headers.get('content-type');
                    if (ct && ct.includes('image/')) return res;
                }
                throw new Error("Timeout polling A10G");
            }
        },
        {
            name: "ZIT Model",
            modelId: "zit-model",
            test: async () => {
                const body = {
                    prompt: "A beautiful sunset over mountains, cinematic lighting",
                    steps: 30,
                    aspect_ratio: "16:9"
                };
                const url = "https://mariecoderinc--zit-h100-stable-fastapi-app.modal.run/generate";
                console.log(`   Testing: ${url}`);
                const response = await fetchWithTimeout(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                    timeout: 120000
                });
                return response;
            }
        },
        {
            name: "Qwen Image 2512",
            modelId: "qwen-image-2512",
            test: async () => {
                const body = {
                    prompt: "A beautiful sunset over mountains, cinematic lighting",
                    negative_prompt: "blurry, low quality",
                    aspect_ratio: "16:9"
                };
                const url = "https://mariecoderinc--qwen-image-2512-qwenimage-api-generate.modal.run";
                console.log(`   Testing: ${url}`);
                const response = await fetchWithTimeout(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                    timeout: 180000
                });
                return response;
            }
        },
        {
            name: "Gemini 2.5 Flash Image",
            modelId: "gemini-2.5-flash-image",
            test: async () => {
                const { VertexAI } = await import("@google-cloud/vertexai");
                const vertexAI = new VertexAI({ project: 'dreambees-alchemist', location: 'us-central1' });
                const model = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

                const body = { prompt: "A beautiful sunset over mountains, cinematic lighting" };
                console.log(`   Testing: gemini-2.5-flash-image via Vertex AI SDK`);

                const result = await model.generateContent({
                    contents: [{ role: 'user', parts: [{ text: body.prompt }] }]
                });
                const response = await result.response;
                const base64Data = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

                if (!base64Data) return { ok: false, status: 500, statusText: "No Image Data" };

                const buffer = Buffer.from(base64Data, 'base64');
                return {
                    ok: true,
                    status: 200,
                    statusText: "OK",
                    headers: new Map([['content-type', 'image/png']]),
                    arrayBuffer: async () => buffer.buffer
                };
            }
        }
    ];

    const results = [];

    for (const testCase of testCases) {
        console.log(`\n[${testCase.name}]`);
        console.log("─".repeat(60));

        try {
            const startTime = Date.now();
            const response = await testCase.test();
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

            console.log(`   Status: ${response.status} ${response.statusText}`);
            console.log(`   Time: ${elapsed}s`);
            console.log(`   Content-Type: ${response.headers.get("content-type") || "N/A"}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`   ✗ FAILED: ${errorText.substring(0, 200)}`);
                results.push({ name: testCase.name, success: false, error: errorText });
                continue;
            }

            // Check response type
            const contentType = response.headers.get("content-type") || "";
            let imageSize = 0;
            let hasImage = false;
            let buffer = null;

            if (contentType.includes("application/json")) {
                const jsonData = await response.json();
                console.log(`   Response type: JSON`);
                console.log(`   Keys: ${Object.keys(jsonData).join(", ")}`);

                // Check for image data
                const imageFields = ['image', 'data', 'output', 'result', 'url', 'imageUrl', 'image_url'];
                for (const field of imageFields) {
                    if (jsonData[field]) {
                        hasImage = true;
                        const value = jsonData[field];
                        if (typeof value === 'string') {
                            if (value.startsWith('http')) {
                                console.log(`   ✓ Found image URL: ${value.substring(0, 80)}...`);
                            } else if (value.length > 100) {
                                console.log(`   ✓ Found base64 image (${value.length} chars)`);
                            }
                        }
                        break;
                    }
                }

                if (!hasImage && Array.isArray(jsonData) && jsonData.length > 0) {
                    const firstItem = jsonData[0];
                    if (typeof firstItem === 'string' && firstItem.startsWith('http')) {
                        hasImage = true;
                        console.log(`   ✓ Found image URL in array: ${firstItem.substring(0, 80)}...`);
                    }
                }
            } else if (contentType.includes("image/")) {
                buffer = Buffer.from(await response.arrayBuffer());
                imageSize = buffer.length;
                hasImage = true;
                console.log(`   Response type: ${contentType}`);
                console.log(`   ✓ Image size: ${(imageSize / 1024).toFixed(2)} KB`);
            } else {
                // Try to detect if it's an image anyway
                const ab = await response.arrayBuffer();
                buffer = Buffer.from(ab);
                imageSize = buffer.length;
                if (imageSize > 1000) {
                    hasImage = true;
                    console.log(`   Response type: Binary (likely image)`);
                    console.log(`   ✓ Image size: ${(imageSize / 1024).toFixed(2)} KB`);
                }
            }

            if (hasImage && buffer) {
                // Save image
                const filename = `test_output_${testCase.modelId}.png`;
                const outputPath = path.resolve(__dirname, "../../", filename);
                fs.writeFileSync(outputPath, buffer);
                console.log(`   ✓ SUCCESS: Image saved to ${filename}`);
                results.push({
                    name: testCase.name,
                    success: true,
                    elapsed: parseFloat(elapsed),
                    imageSize
                });
            } else if (hasImage) {
                console.log(`   ✓ SUCCESS: Image generated (URL or Base64)`);
                results.push({
                    name: testCase.name,
                    success: true,
                    elapsed: parseFloat(elapsed),
                    imageSize: 0
                });
            } else {
                console.log(`   ⚠ WARNING: Response received but no image detected`);
                results.push({
                    name: testCase.name,
                    success: false,
                    error: "No image data found in response"
                });
            }

        } catch (error) {
            console.error(`   ✗ ERROR: ${error.message}`);
            results.push({ name: testCase.name, success: false, error: error.message });
        }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("TEST SUMMARY");
    console.log("=".repeat(60));

    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    results.forEach(result => {
        const status = result.success ? "✓ PASS" : "✗ FAIL";
        const details = result.success
            ? `(${result.elapsed}s, ${result.imageSize ? (result.imageSize / 1024).toFixed(2) + " KB" : "N/A"})`
            : `(${result.error?.substring(0, 50) || "Unknown error"})`;
        console.log(`  ${status} ${result.name} ${details}`);
    });

    console.log(`\nTotal: ${passed} passed, ${failed} failed`);

    if (failed === 0) {
        console.log("\n✓ All tests passed!");
        process.exit(0);
    } else {
        console.log("\n✗ Some tests failed");
        process.exit(1);
    }
}

// Run the test
testModalInference().catch(error => {
    console.error("\nFatal error:", error);
    process.exit(1);
});
