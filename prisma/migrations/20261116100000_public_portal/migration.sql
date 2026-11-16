-- Online applications, online payment attempts, password reset tokens and rate limiting.
-- Payment.reference is added with a plain ADD COLUMN (no table rebuild) so existing payments are untouched.
ALTER TABLE "Payment" ADD COLUMN "reference" TEXT;
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

CREATE TABLE "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "dob" DATETIME NOT NULL,
    "courseId" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "studentId" TEXT,
    "admissionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Application_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Application_number_key" ON "Application"("number");
CREATE INDEX "Application_status_idx" ON "Application"("status");
CREATE INDEX "Application_email_idx" ON "Application"("email");

CREATE TABLE "PaymentAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tranId" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "payerEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INITIATED',
    "gatewayRef" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentAttempt_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PaymentAttempt_tranId_key" ON "PaymentAttempt"("tranId");
CREATE INDEX "PaymentAttempt_admissionId_idx" ON "PaymentAttempt"("admissionId");

CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "count" INTEGER NOT NULL,
    "resetAt" DATETIME NOT NULL
);
