const cloudinary = require('cloudinary').v2;

// Cloudinary will automatically use CLOUDINARY_URL if it's in process.env
// Otherwise, we use individual keys
if (!process.env.CLOUDINARY_URL) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check if Cloudinary is configured (either via URL or individual keys)
    const isConfigured = process.env.CLOUDINARY_URL || 
                        (process.env.CLOUDINARY_CLOUD_NAME && 
                         process.env.CLOUDINARY_API_KEY && 
                         process.env.CLOUDINARY_API_SECRET);

    if (!isConfigured) {
        return res.status(500).json({ 
            success: false, 
            error: 'Cloudinary is not configured. Please set CLOUDINARY_URL or (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) environment variables.' 
        });
    }

    try {
        const { file, resource_type = 'auto' } = req.body;

        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        console.log('Uploading to Cloudinary...', { resource_type });

        const uploadResponse = await cloudinary.uploader.upload(file, {
            resource_type: resource_type,
            folder: 'edulink_uploads'
        });

        return res.status(200).json({
            success: true,
            url: uploadResponse.secure_url,
            resource_type: uploadResponse.resource_type,
            format: uploadResponse.format
        });
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
