const cloudinary = require('cloudinary').v2;
const axios = require('axios');
const FormData = require('form-data');

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

    try {
        const { file, resource_type = 'auto' } = req.body;

        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        // Determine if it's a video or image based on resource_type or data URI
        const isVideo = resource_type === 'video' || file.startsWith('data:video/');
        const isImage = resource_type === 'image' || file.startsWith('data:image/');

        if (isVideo) {
            // Check if Cloudinary is configured
            const isCloudinaryConfigured = process.env.CLOUDINARY_URL || 
                                          (process.env.CLOUDINARY_CLOUD_NAME && 
                                           process.env.CLOUDINARY_API_KEY && 
                                           process.env.CLOUDINARY_API_SECRET);

            if (!isCloudinaryConfigured) {
                return res.status(500).json({ 
                    success: false, 
                    error: 'Cloudinary is not configured for video uploads.' 
                });
            }

            console.log('Uploading video to Cloudinary...');
            const uploadResponse = await cloudinary.uploader.upload(file, {
                resource_type: 'video',
                folder: 'edulink_videos'
            });

            return res.status(200).json({
                success: true,
                url: uploadResponse.secure_url,
                resource_type: 'video'
            });

        } else if (isImage) {
            // Check if ImgHippo is configured
            if (!process.env.IMGHIPPO_API_KEY) {
                return res.status(500).json({ 
                    success: false, 
                    error: 'ImgHippo API key is missing for image uploads.' 
                });
            }

            console.log('Uploading image to ImgHippo...');
            
            // Extract base64 content without data URI prefix if present
            const base64Content = file.includes(',') ? file.split(',')[1] : file;
            const buffer = Buffer.from(base64Content, 'base64');

            const form = new FormData();
            form.append('api_key', process.env.IMGHIPPO_API_KEY);
            form.append('file', buffer, { filename: 'upload.jpg' });

            const response = await axios.post('https://api.imghippo.com/v1/upload', form, {
                headers: form.getHeaders()
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
        console.error('Upload error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Upload failed'
        });
    }
};
