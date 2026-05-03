-- AlterTable Hito: add color
ALTER TABLE `Hito` ADD COLUMN `color` VARCHAR(191) NOT NULL DEFAULT 'sand';

-- AlterTable Meta: add concrete achievement date
ALTER TABLE `Meta` ADD COLUMN `fecha_logro` DATETIME(3) NULL;
