require('dotenv').config({ override: true });

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} = require('@aws-sdk/client-s3');

function getS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });
}

function getBucketName() {
  return process.env.AWS_S3_BUCKET;
}

async function uploadReceiptToS3(file) {
  if (!file) return null;

  const safeOriginalName = file.originalname
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-');

  const key = `receipts/${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeOriginalName}`;

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getBucketName(),
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
  return getS3Client().send(
    new GetObjectCommand({
      Bucket: getBucketName(),
      Key: key
    })
  );
}

async function deleteReceiptFromS3(key) {
  if (!key) return;

  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: key
    })
  );
}

module.exports = {
  uploadReceiptToS3,
  getReceiptFromS3,
  deleteReceiptFromS3
};