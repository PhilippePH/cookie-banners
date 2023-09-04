ALTER TABLE bannerdata
ADD COLUMN visited_by_3_browsers BOOLEAN;

WITH BrowserCounts AS (
    SELECT websiteurl,
           COUNT(DISTINCT browser) AS distinct_browser_count
    FROM bannerdata
    WHERE browser IN ('Brave', 'Google Chrome', 'Ghostery')
    GROUP BY websiteurl
)
UPDATE bannerdata AS r
SET visited_by_3_browsers = CASE
    WHEN EXISTS (
        SELECT 1
        FROM BrowserCounts bc
        WHERE bc.websiteurl = r.websiteurl
          AND bc.distinct_browser_count = 3 -- Checking for Brave, Google Chrome, and Ghostery
    )
    THEN TRUE
    ELSE FALSE
END;