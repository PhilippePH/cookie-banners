WITH RankingData AS (
  SELECT
    crawlid,
    browser,
    websiteurl,
    specificurl,
	contenttype,
	contentlength,
	visited_by_all_browsers,
    ROW_NUMBER() OVER (PARTITION BY websiteurl ORDER BY crawlid DESC) AS RowNum
  FROM responsedata
)
DELETE FROM responsedata
WHERE (websiteurl, crawlid, browser, specificurl) NOT IN (
  SELECT websiteurl, crawlid, browser, specificurl
  FROM RankingData
  WHERE RowNum = 1
);
-- doesnèt work in less than an hour currently