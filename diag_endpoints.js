
import fetch from 'node-fetch';

async function testZit() {
    console.log("Testing Zit Submission (No User-Agent)...");
    const url = 'https://mariecoderinc--zit-h100-stable-fastapi-app.modal.run/generate';
    const body = {
        prompt: "test",
        steps: 10,
        width: 1024,
        height: 1024
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        console.log("Zit Response Status:", res.status);
        const data = await res.json();
        console.log("Zit Response Data:", data);
    } catch (e) {
        console.error("Zit Error:", e.message);
    }
}

async function testGalmix() {
    console.log("Testing Galmix Submission (No User-Agent)...");
    const url = 'https://api.dreambeesai.com/v1/generations';
    const body = {
        prompt: "test",
        negative_prompt: "",
        steps: 10,
        guidance_scale: 7.5
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        console.log("Galmix Response Status:", res.status);
        const data = await res.json();
        console.log("Galmix Response Data:", data);
    } catch (e) {
        console.error("Galmix Error:", e.message);
    }
}

async function run() {
    await testZit();
    console.log("---");
    await testGalmix();
}

run();
