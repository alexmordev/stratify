-- Hito table was already created in a prior partial run — skip CREATE TABLE.

-- AlterTable Meta: add rich goal fields (TEXT NULL — MySQL disallows DEFAULT on TEXT)
ALTER TABLE `Meta`
    ADD COLUMN `identidad_deseada` TEXT NULL,
    ADD COLUMN `obstaculo_interno` TEXT NULL,
    ADD COLUMN `plan_respuesta` TEXT NULL;

-- AlterTable Objetivo: add milestone link + rich objective fields
ALTER TABLE `Objetivo`
    ADD COLUMN `hitoId` VARCHAR(191) NULL,
    ADD COLUMN `tipo` VARCHAR(191) NOT NULL DEFAULT 'Aprendizaje',
    ADD COLUMN `metrica` TEXT NULL,
    ADD COLUMN `fecha_limite` DATETIME(3) NULL,
    ADD COLUMN `intencion_si_entonces` TEXT NULL,
    ADD COLUMN `seguimiento` TEXT NULL;

-- AddForeignKey: Hito → Meta
ALTER TABLE `Hito` ADD CONSTRAINT `Hito_metaId_fkey` FOREIGN KEY (`metaId`) REFERENCES `Meta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Objetivo → Hito
ALTER TABLE `Objetivo` ADD CONSTRAINT `Objetivo_hitoId_fkey` FOREIGN KEY (`hitoId`) REFERENCES `Hito`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
