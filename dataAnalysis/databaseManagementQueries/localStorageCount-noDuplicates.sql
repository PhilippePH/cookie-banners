-- this returns the number of websites that have duplicate values across crawls.
-- select sub.browser, count(*)
-- from (
-- 	select browser, websiteurl, count(distinct(crawlid))
-- 	from storagedata
-- 	where crawlid is not null
-- 	group by browser, websiteurl 
-- 	having count(distinct(crawlid)) > 1
-- ) as sub
-- group by sub.browser

-- this returns all the websites, associated to a browser, that have duplicate values
-- it also gives the info about the number of duplications
-- select browser, websiteurl, count(distinct(crawlid)) as numDuplicates
-- from storagedata
-- where crawlid is not null
-- group by browser, websiteurl 
-- having count(distinct(crawlid)) > 1
-- order by browser;

SELECT browser,
       storagetype,
       SUM(localStorage_divided) AS totalLocalStorage
FROM (
    SELECT sd.browser,
           sd.storagetype,
           COUNT(*) / COALESCE(sq.numDuplicates, 1) AS localStorage_divided
    FROM storagedata sd
    LEFT JOIN (
        SELECT browser,
               websiteurl,
               COUNT(DISTINCT crawlid) AS numDuplicates
        FROM storagedata
        WHERE crawlid IS NOT NULL
        GROUP BY browser, websiteurl
        HAVING COUNT(DISTINCT crawlid) > 1
    ) sq
    ON sd.browser = sq.browser AND sd.websiteurl = sq.websiteurl
    WHERE sd.visited_by_all_browsers = TRUE AND sd.storagetype = 'localStorage'
	GROUP BY sd.browser, sd.storagetype, sq.numDuplicates
) subquery
GROUP BY browser, storagetype;


