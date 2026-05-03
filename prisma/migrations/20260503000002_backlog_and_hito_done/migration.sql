-- Make Tarea.day nullable
ALTER TABLE `Tarea` MODIFY `day` INTEGER NULL;
-- Make Tarea.start nullable
ALTER TABLE `Tarea` MODIFY `start` DOUBLE NULL;
-- Add done to Hito
ALTER TABLE `Hito` ADD COLUMN `done` BOOLEAN NOT NULL DEFAULT false;
