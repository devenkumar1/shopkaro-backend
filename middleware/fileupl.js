const multer = require('multer');
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        try {
            const itemPath = path.join('./uploads', req.body.ProductName || req?.body?.params);
            req.img = itemPath; // Set initial path to the directory
            fs.mkdirSync(itemPath, { recursive: true });
            cb(null, itemPath);
        } catch (err) {
            console.error(err.message);
            cb(err);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const fullFilePath = path.join(req.img, `${uniqueSuffix}-${file.originalname}`);
        req.img = fullFilePath; // Update req.img to the full path
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});



const upload = multer({ storage: storage }).array('item_img', 5);

module.exports = upload;
