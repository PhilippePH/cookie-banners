WITH TrancheRanges AS (
  SELECT
	distinct(websiteurl),
    (FLOOR(website_index / 2000) * 2000) AS TrancheStart,
    ((FLOOR(website_index / 2000) * 2000) + 1999) AS TrancheEnd
  FROM
    url_ind
  WHERE
    website_index >= 0 AND website_index <= 100000
),
BannerCounts AS (
  SELECT
    T.TrancheStart,
    T.TrancheEnd,
    COUNT(distinct(CBD.websiteurl)) AS BannerPresentCount
  FROM
    TrancheRanges T
  INNER JOIN
    bannerdata CBD
  ON
    CBD.websiteurl = T.websiteurl
  WHERE 
    CBD.bannerPresent = TRUE
  AND 	
	CBD.browser = 'Google Chrome'
  GROUP BY
    T.TrancheStart, T.TrancheEnd
),
SampleCount AS (
  SELECT
    T.TrancheStart,
    T.TrancheEnd,
    COUNT(distinct(CBD.websiteurl)) AS SampleSize
  FROM
    TrancheRanges T
  INNER JOIN -- keeping only bannerData websites.
    bannerdata CBD
  ON
    CBD.websiteurl = T.websiteurl
-- removed banner = true
  AND 	
	CBD.browser = 'Google Chrome'
  GROUP BY
    T.TrancheStart, T.TrancheEnd
)
SELECT
  T.TrancheStart,
  T.TrancheEnd,
  COALESCE(B.BannerPresentCount, 0) AS BannerPresentCount,
  S.SampleSize,
  (B.BannerPresentCount::float / S.SampleSize::float) * 100 as PercentageBannerPresent
FROM
  TrancheRanges T
INNER JOIN
  SampleCount S
ON
  T.TrancheStart = S.TrancheStart
AND
  T.TrancheEnd = S.TrancheEnd
INNER JOIN
  BannerCounts B
ON
  T.TrancheStart = B.TrancheStart
AND
  T.TrancheEnd = B.TrancheEnd
INNER JOIN
  url_ind I
ON
  I.website_index >= T.TrancheStart
AND
  I.website_index <= T.TrancheEnd
GROUP BY
  T.TrancheStart, T.TrancheEnd, B.BannerPresentCount, S.SampleSize
ORDER BY
  T.TrancheStart;
