ALTER TABLE requestdata
ADD COLUMN visited_by_all_browsers BOOLEAN;

WITH BrowserCounts AS (
    SELECT websiteurl,
           COUNT(DISTINCT browser) AS distinct_browser_count
    FROM requestdata
    GROUP BY websiteurl
)
UPDATE requestdata AS r
SET visited_by_all_browsers = CASE
    WHEN EXISTS (
        SELECT 1
        FROM BrowserCounts bc
        WHERE bc.websiteurl = r.websiteurl
          AND bc.distinct_browser_count = 4
    )
    THEN TRUE
    ELSE FALSE
END;
