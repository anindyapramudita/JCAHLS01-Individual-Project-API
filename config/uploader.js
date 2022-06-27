const multer = require('multer');
const fs = require('fs');

module.exports = {
    uploader: (directory, fileNamePrefix) => {
        // mendefine lokasi penyimpanan utama
        let defaultDir = './public'

        // Konfigurasi multer
        const storageUploader = multer.diskStorage({
            destination: (req, file, cb) => {
                // Menentukan lokasi penyimpanan file
                const pathDir = directory ? defaultDir + directory : defaultDir;

                // melakukan pemeriksaan pathDir
                if (fs.existsSync(pathDir)) {
                    // Jika directory ada, maka akan langsung digunakan untuk menyimpan file
                    console.log(`Directory ${pathDir} exist ✅`);
                    cb(null, pathDir);
                } else {
                    fs.mkdir(pathDir, { recursive: true }, (err) => cb(err, pathDir));
                    console.log(`Success created ${pathDir} ✅`);
                }
            },
            filename: (req, file, cb) => {
                // Membaca tipe data file
                let ext = file.originalname.split('.');

                // Membuat filename baru
                let filename = fileNamePrefix + Date.now() + '.' + ext[ext.length - 1];

                cb(null, filename);
            }
        });

        const fileFilter = (req, file, cb) => {
            const extFilter = /\.(jpg|png|webp|svg|jpeg)/;

            if (!file.originalname.toLowerCase().match(extFilter)) {
                return cb(new Error('Your file ext is denied ❌', false))
            }

            cb(null, true);
        }

        return multer({ storage: storageUploader, fileFilter });
    }
}