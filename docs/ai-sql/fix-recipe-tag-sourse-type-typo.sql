-- Fix typo in recipe_tag_reference: 'sourse_type' -> 'course_type'
-- Affected record: "Main Dishes" (id = 11)
UPDATE recipe_tag_reference
SET tag_type = 'course_type'
WHERE tag_type = 'sourse_type';
