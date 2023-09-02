select browser, count(distinct(SPLIT_PART(contenttype, ';', 1))) AS num_distinct_content_type
from responsedata 
where visited_by_all_browsers = true 
group by browser