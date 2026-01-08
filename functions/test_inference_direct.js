/**
 * Direct test of backend inference endpoints
 * This tests the actual inference APIs without going through Firebase Functions
 */

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
            name: "SDXL Multi-Model (cat-carrier)",
            modelId: "cat-carrier",
            test: async () => {
                const params = new URLSearchParams({
                    prompt: "A beautiful sunset over mountains, cinematic lighting, 4k quality",
                    model: "cat-carrier",
                    negative_prompt: "blurry, low quality",
                    steps: "30",
                    cfg: "7",
                    width: "1344",
                    height: "768",
                    scheduler: "DPM++ 2M Karras"
                });
                const url = `https://cardsorting--sdxl-multi-model-model-web-inference.modal.run?${params.toString()}`;
                console.log(`   Testing: ${url.substring(0, 100)}...`);
                const response = await fetchWithTimeout(url, { timeout: 120000 });
                return response;
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
                const url = "https://cardsorting--zit-only-fastapi-app.modal.run/generate";
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
                const url = "https://cardsorting--qwen-image-2512-qwenimage-api-generate.modal.run";
                console.log(`   Testing: ${url}`);
                const response = await fetchWithTimeout(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                    timeout: 180000 // Increased timeout to 3 minutes
                });
                return response;
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
                const buffer = Buffer.from(await response.arrayBuffer());
                imageSize = buffer.length;
                hasImage = true;
                console.log(`   Response type: ${contentType}`);
                console.log(`   ✓ Image size: ${(imageSize / 1024).toFixed(2)} KB`);
            } else {
                // Try to detect if it's an image anyway
                const buffer = Buffer.from(await response.arrayBuffer());
                imageSize = buffer.length;
                if (imageSize > 1000) { // Likely an image if > 1KB
                    hasImage = true;
                    console.log(`   Response type: Binary (likely image)`);
                    console.log(`   ✓ Image size: ${(imageSize / 1024).toFixed(2)} KB`);
                }
            }

            if (hasImage) {
                console.log(`   ✓ SUCCESS: Image generated successfully`);
                results.push({ 
                    name: testCase.name, 
                    success: true, 
                    elapsed: parseFloat(elapsed),
                    imageSize 
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

