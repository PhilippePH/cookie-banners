WITH LatestCrawlData AS (
  SELECT
    browser,
    websiteurl,
    MAX(crawlid) AS max_crawlid
  FROM
    storagedata
  WHERE
    visited_by_all_browsers = true
  GROUP BY
    browser,
    websiteurl
)
SELECT
  S.browser,
  S.storagetype,
  COUNT(*) AS NumStorage
FROM
  LatestCrawlData L
INNER JOIN
  storagedata S
ON
  L.browser = S.browser
  AND L.websiteurl = S.websiteurl
  AND L.max_crawlid = S.crawlid
GROUP BY
  S.browser,
  S.storagetype