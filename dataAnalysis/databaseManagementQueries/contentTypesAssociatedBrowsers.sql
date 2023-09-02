SELECT
    SPLIT_PART(contenttype, ';', 1) AS content_type,
    string_agg(distinct(browser), ', ') AS browsers,
    COUNT(*) AS content_type_count
FROM
    responsedata
GROUP BY
    SPLIT_PART(contenttype, ';', 1)
HAVING
	count(*) > 500