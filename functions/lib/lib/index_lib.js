"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onFollowChange = exports.walletGuard = exports.staleJobCleanup = exports.voiceWorker = exports.backgroundWorker = exports.urgentWorker = exports.web = exports.api = void 0;
require("./firebaseInit.js"); // Ensure Firebase Admin is initialized
const api_js_1 = require("./api.js");
Object.defineProperty(exports, "api", { enumerable: true, get: function () { return api_js_1.api; } });
const web_js_1 = require("./web.js");
Object.defineProperty(exports, "web", { enumerable: true, get: function () { return web_js_1.web; } });
const queues_js_1 = require("./workers/queues.js");
Object.defineProperty(exports, "urgentWorker", { enumerable: true, get: function () { return queues_js_1.urgentWorker; } });
Object.defineProperty(exports, "backgroundWorker", { enumerable: true, get: function () { return queues_js_1.backgroundWorker; } });
Object.defineProperty(exports, "voiceWorker", { enumerable: true, get: function () { return queues_js_1.voiceWorker; } });
const recovery_js_1 = require("./workers/recovery.js");
Object.defineProperty(exports, "staleJobCleanup", { enumerable: true, get: function () { return recovery_js_1.staleJobCleanup; } });
const walletGuard_js_1 = require("./triggers/walletGuard.js");
Object.defineProperty(exports, "walletGuard", { enumerable: true, get: function () { return walletGuard_js_1.walletGuard; } });
var followTrigger_js_1 = require("./triggers/followTrigger.js");
Object.defineProperty(exports, "onFollowChange", { enumerable: true, get: function () { return followTrigger_js_1.onFollowChange; } });
export {};
//# sourceMappingURL=index_lib.js.map