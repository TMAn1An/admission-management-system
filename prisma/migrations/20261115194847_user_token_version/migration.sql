-- Add a per-user session version. Plain ADD COLUMN keeps existing rows (and the Payment.receivedById links) untouched.
ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;
