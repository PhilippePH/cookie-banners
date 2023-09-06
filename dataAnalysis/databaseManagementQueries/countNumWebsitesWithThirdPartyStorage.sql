select browser, count(distinct(websiteurl))
from storagedata
where visited_by_all_browsers = true
and websiteurl <> frameorigin
group by browser