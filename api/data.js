// api/data.js
export default function handler(req, res) {
  // This pulls from the vercel environment or .env file
  const config = {
    firebaseConfig: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MEASUREMENT_ID,
    }
  };

  // Check for critical missing variables
  if (!config.firebaseConfig.apiKey) {
    console.error("Missing Environment Variables in Vercel!");
    return res.status(500).json({ error: "Configuration is missing on server." });
  }

  res.status(200).json(config);
}
