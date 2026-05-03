require('dotenv').config({ override: true });
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const bucketName = process.env.AWS_S3_BUCKET;
      console.log('AWS_S3_BUCKET =', bucketName);

async function uploadReceiptToS3(file) {
  if (!file) return null;

  const safeOriginalName = file.originalname
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-');

  const key = `receipts/${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeOriginalName}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    })
  );

  return {
    key,
    name: file.originalname,
    mime: file.mimetype
  };
}

async function getReceiptFromS3(key) {
  return s3.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    })
  );
}

async function deleteReceiptFromS3(key) {
  if (!key) return;

  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key
    })
  );
}

module.exports = {
  uploadReceiptToS3,
  getReceiptFromS3,
  deleteReceiptFromS3
};