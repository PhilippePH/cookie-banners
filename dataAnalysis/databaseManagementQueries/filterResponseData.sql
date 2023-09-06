WITH LatestCrawlData AS (
  SELECT
    browser,
    websiteurl,
    MAX(crawlid) AS max_crawlid
  FROM
    responsedata
  WHERE
    visited_by_all_browsers = true
  GROUP BY
    browser,
    websiteurl
)
SELECT
  R.browser,
  COUNT(*) AS NumReponses,
  COUNT(DISTINCT(R.websiteurl))
FROM
  LatestCrawlData L
INNER JOIN
  responsedata R
ON
  L.browser = R.browser
  AND L.websiteurl = R.websiteurl
  AND L.max_crawlid = R.crawlid
 WHERE R.websiteurl in (SELECT * from not_timedout_for_responses)
GROUP BY
  R.browser