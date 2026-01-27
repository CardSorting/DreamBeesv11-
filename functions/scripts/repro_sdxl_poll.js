import fetch from 'node-fetch'; // Or native fetch if Node 22

const ENDPOINT = 'https://mariecoderinc--sdxl-multi-model-a10g-model-web.modal.run';

async function run() {
    const body = {
        prompt: "A cute cat",
        model: "wai-illustrious",
        negative_prompt: "",
        steps: 30,
        width: 1024,
        height: 1024,
        scheduler: 'DPM++ 2M Karras'
    };

    console.log("Submitting request...");
    const submitRes = await fetch(`${ENDPOINT}/generate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "User-Agent": "DreamBees/1.1"
        },
        body: JSON.stringify(body)
    });

    if (!submitRes.ok) {
        console.error(`Submission failed: ${submitRes.status}`);
        console.error(await submitRes.text());
        return;
    }

    const { job_id } = await submitRes.json();
    console.log(`Job ID: ${job_id}`);

    for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 4000));
        console.log(`Poll attempt ${i + 1}...`);


        // FAILSAFE TEST: Force check jobs endpoint to see what it returns
        // let resultRes = await fetch(`${ENDPOINT}/result/${job_id}`);
        // if (resultRes.status === 404) resultRes = await fetch(`${ENDPOINT}/jobs/${job_id}`);

        let res = await fetch(`${ENDPOINT}/result/${job_id}`);
        // Fallback logic from worker
        if (res.status === 404) {
            console.log("404 on result endpoint, trying jobs endpoint...");
            res = await fetch(`${ENDPOINT}/jobs/${job_id}`);
        }

        console.log(`Status: ${res.status}`);
        console.log(`Content-Type: ${res.headers.get('content-type')}`);

        if (res.status === 202) {
            console.log("Still processing...");
            continue;
        }

        if (res.ok) {
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('image/')) {
                console.log("Success! Received image.");
                break;
            } else {
                console.log("Received 200 OK but Content-Type is NOT image.");
                const text = await res.text();
                console.log("Body:", text);
            }
        } else {
            console.log("Request failed (not 200/202)");
            const text = await res.text();
            console.log("Body:", text);
            break;
        }
    }
}

run();
