import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, '../config/serviceAccountKey.json');

if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized');
} else {
    console.warn('Firebase Service Account Key not found at backend/config/serviceAccountKey.json. Push notifications will be disabled.');
}

/**
 * Send push notification to specific tokens
 * @param {string|string[]} tokens - FCM tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data
 */
export const sendPushNotification = async (tokens, title, body, data = {}) => {
    if (!admin.apps.length) return;

    const message = {
        notification: {
            title,
            body
        },
        data: {
            ...data,
            click_action: 'FLUTTER_NOTIFICATION_CLICK' // For Flutter background handling
        },
        tokens: Array.isArray(tokens) ? tokens : [tokens]
    };

    try {
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log('Successfully sent push notification:', response.successCount, 'sent,', response.failureCount, 'failed');
        return response;
    } catch (error) {
        console.error('Error sending push notification:', error);
        return null;
    }
};
