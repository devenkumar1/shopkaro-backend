const fs = require('fs');
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        try {
            // const itemPath = path.join('./temp', req.params.id || "test");
            const itemPath = './temp';
            fs.mkdirSync(itemPath, { recursive: true });
            console.log(itemPath);
            cb(null, itemPath);

        } catch (error) {
            console.log(error);
            cb(null);
        }
    },
    filename: function (req, file, cb) {
        // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, (req.params.id || Date.now()) + '-' + '.png')
    }
})
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, './uploads');
//     },
//     filename: function (req, file, cb) {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
//         cb(null, file.fieldname + '-' + uniqueSuffix)
//     }
// })

// const uploadUserProfile = multer({ storage: storage })
const uploadUserProfile = multer({ storage: storage }).single('img');
module.exports = uploadUserProfile;