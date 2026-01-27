import { logger } from "../../lib/utils.js";

export const handlePusherAuth = async (req, res) => {
    // Note: Soketi/Pusher sends auth request as application/x-www-form-urlencoded
    // but the client-side pusher-js can be configured to send JSON.
    // We'll support both for robustness.
    const socketId = req.body.socket_id || req.body.socketId;
    const channelName = req.body.channel_name || req.body.channelName;
    const authHeader = req.headers.authorization;

    if (!socketId || !channelName || !authHeader || !authHeader.startsWith('Bearer ')) {
        logger.error("[PusherAuth] Missing parameters:", { socketId, channelName, hasAuth: !!authHeader });
        return res.status(403).send('Forbidden: Missing parameters or invalid auth header');
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const { getAuth } = await import("firebase-admin/auth");
        const decodedToken = await getAuth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Basic channel authorization logic:
        // Format: private-chat-${imageId}-${userId}
        if (channelName.startsWith('private-chat-')) {
            const parts = channelName.split('-');
            const targetUserId = parts[parts.length - 1];

            if (uid !== targetUserId) {
                logger.warn(`[PusherAuth] User ${uid} attempted to access channel ${channelName} belonging to ${targetUserId}`);
                return res.status(403).send('Forbidden: Access denied to this channel');
            }
        }

        const { initPusher } = await import("../../lib/persona/broadcaster.js");
        const pusher = await initPusher();

        if (!pusher) {
            logger.error("[PusherAuth] Pusher not initialized");
            return res.status(500).send('Internal Server Error: Pusher configuration missing');
        }

        const auth = pusher.authenticate(socketId, channelName, {
            user_id: uid,
            user_info: {
                displayName: decodedToken.name || 'Anonymous',
                photoURL: decodedToken.picture || ''
            }
        });
        res.json(auth);
    } catch (error) {
        logger.error("[PusherAuth] Auth failed:", error);
        res.status(403).send('Forbidden: Invalid token');
    }
};
