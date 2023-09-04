select browser, storagetype, count(*) 
from storagedata
where visited_by_all_browsers2 = true 
and websiteurl <> frameorigin
group by browser, storagetype