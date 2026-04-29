


async function testGeneration() {
    const url = 'https://api.dreambeesai.com/api';
    const requestId = `test_${Date.now()}`;
    
    console.log(`[Test] Sending request ${requestId} to ${url}...`);
    
    const body = {
        action: 'createGenerationRequest',
        prompt: 'A test prompt for diagnostic purposes',
        modelId: 'flux-realism', // Example model ID
        requestId: requestId
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Note: We don't have a valid Firebase token here, 
                // so we expect a 401 or 403, but the request should at least be SENT.
                'Authorization': 'Bearer MOCK_TOKEN'
            },
            body: JSON.stringify(body)
        });

        console.log(`[Test] Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log(`[Test] Response: ${text.substring(0, 200)}`);
    } catch (err) {
        console.error(`[Test] Request FAILED:`, err.message);
    }
}

testGeneration();
