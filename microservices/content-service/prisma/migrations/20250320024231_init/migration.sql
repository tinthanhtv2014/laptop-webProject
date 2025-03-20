-- CreateTable
CREATE TABLE `Blog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(500) NOT NULL DEFAULT '',
    `short_description` VARCHAR(500) NOT NULL DEFAULT '',
    `image_url` VARCHAR(191) NOT NULL DEFAULT '',
    `content` LONGTEXT NOT NULL,
    `view_count` INTEGER NOT NULL DEFAULT 0,
    `categoryId` INTEGER NOT NULL,
    `userUpdate` VARCHAR(191) NOT NULL DEFAULT '',
    `createDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateDate` DATETIME(3) NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `isShow` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NOT NULL DEFAULT '',

    UNIQUE INDEX `Blog_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Blog_Category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(500) NOT NULL DEFAULT '',
    `userUpdate` VARCHAR(191) NOT NULL DEFAULT '',
    `createDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateDate` DATETIME(3) NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Blog_Category_name_key`(`name`),
    UNIQUE INDEX `Blog_Category_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Blog_Relation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `blogId` INTEGER NOT NULL,
    `relatedBlogId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comment` (
    `CommentID` INTEGER NOT NULL AUTO_INCREMENT,
    `Content_comment` VARCHAR(191) NOT NULL DEFAULT '',
    `Status_comment` VARCHAR(191) NOT NULL DEFAULT '',
    `rating` INTEGER NOT NULL DEFAULT 0,
    `tenant_id` INTEGER NOT NULL,
    `product_detailsId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `isShow` BOOLEAN NOT NULL DEFAULT false,
    `createDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateDate` DATETIME(3) NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`CommentID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Feedback` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codeName` VARCHAR(191) NOT NULL DEFAULT '',
    `content` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT '',
    `rating` INTEGER NOT NULL DEFAULT 0,
    `userId` INTEGER NULL DEFAULT 0,
    `keyType` VARCHAR(191) NULL DEFAULT '',
    `keyReferenceString` VARCHAR(191) NULL DEFAULT '',
    `keyReferenceInt` INTEGER NULL DEFAULT 0,
    `userInfor` VARCHAR(2000) NOT NULL DEFAULT '',
    `userUpdate` VARCHAR(191) NOT NULL DEFAULT '',
    `createDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateDate` DATETIME(3) NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `value1` LONGTEXT NULL,
    `value2` LONGTEXT NULL,
    `value3` LONGTEXT NULL,
    `number1` DOUBLE NULL DEFAULT 0,
    `number2` DOUBLE NULL DEFAULT 0,
    `number3` DOUBLE NULL DEFAULT 0,
    `bool1` BOOLEAN NULL DEFAULT false,
    `bool2` BOOLEAN NULL DEFAULT false,
    `bool3` BOOLEAN NULL DEFAULT false,
    `userIdAnwser` INTEGER NULL DEFAULT 0,
    `answer` LONGTEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Banner` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `slug` VARCHAR(191) NOT NULL DEFAULT '',
    `imgurl_banner` LONGTEXT NOT NULL,
    `description` VARCHAR(500) NOT NULL DEFAULT '',
    `isShow` INTEGER NOT NULL DEFAULT 0,
    `displayorder_banner` INTEGER NOT NULL DEFAULT 0,
    `userUpdate` VARCHAR(191) NOT NULL DEFAULT '',
    `createDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateDate` DATETIME(3) NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Blog` ADD CONSTRAINT `Blog_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Blog_Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Blog_Relation` ADD CONSTRAINT `Blog_Relation_blogId_fkey` FOREIGN KEY (`blogId`) REFERENCES `Blog`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Blog_Relation` ADD CONSTRAINT `Blog_Relation_relatedBlogId_fkey` FOREIGN KEY (`relatedBlogId`) REFERENCES `Blog`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
