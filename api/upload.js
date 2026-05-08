const cloudinary = require('cloudinary').v2;
const axios = require('axios');
const FormData = require('form-data');

// Configure Cloudinary
if (process.env.CLOUDINARY_URL) {
    // If CLOUDINARY_URL is present, it's used automatically by some SDK methods,
    // but we can also set it explicitly to be sure.
    cloudinary.config({
        cloudinary_url: process.env.CLOUDINARY_URL
    });
} else {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

module.exports = async (req, res) => {
    // Increase timeout for the response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { file, resource_type } = req.body;

        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        // Check file size (Vercel limit is 4.5MB for the entire request)
        // Base64 string length is a good approximation
        const approxSizeInBytes = (file.length * 3) / 4;
        if (approxSizeInBytes > 4 * 1024 * 1024) {
            return res.status(413).json({ 
                success: false, 
                error: 'File too large for server upload. Try a smaller file or use fallback.' 
            });
        }

        // Determine if it's a video or image
        const isVideo = resource_type === 'video' || file.startsWith('data:video/');
        const isImage = resource_type === 'image' || file.startsWith('data:image/');

        if (isVideo) {
            console.log('Video upload requested');
            const uploadResponse = await cloudinary.uploader.upload(file, {
                resource_type: 'video',
                folder: 'edulink_videos',
                timeout: 60000 // 60 seconds
            });

            return res.status(200).json({
                success: true,
                url: uploadResponse.secure_url,
                resource_type: 'video'
            });

        } else if (isImage) {
            console.log('Image upload requested');
            if (!process.env.IMGHIPPO_API_KEY) {
                throw new Error('IMGHIPPO_API_KEY is not configured');
            }

            const base64Content = file.includes(',') ? file.split(',')[1] : file;
            const buffer = Buffer.from(base64Content, 'base64');

            const form = new FormData();
            form.append('api_key', process.env.IMGHIPPO_API_KEY);
            form.append('file', buffer, { filename: 'upload.jpg' });

            const response = await axios.post('https://api.imghippo.com/v1/upload', form, {
                headers: form.getHeaders(),
                timeout: 30000 // 30 seconds
            });

            if (response.data && response.data.success) {
                return res.status(200).json({
                    success: true,
                    url: response.data.data.url,
                    resource_type: 'image'
                });
            } else {
                throw new Error(response.data?.message || 'ImgHippo upload failed');
            }

        } else {
            return res.status(400).json({ 
                success: false, 
                error: 'this file is not supported' 
            });
        }

    } catch (error) {
        console.error('Upload API Error:', error.message);
        return res.status(error.response?.status || 500).json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
};
