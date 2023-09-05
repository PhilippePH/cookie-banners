-- Create a temporary table to hold the count of frame origins for each websiteURL and browser.
CREATE TEMPORARY TABLE frame_origin_counts3 AS
SELECT
    websiteurl,
    browser,
    COUNT(DISTINCT frameorigin) AS frame_origin_count
FROM storagedata
WHERE frameorigin <> websiteurl
    AND visited_by_3_browsers = true
    AND browser <> 'Firefox'
GROUP BY websiteURL, browser;

-- Create a table to store the final result with three columns: 'browser', 'comparison', 'website_count'.
CREATE TABLE distributeNumFrameOrigins AS
SELECT
    fc1.websiteurl,
    fc1.browser,
    CASE
        WHEN fc1.browser IN ('Brave', 'Ghostery') AND fc1.frame_origin_count < fc2.frame_origin_count THEN 'less than Google Chrome'
        WHEN fc1.browser IN ('Brave', 'Ghostery') AND fc1.frame_origin_count = fc2.frame_origin_count THEN 'equal'
        WHEN fc1.browser IN ('Brave', 'Ghostery') AND fc1.frame_origin_count > fc2.frame_origin_count THEN 'more'
    END AS comparison
FROM frame_origin_counts3 fc1
JOIN frame_origin_counts3 fc2
    ON fc1.websiteurl = fc2.websiteurl
    AND fc2.browser = 'Google Chrome';

-- Count the number of websites in each category for each browser.
SELECT
    browser,
    comparison,
    COUNT(*) AS website_count
FROM distributeNumFrameOrigins
GROUP BY browser, comparison;
