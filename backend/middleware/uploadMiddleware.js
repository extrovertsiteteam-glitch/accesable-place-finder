const path = require('path');
const fs = require('fs');
const os = require('os');

const uploadDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'uploads')
  : path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

let multer;
try {
  multer = require('multer');
} catch (e) {
  multer = null;
}

let upload;

if (multer) {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `place-${uniqueSuffix}${ext}`);
    }
  });

  const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
    }
  };

  upload = multer({
    storage: storage,
    limits: {
      fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5) * 1024 * 1024
    },
    fileFilter: fileFilter
  });
} else {
  // Built-in fallback middleware if multer is not installed
  upload = {
    single: (fieldName) => (req, res, next) => {
      // If photoUrl or photo is in body, continue smoothly
      next();
    },
    array: (fieldName) => (req, res, next) => {
      next();
    }
  };
}

module.exports = upload;
