
import { db } from '../functions/src/firebaseInit.js';

async function checkStatus() {
    const requestId = 'req_1777508987965_43hzosqo467';
    const doc = await db.collection('generation_queue').doc(requestId).get();
    if (!doc.exists) {
        console.log("Document not found!");
    } else {
        console.log(JSON.stringify(doc.data(), null, 2));
    }
}

checkStatus().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
});
