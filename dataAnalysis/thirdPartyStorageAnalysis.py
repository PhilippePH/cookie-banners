import psycopg2
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np


def thirdParty_total_percentage(cursor, path):
  # STEP 1. GET THE COOKIE VALUES
  cursor.execute("""
  WITH LatestCrawlData AS (
  SELECT
    browser,
    websiteurl,
    MAX(crawlid) AS max_crawlid
  FROM
    storagedata
  WHERE
    visited_by_all_browsers = true
  GROUP BY
    browser,
    websiteurl
)
SELECT
  S.browser,
  S.storagetype,
  COUNT(*) AS NumStorage
FROM
  LatestCrawlData L
INNER JOIN
  storagedata S
ON
  L.browser = S.browser
  AND L.websiteurl = S.websiteurl
  AND L.max_crawlid = S.crawlid
WHERE
  S.websiteurl <> S.frameorigin 
GROUP BY
  S.browser,
  S.storagetype
""")
  results = cursor.fetchall()
  browsers = []
  
  df = pd.DataFrame(columns=['browser','storagetype', 'totalNum'])
  print("totCookies_Subset")
  
  for line in results:
    browser = line[0].strip()
    if browser not in browsers:
      browsers.append(browser)
    storagetype = line[1].strip()
    totalNum = line[2]

    print(f"{browser} has a total of {totalNum} {storagetype} in the subset")
    df = pd.concat([pd.DataFrame([[browser,storagetype,totalNum]], columns=df.columns), df], ignore_index=True)



  # STEP 2 GET THE LOCALSTORAGE VALUES
  cursor.execute("""
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
    WHERE 
      sd.visited_by_all_browsers = TRUE 
    AND 
      sd.storagetype = 'localStorage'
    AND
      sd.websiteurl <> sd.frameorigin
	GROUP BY sd.browser, sd.storagetype, sq.numDuplicates
) subquery
GROUP BY browser, storagetype;
""")
  results = cursor.fetchall()
  
  for line in results:
    browser = line[0].strip()
    storagetype = line[1].strip()
    totalNum = int(line[2])

    print(f"{browser} has a total of {totalNum} {storagetype} in the subset")
    df = pd.concat([pd.DataFrame([[browser,storagetype,totalNum]], columns=df.columns), df], ignore_index=True)
  
  print(df)

  # Pivot the DataFrame to have 'storagetype' as columns
  pivot_df = df.pivot(index='browser', columns='storagetype', values='totalNum')

  # Calculate the total storage for each browser
  pivot_df['Total'] = pivot_df.sum(axis=1)
  pivot_df = pivot_df.sort_values(by='Total', ascending=False)


  # Plotting
  plt.figure("thirdParty_totStorage")
  ax = pivot_df.drop(columns='Total').plot(kind='bar', stacked=True, colormap='tab20')  # Use a colormap for different colors
  plt.xlabel('Browser')
  plt.ylabel('Total third-party storage')
  plt.title('Total third-party per Website by Browser')
  plt.xticks(rotation=45, ha="right")
  
  # Show the legend
  plt.legend(title='Storage Type')
  
  plt.tight_layout()

  plt.savefig(path+'/totStorage_total.png')
  plt.close()


  googleChromeCookieValue = (df[(df['browser'] == 'Google Chrome') & (df['storagetype'] == 'cookies')])['totalNum'].values[0]
  googleChromeLocalStorageValue = (df[(df['browser'] == 'Google Chrome') & (df['storagetype'] == 'localStorage')])['totalNum'].values[0]
  data_list = []
  
  # Calculate percentage change for each browser
  for browser in browsers:
    # Filter the data for the current browser
    browser_data = df[(df['browser'] == browser)]

    # Calculate the percentage change for cookies
    cookie_change = ((browser_data[browser_data['storagetype'] == 'cookies']['totalNum'].values[0] - googleChromeCookieValue) / googleChromeCookieValue) * 100

    # Calculate the percentage change for localStorage
    local_storage_change = ((browser_data[browser_data['storagetype'] == 'localStorage']['totalNum'].values[0] - googleChromeLocalStorageValue) / googleChromeLocalStorageValue) * 100

    # print(browser, cookie_change, local_storage_change)

    # Add the calculated values to 'newdf'
    data_list.append({'browser': browser, 'cookieChange': cookie_change, 'localStorageChange': local_storage_change})
    print(f"{browser} has {cookie_change} % less cookies than google chrome  ")

  newdf = pd.DataFrame(data_list)
  
  # Plotting
  x = np.arange(len(newdf))
  bar_width = 0.35

  plt.figure("thirdParty_Percentage")

  # Create the bars for 'cookieChange'
  plt.bar(x, newdf['cookieChange'], width=bar_width, label='Cookie Change', colormap='tab20', alpha=0.7)

  # Create the bars for 'localStorageChange' next to 'cookieChange'
  plt.bar(x + bar_width, newdf['localStorageChange'], width=bar_width, label='LocalStorage Change', colormap='tab20', alpha=0.7)


  # Set x-axis labels
  plt.xticks(x, newdf['browser'])

  # Add labels and title
  plt.xlabel('Browser')
  plt.xticks(rotation=45, ha="right")
  plt.ylabel('Percentage Change')
  plt.title('Percentage Change in Third-Party Storage Compared to Google Chrome')
  plt.legend(title='Storage Type')
  plt.tight_layout()
  plt.savefig(path + '/totStorage_Percentage.png')
  plt.close()


def main():
  US = False
  if US:
    dbConnection = psycopg2.connect("dbname=crawlUS user=postgres password=I@mastrongpsswd")
    path = './US_thirdPartyStoragePlots'
  
  else:
    dbConnection = psycopg2.connect("dbname=crawlUK user=postgres password=I@mastrongpsswd")
    path = './thirdPartyStoragePlots'
  
  cursor = dbConnection.cursor()

  thirdParty_total_percentage(cursor, path)

  cursor.close()
  dbConnection.close()

if __name__ == '__main__':
  main()