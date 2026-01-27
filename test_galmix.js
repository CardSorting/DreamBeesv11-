/**
 * Test Galmix Image Generation Endpoint
 */

// Import GalmixClient (assuming we're in the same directory structure)
import { GalmixClient } from './functions/lib/GalmixClient.js';

async function testGalmixEndpoint() {
    console.log('\n🚀 Testing Galmix Image Generation Endpoint\n');
    console.log('='.repeat(60));
    console.log('Endpoint: https://api.dreambeesai.com/v1/generations');
    console.log('='.repeat(60));

    try {
        const client = new GalmixClient();

        console.log('\n📤 Submitting generation job...');
        const startTime = Date.now();

        const result = await client.generateImage(
            'a beautiful landscape with mountains and a lake, vibrant colors, digital art',
            {
                negative_prompt: 'blurry, low quality',
                steps: 30,
                guidance_scale: 7.5
            }
        );

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('\n✅ SUCCESS!');
        console.log(`⏱️  Duration: ${duration} seconds`);
        console.log(`📊 Result status: ${result.status}`);

        if (result.result) {
            const base64Length = result.result.length;
            const estimatedSizeKB = (base64Length * 3 / 4 / 1024).toFixed(2);
            console.log(`🖼️  Image data received: ~${estimatedSizeKB} KB (base64)`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ Galmix endpoint test PASSED');
        console.log('='.repeat(60));

        return { success: true, duration, result };

    } catch (error) {
        console.error('\n❌ FAILED!');
        console.error(`Error: ${error.message}`);
        console.error('\nStack trace:', error.stack);

        console.log('\n' + '='.repeat(60));
        console.log('❌ Galmix endpoint test FAILED');
        console.log('='.repeat(60));

        return { success: false, error: error.message };
    }
}

// Run the test
testGalmixEndpoint()
    .then(result => {
        process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
