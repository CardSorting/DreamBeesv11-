
async function testMockupEndpoint() {
    const url = 'https://us-central1-dreambees-alchemist.cloudfunctions.net/generateMockupItem';
    
    const body = {
        data: {
            prompt: "test mockup design"
        }
    };

    console.log("--- Testing Standalone Mockup Item Endpoint ---");
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Response Raw:", text.substring(0, 500));
        
        try {
            const data = JSON.parse(text);
            if (data.result && data.result.items) {
                console.log("✅ Success! Registry items found:", data.result.items.length);
            } else {
                console.log("❌ Error or Unexpected Format:", data);
            }
        } catch (e) {
            console.log("❌ Failed to parse JSON response.");
        }
    } catch (err) {
        console.error("❌ Network Error:", err.message);
    }
}

testMockupEndpoint();
