const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDirectory = path.join(__dirname, '..', 'uploads', 'products');
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename(_req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`);
  },
});

const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, callback) {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
      return callback(new Error('Only JPEG, PNG, WEBP, and GIF images are allowed'));
    }
    return callback(null, true);
  },
});

function uploadProductImage(req, res, next) {
  imageUpload.single('image')(req, res, (error) => {
    if (error) {
      error.statusCode = 400;
      return next(error);
    }
    return next();
  });
}

module.exports = { uploadProductImage };
