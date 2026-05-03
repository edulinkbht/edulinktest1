const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { file, resource_type = 'auto' } = req.body;

        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const uploadResponse = await cloudinary.uploader.upload(file, {
            resource_type: resource_type, // 'image' or 'video' or 'auto'
            folder: 'edulink_uploads'
        });

        return res.status(200).json({
            success: true,
            url: uploadResponse.secure_url
        });
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
