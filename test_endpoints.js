/**
 * Comprehensive Image Generation Endpoint Test
 * Tests all endpoints: SDXL (A10G, H100) and Zit (H100)
 */

const ENDPOINTS = {
    'zit_h100': 'https://mariecoderinc--zit-h100-stable-fastapi-app.modal.run',
    'zit_a10g': 'https://mariecoderinc--zit-a10g-fastapi-app.modal.run',
    'sdxl_a10g': 'https://mariecoderinc--sdxl-multi-model-a10g-model-web.modal.run',
    'sdxl_h100': 'https://mariecoderinc--sdxl-multi-model-h100-model-web.modal.run',
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Test SDXL endpoint (A10G or H100)
 */
async function testSDXLEndpoint(endpointName, baseUrl) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing ${endpointName.toUpperCase()}`);
    console.log('='.repeat(60));

    try {
        // 1. Submit job
        console.log('📤 Submitting generation job...');
        const submitResponse = await fetch(`${baseUrl}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: 'a cute cat, anime style, colorful',
                model: 'wai-illustrious',
                steps: 20,
                width: 1024,
                height: 1024
            })
        });

        if (!submitResponse.ok) {
            throw new Error(`Submit failed: ${submitResponse.status} ${submitResponse.statusText}`);
        }

        const submitData = await submitResponse.json();
        const jobId = submitData.job_id;
        console.log(`✅ Job submitted successfully. Job ID: ${jobId}`);

        // 2. Poll for result
        console.log('⏳ Polling for result...');
        let pollAttempts = 0;
        const maxPolls = 60; // 60 attempts * 2s = 2 minutes max

        while (pollAttempts < maxPolls) {
            pollAttempts++;
            await sleep(2000); // Wait 2 seconds between polls

            const resultResponse = await fetch(`${baseUrl}/result/${jobId}`);
            const contentType = resultResponse.headers.get('content-type') || '';

            // Check if we got the image
            if (contentType.includes('image/')) {
                const imageBuffer = await resultResponse.arrayBuffer();
                console.log(`✅ SUCCESS! Received image (${imageBuffer.byteLength} bytes) after ${pollAttempts} polls`);
                return { success: true, jobId, pollAttempts, bytes: imageBuffer.byteLength };
            }

            // Check if we got JSON status
            if (contentType.includes('application/json')) {
                const statusData = await resultResponse.json();
                console.log(`   Poll ${pollAttempts}/${maxPolls}: Status = ${statusData.status}`);

                if (statusData.status === 'failed') {
                    throw new Error(`Job failed: ${statusData.error || 'Unknown error'}`);
                }

                if (statusData.status === 'completed') {
                    console.log('⚠️  Job marked completed but no image received');
                    return { success: false, error: 'Completed but no image' };
                }

                // Continue polling for 'queued' or 'generating'
                continue;
            }

            // Handle 202 (still processing)
            if (resultResponse.status === 202) {
                console.log(`   Poll ${pollAttempts}/${maxPolls}: Still processing (202)`);
                continue;
            }

            // Unexpected response
            const text = await resultResponse.text();
            console.log(`⚠️  Unexpected response: ${resultResponse.status} - ${text.substring(0, 200)}`);
        }

        throw new Error(`Timeout after ${maxPolls} polling attempts`);

    } catch (error) {
        console.error(`❌ FAILED: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Test Zit endpoint (H100)
 */
async function testZitEndpoint(endpointName, baseUrl) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing ${endpointName.toUpperCase()}`);
    console.log('='.repeat(60));

    try {
        // 1. Submit job
        console.log('📤 Submitting generation job...');
        const submitResponse = await fetch(`${baseUrl}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: 'a futuristic city, cyberpunk style, neon lights',
                steps: 20,
                width: 1024,
                height: 1024
            })
        });

        if (!submitResponse.ok) {
            throw new Error(`Submit failed: ${submitResponse.status} ${submitResponse.statusText}`);
        }

        const submitData = await submitResponse.json();
        const jobId = submitData.job_id;
        console.log(`✅ Job submitted successfully. Job ID: ${jobId}`);

        // 2. Poll for result
        console.log('⏳ Polling for result...');
        let pollAttempts = 0;
        const maxPolls = 60;

        while (pollAttempts < maxPolls) {
            pollAttempts++;
            await sleep(2000);

            let resultResponse = await fetch(`${baseUrl}/result/${jobId}`);

            // If 404, try alternate endpoint
            if (resultResponse.status === 404) {
                resultResponse = await fetch(`${baseUrl}/jobs/${jobId}`);
            }

            const contentType = resultResponse.headers.get('content-type') || '';

            // Check if we got the image
            if (contentType.includes('image/')) {
                const imageBuffer = await resultResponse.arrayBuffer();
                console.log(`✅ SUCCESS! Received image (${imageBuffer.byteLength} bytes) after ${pollAttempts} polls`);
                return { success: true, jobId, pollAttempts, bytes: imageBuffer.byteLength };
            }

            // Handle 202 (still processing)
            if (resultResponse.status === 202) {
                console.log(`   Poll ${pollAttempts}/${maxPolls}: Still processing (202)`);
                continue;
            }

            // Check for JSON response
            if (contentType.includes('application/json')) {
                const statusData = await resultResponse.json();
                console.log(`   Poll ${pollAttempts}/${maxPolls}: Status = ${statusData.status}`);

                if (statusData.status === 'failed') {
                    throw new Error(`Job failed: ${statusData.error || 'Unknown error'}`);
                }
                continue;
            }

            // Unexpected response
            const text = await resultResponse.text();
            console.log(`⚠️  Unexpected response: ${resultResponse.status} - ${text.substring(0, 200)}`);
        }

        throw new Error(`Timeout after ${maxPolls} polling attempts`);

    } catch (error) {
        console.error(`❌ FAILED: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Main test runner
 */
async function runTests() {
    console.log('\n🚀 Starting Image Generation Endpoint Tests\n');
    console.log('Testing the following endpoints:');
    Object.entries(ENDPOINTS).forEach(([name, url]) => {
        console.log(`  - ${name}: ${url}`);
    });

    const results = {};

    // Test SDXL A10G
    results.sdxl_a10g = await testSDXLEndpoint('sdxl_a10g', ENDPOINTS.sdxl_a10g);

    // Test Zit H100
    results.zit_h100 = await testZitEndpoint('zit_h100', ENDPOINTS.zit_h100);

    // Print summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));

    Object.entries(results).forEach(([endpoint, result]) => {
        const status = result.success ? '✅ PASSED' : '❌ FAILED';
        const details = result.success
            ? `(${result.pollAttempts} polls, ${result.bytes} bytes)`
            : `(${result.error})`;
        console.log(`${endpoint.padEnd(20)} ${status} ${details}`);
    });

    const allPassed = Object.values(results).every(r => r.success);
    console.log(`\n${allPassed ? '✅ All tests passed!' : '⚠️  Some tests failed'}`);
}

// Run tests
runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
