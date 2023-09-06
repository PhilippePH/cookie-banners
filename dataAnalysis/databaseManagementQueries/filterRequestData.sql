WITH LatestCrawlData AS (
  SELECT
    browser,
    websiteurl,
    MAX(crawlid) AS max_crawlid
  FROM
    requestdata
  WHERE
    visited_by_all_browsers = true
  GROUP BY
    browser,
    websiteurl
)
SELECT
  R.browser,
  COUNT(DISTINCT(R.frameorigin))
FROM
  LatestCrawlData L
INNER JOIN
  requestdata R
ON
  L.browser = R.browser
  AND L.websiteurl = R.websiteurl
  AND L.max_crawlid = R.crawlid
GROUP BY
  R.browser