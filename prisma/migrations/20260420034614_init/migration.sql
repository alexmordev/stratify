-- CreateTable
CREATE TABLE `Meta` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `title_en` VARCHAR(191) NOT NULL,
    `why` VARCHAR(191) NOT NULL,
    `why_en` VARCHAR(191) NOT NULL,
    `success` VARCHAR(191) NOT NULL,
    `success_en` VARCHAR(191) NOT NULL,
    `horizon` VARCHAR(191) NOT NULL,
    `horizon_en` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Objetivo` (
    `id` VARCHAR(191) NOT NULL,
    `metaId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `title_en` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT 'sand',
    `weeklyLoad` INTEGER NOT NULL DEFAULT 1,
    `done` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tarea` (
    `id` VARCHAR(191) NOT NULL,
    `objId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `title_en` VARCHAR(191) NOT NULL,
    `day` INTEGER NOT NULL,
    `start` DOUBLE NOT NULL,
    `dur` DOUBLE NOT NULL,
    `done` BOOLEAN NOT NULL DEFAULT false,
    `subtasks` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Objetivo` ADD CONSTRAINT `Objetivo_metaId_fkey` FOREIGN KEY (`metaId`) REFERENCES `Meta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tarea` ADD CONSTRAINT `Tarea_objId_fkey` FOREIGN KEY (`objId`) REFERENCES `Objetivo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
