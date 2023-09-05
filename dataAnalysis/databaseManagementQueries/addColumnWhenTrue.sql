-- Step 1: Add the new column with a default value of NULL
ALTER TABLE storagedata
ADD visited_by_3_browsers BOOLEAN DEFAULT NULL;

-- Step 2: Update the new column based on the condition
UPDATE storagedata
SET visited_by_3_browsers = TRUE
WHERE visited_by_all_browsers = TRUE;