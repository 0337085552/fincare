USE fincare_db;

ALTER TABLE transactions
ADD COLUMN receipt_key VARCHAR(500) NULL,
ADD COLUMN receipt_name VARCHAR(255) NULL,
ADD COLUMN receipt_mime VARCHAR(100) NULL;
