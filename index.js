// https://a4f8-2405-4803-c60c-2100-ffff-ffff-ffff-ffd0.ap.ngrok.io

var express = require("express");
var os = require("os");
var path = require("path");
var fs = require("fs");
var router = express.Router();
const fileUpload = require("express-fileupload");

const multer = require("multer");
const MB = 20; // 20 MB
const FILE_SIZE_LIMIT = MB * 1024 * 1024;

const fileSizeLimiter = (req, res, next) => {
  const files = req.files;

  const filesOverLimit = [];
  // Which files are over the limit?
  Object.keys(files).forEach((key) => {
    if (files[key].size > FILE_SIZE_LIMIT) {
      filesOverLimit.push(files[key].name);
    }
  });

  if (filesOverLimit.length) {
    const properVerb = filesOverLimit.length > 1 ? "are" : "is";

    const sentence =
      `Upload failed. ${filesOverLimit.toString()} ${properVerb} over the file size limit of ${MB} MB.`.replaceAll(
        ",",
        ", "
      );

    const message =
      filesOverLimit.length < 3
        ? sentence.replace(",", " and")
        : sentence.replace(/,(?=[^,]*$)/, " and");

    return res.status(413).json({ status: "error", message });
  }

  next();
};

module.exports = fileSizeLimiter;

const filesPayloadExists = (req, res, next) => {
  console.log(req);
  if (!req.files)
    return res.status(400).json({ status: "error", message: "Missing files" });

  next();
};

const fileExtLimiter = (allowedExtArray) => {
  return (req, res, next) => {
    const files = req.files;

    const fileExtensions = [];
    Object.keys(files).forEach((key) => {
      fileExtensions.push(path.extname(files[key].name));
    });

    // Are the file extension allowed?
    const allowed = fileExtensions.every((ext) =>
      allowedExtArray.includes(ext)
    );

    if (!allowed) {
      const message =
        `Upload failed. Only ${allowedExtArray.toString()} files allowed.`.replaceAll(
          ",",
          ", "
        );

      return res.status(422).json({ status: "error", message });
    }

    next();
  };
};

router.post(
  "/upload",
  fileUpload(),
  filesPayloadExists,
  fileExtLimiter([".png", ".jpg", ".jpeg"]),
  fileSizeLimiter,
  async (req, res) => {
    console.log("ahihihii");
    const files = req.files;

    for (const key in files) {
      await new Promise((resolve, reject) => {
        fs.writeFileSync(files[key].name, files[key].data);
        resolve();
        // const writeStream = fs.createWriteStream(__dirname);
        // files[key].data
        //   .pipe(writeStream)
        //   .on("finish", () => resolve(writeStream))
        //   .on("error", (e) => reject(e));
      });
    }
    res.status(200).json({ message: "Hello" });
  }
);

const app = express();
app.use(express.json());
app.use(express.static("public"));
app.use("/images", express.static("images"));
app.use("/api/v1", router);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(PORT);
});
