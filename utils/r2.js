const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

exports.uploadToR2 = async (file, filename) => {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: filename,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await r2.send(command);

  let publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl.startsWith("http")) {
    publicUrl = `https://${publicUrl}`;
  }

  return `${publicUrl}/${filename}`;
};

exports.deleteFromR2 = async (filename) => {
  const command = new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: filename,
  });

  await r2.send(command);
};
