-- Data migration: link all existing objetivos (hitoId IS NULL) to the
-- first hito of their meta, ordered by createdAt ASC.
-- Objetivos that already have a hitoId are left unchanged.
-- Objetivos whose meta has no hitos at all are left unchanged.

UPDATE `Objetivo` o
SET o.hitoId = (
  SELECT h.id
  FROM `Hito` h
  WHERE h.metaId = o.metaId
  ORDER BY h.createdAt ASC
  LIMIT 1
)
WHERE o.hitoId IS NULL
  AND EXISTS (
    SELECT 1 FROM `Hito` h2 WHERE h2.metaId = o.metaId
  );
