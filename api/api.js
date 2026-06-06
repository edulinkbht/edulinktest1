// api/api.js
export default async function handler(req, res) {
  // If it's a POST request, handle image upload
  if (req.method === 'POST') {
    try {
      // We'll handle the upload via server-side proxy to keep API keys secure
      const formData = await req.formData();
      const file = formData.get('file');
      
      if (!file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      // Use ImgHippo with provided API key
      const imgHippoForm = new FormData();
      imgHippoForm.append('api_key', 'd28bf3c492ad07b53dc4e3f9ce99b072');
      imgHippoForm.append('file', file);
      
      const imgHippoRes = await fetch('https://api.imghippo.com/v1/upload', {
        method: 'POST',
        body: imgHippoForm
      });
      
      const imgHippoData = await imgHippoRes.json();
      console.log('ImgHippo response:', imgHippoData);
      
      if (imgHippoData.status === 200 && imgHippoData.data?.url) {
        return res.status(200).json({ url: imgHippoData.data.url });
      } else {
        return res.status(500).json({ error: imgHippoData.error || 'Upload failed' });
      }

    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({ error: 'Upload failed' });
    }
  }

  // If it's a GET request, return the config (without secrets!)
  const config = {
    firebaseConfig: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MEASUREMENT_ID,
    },
    newtonApiKey: process.env.NEWTON_API_KEY
    // Don't expose imgHippo or Cloudinary secrets to client!
  };

  // Check for critical missing variables
  if (!config.firebaseConfig.apiKey) {
    console.error("Missing Environment Variables in Vercel!");
    return res.status(500).json({ error: "Configuration is missing on server." });
  }

  res.status(200).json(config);
}
