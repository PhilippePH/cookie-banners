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
  COUNT(DISTINCT R.websiteurl) AS num_websites,
  CASE WHEN R.frameorigin = R.websiteurl THEN 'First Party' ELSE 'Third Party' END AS party_type,
  COUNT(DISTINCT CASE WHEN R.frameorigin = R.websiteurl THEN R.frameorigin ELSE 'No' END) AS count_equal,
  COUNT(DISTINCT CASE WHEN R.frameorigin <> R.websiteurl THEN R.frameorigin ELSE 'no' END) AS count_not_equal
  
FROM
  LatestCrawlData L
INNER JOIN
  requestdata R
ON
  L.browser = R.browser
  AND L.websiteurl = R.websiteurl
  AND L.max_crawlid = R.crawlid
GROUP BY
  R.browser, party_type

