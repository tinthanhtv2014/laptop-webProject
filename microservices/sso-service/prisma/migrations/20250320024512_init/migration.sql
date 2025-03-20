-- CreateTable
CREATE TABLE `providerLogin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL DEFAULT 0,
    `providerIdString` VARCHAR(191) NOT NULL DEFAULT '',
    `providerIdInt` VARCHAR(191) NOT NULL DEFAULT '',
    `methodProvider` VARCHAR(191) NOT NULL DEFAULT '',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `emailAddress` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL DEFAULT '',
    `lastName` VARCHAR(191) NOT NULL DEFAULT '',
    `fullName` VARCHAR(191) NOT NULL DEFAULT '',
    `phoneNumber` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `CodeAddress` INTEGER NOT NULL DEFAULT 0,
    `points` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateDate` DATETIME(3) NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `passwordHash` VARCHAR(191) NOT NULL DEFAULT '',
    `listTenant` VARCHAR(191) NOT NULL DEFAULT '',
    `userUpdate` INTEGER NULL DEFAULT 0,
    `userCreate` INTEGER NULL DEFAULT 0,
    `role` INTEGER NOT NULL DEFAULT 0,
    `privateKey` VARCHAR(191) NOT NULL DEFAULT '',
    `defaultTenant` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `User_emailAddress_key`(`emailAddress`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization` VARCHAR(191) NOT NULL DEFAULT '',
    `roleName` VARCHAR(191) NOT NULL DEFAULT '',
    `roleOder` INTEGER NOT NULL DEFAULT 0,
    `createDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateDate` DATETIME(3) NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `listPermision` LONGTEXT NOT NULL,
    `parentId` INTEGER NOT NULL DEFAULT 0,
    `titleOrganization` VARCHAR(191) NOT NULL DEFAULT '',
    `isEmployed` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NULL DEFAULT 0,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `orderStatus` VARCHAR(191) NOT NULL DEFAULT '',
    `paymentStatus` BOOLEAN NOT NULL DEFAULT false,
    `paymentMethod` VARCHAR(191) NOT NULL DEFAULT '',
    `promotion` LONGTEXT NOT NULL,
    `listProducts` LONGTEXT NOT NULL,
    `user_info` LONGTEXT NOT NULL,
    `totalOrderPrice` DOUBLE NOT NULL DEFAULT 0,
    `discountedVoucherAmount` DOUBLE NOT NULL DEFAULT 0,
    `priceAfterVoucher` DOUBLE NOT NULL DEFAULT 0,
    `orderId` VARCHAR(191) NOT NULL DEFAULT '',
    `createDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateDate` DATETIME(3) NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
