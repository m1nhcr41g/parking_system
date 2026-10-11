const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDir = path.join(
    process.cwd(),
    "uploads",
    "registration-documents"
);

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `${crypto.randomUUID()}${ext}`;
        cb(null, filename);
    }
});

const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf"];

const upload = multer({
    storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();

        if (!allowedExtensions.includes(ext)) {
            return cb(new Error("INVALID_FILE_TYPE"));
        }

        cb(null, true);
    }
});

module.exports = upload;