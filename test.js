const fs = require('fs');
const axios = require('axios');
const path = require('path');

// Replace with your Are.na channel slug
const channelSlug = 'camera-work-d_ewkahz-u4';
const channelUrl = `https://api.are.na/v2/channels/${channelSlug}`;

// Replace with your Are.na access token
const accessToken = 'PIVPxaBT0M8_kSBCJni9nIi7FTZMjYibJ17bCVsN5gw';

// Directory to save images
const downloadDir = path.join(__dirname, 'arena_images');

// Create directory if it doesn't exist
if (!fs.existsSync(downloadDir)){
    fs.mkdirSync(downloadDir);
}

// Function to get the file extension based on content type
const getFileExtension = (contentType) => {
    const mimeTypes = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        // Add more MIME types and extensions as needed
    };
    return mimeTypes[contentType] || 'jpg'; // Default to 'jpg' if unknown
};

// Function to download an image
const downloadImage = async (url, filename) => {
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        const contentType = response.headers['content-type'];
        const extension = getFileExtension(contentType);
        const filePath = path.join(downloadDir, `${filename}.${extension}`);
        const writer = fs.createWriteStream(filePath);

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`Error downloading ${url}:`, error.message);
    }
};

// Function to fetch channel data with pagination
const fetchChannelData = async (page = 1, per = 100) => {
    try {
        const response = await axios.get(`${channelUrl}?page=${page}&per=${per}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching channel data:', error.message);
        return null;
    }
};

// Fetch all pages and download images
const fetchAndDownloadAllImages = async () => {
    let page = 1;
    const per = 100; // Number of items per page
    let totalPages = 1;

    while (page <= totalPages) {
        const data = await fetchChannelData(page, per);
        if (!data) break;

        totalPages = Math.ceil(data.length / per); // Update total pages based on response

        for (const block of data.contents) {
            if (block.class === 'Image') {
                const imageUrl = block.image.original.url;
                const filename = path.basename(imageUrl, path.extname(imageUrl));
                await downloadImage(imageUrl, filename);
                console.log(`Downloaded: ${filename}`);
            }
        }
        page++;
    }
};

fetchAndDownloadAllImages();
