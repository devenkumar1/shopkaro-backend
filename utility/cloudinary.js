// import { v2 as cloudinary } from 'cloudinary';
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


module.exports.uploadToCloudinary = async (fileLocalPath, filename) => {
    try {
        if (!fileLocalPath) return null;
        const response = await cloudinary.uploader.upload(fileLocalPath, { resource_type: "auto", use_filename: true, public_id: filename });
        console.log(response);
        fs.unlinkSync(fileLocalPath);
        return response;
    } catch (error) {
        // fs.unlinkSync()
        console.log(error);
    }
}
