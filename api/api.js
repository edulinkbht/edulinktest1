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

      // Try Cloudinary first if available
      if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
        const cloudinaryForm = new FormData();
        cloudinaryForm.append('file', file);
        cloudinaryForm.append('upload_preset', 'unsigned_preset'); // Or use signed upload
        
        const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`, {
          method: 'POST',
          body: cloudinaryForm
        });
        
        const cloudinaryData = await cloudinaryRes.json();
        if (cloudinaryData.secure_url) {
          return res.status(200).json({ url: cloudinaryData.secure_url });
        }
      }

      // Try ImgHippo if Cloudinary fails
      if (process.env.IMGHIPPO_API_KEY) {
        const imgHippoForm = new FormData();
        imgHippoForm.append('api_key', process.env.IMGHIPPO_API_KEY);
        imgHippoForm.append('file', file);
        
        const imgHippoRes = await fetch('https://api.imghippo.com/v1/upload', {
          method: 'POST',
          body: imgHippoForm
        });
        
        const imgHippoData = await imgHippoRes.json();
        if (imgHippoData.status === 200 && imgHippoData.data?.url) {
          return res.status(200).json({ url: imgHippoData.data.url });
        }
      }

      return res.status(500).json({ error: 'All upload methods failed' });

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
