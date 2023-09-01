SELECT
	browser,
    SPLIT_PART(contenttype, ';', 1) AS content_type,
    COUNT(*) AS content_type_count
FROM
    responsedata
WHERE
	SPLIT_PART(contenttype, ';', 1) in ('application/javascript', 'application/json', 'image/jpeg', 'image/png', 'text/javascript', 'text/html')
GROUP BY
	browser,
    SPLIT_PART(contenttype, ';', 1)
