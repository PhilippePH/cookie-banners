import psycopg2
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

def showRequestDistribution_sameSubset(cursor,path):
  cursor.execute('SELECT browser, websiteurl, COUNT(*) AS total_requests FROM requestdata GROUP BY browser, websiteurl')
  results = cursor.fetchall()
  df = pd.DataFrame(columns=['browser', 'websiteurl', 'numRequests'])

  print("showRequestDistribution_sameSubset")
  
  for line in results:
    browser = line[0].strip()
    websiteurl = line[1]
    numRequests = line[2]
    df = pd.concat([pd.DataFrame([[browser, websiteurl, numRequests]], columns=df.columns), df], ignore_index=True)

  #  Get distinct browsers
  distinct_browsers = df['browser'].unique()

  # Create a separate histogram for each browser
  for browser in distinct_browsers:
    browser_data = df[df['browser'] == browser]['numRequests']
    
    # Create a histogram
    fig, ax = plt.subplots()
    ax.hist(browser_data, bins=30, edgecolor='k', alpha=0.7)  # Adjust the number of bins as needed
    plt.xlabel('Number of Requests')  # Update the x-axis label
    plt.ylabel('Frequency')
    plt.title(f'Request Distribution for {browser}')
    
    plt.tight_layout()  # Improve spacing
    plt.savefig(path+f'/showRequestDistribution_{browser}.png')
    plt.close()

  
def totNumDistinctFrames_sameSubset(cursor, path):
  cursor.execute("""
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
  COUNT(DISTINCT CASE WHEN R.frameorigin <> R.websiteurl THEN R.frameorigin ELSE 'No' END) AS count_not_equal
  
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
""")
  results = cursor.fetchall()
  df = pd.DataFrame(columns=['browser', 'numwebsites', 'party_type', 'totalNum'])

  print("totNumDistinctFrames_sameSubset")
  
  browsers = []
  for line in results:
    browser = line[0].strip()
    if browser not in browsers:
      browsers.append(browser)

    numwebsites = line[1]
    party_type = line[2]
    if party_type == "First Party":
      numberFrames = line[3]
    else:
      numberFrames = line[4]

    df = pd.concat([pd.DataFrame([[browser, numwebsites, party_type, numberFrames]], columns=df.columns), df], ignore_index=True)

    print(f"{browser} has a total of {numberFrames} {party_type} frames frames making requests in the subset of {numwebsites} websites")
  

  # Pivot the DataFrame to have 'storagetype' as columns
  pivot_df = df.pivot(index='browser', columns='party_type', values='totalNum')

  # Calculate the total storage for each browser
  pivot_df['Total'] = pivot_df.sum(axis=1)
  pivot_df = pivot_df.sort_values(by='Total', ascending=False)


  # Plotting
  plt.figure("totNumDistinctFrames_perParty")
  ax = pivot_df.drop(columns='Total').plot(kind='bar', stacked=True, colormap='tab20')  # Use a colormap for different colors
  
  # Add labels and title
  plt.xticks(rotation=45)  # Rotate x-axis labels for better visibility
  plt.xlabel('Browser')
  plt.ylabel('Number of Distinct Frames')
  plt.legend(title='First or Third Party')
  plt.title('Total Number of Distinct Frames per Browser')
  plt.tight_layout()  # Improve spacing
  plt.savefig(path+'/totNumDistinctFrames_perParty.png')  
  plt.close()
 

  googleChromeFirstPartyValue = (df[(df['browser'] == 'Google Chrome') & (df['party_type'] == 'First Party')])['totalNum'].sum()
  googleChromeThirdPartyValue = (df[(df['browser'] == 'Google Chrome') & (df['party_type'] == 'Third Party')])['totalNum'].sum()
  data_list = []
  
  # Calculate percentage change for each browser
  for browser in browsers:
    # Filter the data for the current browser
    browser_data = df[(df['browser'] == browser)]

    # Calculate the percentage change for cookies
    firstParty_change = ((browser_data[browser_data['party_type'] == 'First Party']['totalNum'].sum() - googleChromeFirstPartyValue) / googleChromeFirstPartyValue) * 100

    # Calculate the percentage change for localStorage
    thirdParty_change = ((browser_data[browser_data['party_type'] == 'Third Party']['totalNum'].sum() - googleChromeThirdPartyValue) / googleChromeThirdPartyValue) * 100

    # Add the calculated values to 'newdf'
    data_list.append({'browser': browser, 'firstPartyChange': firstParty_change, 'thirdPartyChange': thirdParty_change})
    print(f"{browser} has {firstParty_change} % less first party frames making requests than google chrome  ")
    print(f"{browser} has {thirdParty_change} % less first party frames making requests than google chrome  ")

  newdf = pd.DataFrame(data_list)
  
  print(newdf)

  # Plotting
  x = np.arange(len(newdf))
  bar_width = 0.35
  plt.figure("PercentageChange_perParty")

  # Create the bars for 'firstPartyChange'
  plt.bar(x, newdf['firstPartyChange'], width=bar_width, label='Change in Number of First Party Frames', color='blue', alpha=0.7)

  # Create the bars for 'thirdPartyChange' next to 'firstPartyChange'
  plt.bar(x + bar_width, newdf['thirdPartyChange'], width=bar_width, label='Change in Number of Third Party Frames', color='green', alpha=0.7)

  # Set x-axis labels and positions
  plt.xticks(x + bar_width / 2, newdf['browser'])  # Adjust the tick positions

  # plot bar graph
  plt.xticks(rotation=45)  # Rotate x-axis labels for better visibility
  plt.xlabel('Browser')
  plt.ylabel('Percentage Change compared to Google Chrome, Per Party Type')
  plt.title('Percentage Change of Number of Frames Making Requests per Browser compared to Google Chrome')
  plt.legend(title='Frame Party Type')
  plt.tight_layout()  # Improve spacing

  plt.savefig(path+'/PercentageChange_perParty.png')  
  plt.close()




def allTotals(cursor, path):
  cursor.execute("""
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
  COUNT(*) AS NumReponses,
  COUNT(DISTINCT(R.websiteurl))
FROM
  LatestCrawlData L
INNER JOIN
  requestdata R
ON
  L.browser = R.browser
  AND L.websiteurl = R.websiteurl
  AND L.max_crawlid = R.crawlid
GROUP BY
  R.browser
                 """)
  results = cursor.fetchall()

  df = pd.DataFrame(columns=['browser', 'totRequest', 'numWebsites'])

  for line in results:
    browser = line[0].strip()
    numRequests = line[1]
    distinctwebsites = line[2]
    
    df = pd.concat([pd.DataFrame([[browser, numRequests, distinctwebsites]], columns=df.columns), df], ignore_index=True)

    print(f"{browser} has on average {round(numRequests/distinctwebsites,2)} requests per website visited")
    print(f"{browser} has a total of {numRequests} requests in the subsample of {distinctwebsites}")


  # Create bar graph
  plt.figure("totalNumberRequests")
  plt.bar(df['browser'], df['totRequest'])
  plt.xticks(rotation=45)  # Rotates x-axis labels for better visibility
  plt.xlabel('Browser')
  plt.ylabel('Total Requests')
  plt.title('Total Requests per Browser')
  plt.tight_layout()

  plt.savefig(path+'/totalNumberRequests.png')  
  plt.close()

  print("Total graph done")

  # Calculate the percentage change compared to Google Chrome
  google_chrome_requests = df[df['browser'] == 'Google Chrome']['totRequest'].values[0]
  df['percentage_change'] = ((df['totRequest'] / google_chrome_requests) - 1) * 100

  # Remove the Google Chrome row from the DataFrame
  df = df[df['browser'] != 'Google Chrome']

  # Create bar graph
  plt.figure("PercentageChange_requests")
  plt.bar(df['browser'], df['percentage_change'])
  plt.xticks(rotation=45)  # Rotates x-axis labels for better visibility
  plt.xlabel('Browser')
  plt.ylabel('Percentage Change compared to Google Chrome')
  plt.title('Percentage Change of Total Requests per Browser compared to Google Chrome')
  plt.tight_layout()

  plt.savefig(path+'/PercentageChange_requests.png')
  plt.close()

  print("Percentage graph done")


def allTotals_ThirdParty(cursor, path):
  cursor.execute("""
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
  COUNT(*) AS NumReponses,
  COUNT(DISTINCT(R.websiteurl))
FROM
  LatestCrawlData L
INNER JOIN
  requestdata R
ON
  L.browser = R.browser
  AND L.websiteurl = R.websiteurl
  AND L.max_crawlid = R.crawlid
WHERE R.websiteurl <> R.frameorigin
GROUP BY
  R.browser
                 """)
  results = cursor.fetchall()

  df = pd.DataFrame(columns=['browser', 'totRequest', 'numWebsites'])

  for line in results:
    browser = line[0].strip()
    numRequests = line[1]
    distinctwebsites = line[2]
    
    df = pd.concat([pd.DataFrame([[browser, numRequests, distinctwebsites]], columns=df.columns), df], ignore_index=True)

    print(f"{browser} has on average {round(numRequests/distinctwebsites,2)} THIRD PARTY requests per website visited")
    print(f"{browser} has a total of {numRequests} requests made by a THIRD PARTY frame requests in the subsample of {distinctwebsites}")


  # Create bar graph
  plt.figure("ThirdParty_totalNumberRequests")
  plt.bar(df['browser'], df['totRequest'])
  plt.xticks(rotation=45)  # Rotates x-axis labels for better visibility
  plt.xlabel('Browser')
  plt.ylabel('Total Requests')
  plt.title('Total Requests per Browser')
  plt.tight_layout()

  plt.savefig(path+'/ThirdParty_totalNumberRequests.png')  
  plt.close()

  print("Total graph done")

  # Calculate the percentage change compared to Google Chrome
  google_chrome_requests = df[df['browser'] == 'Google Chrome']['totRequest'].values[0]
  df['percentage_change'] = ((df['totRequest'] / google_chrome_requests) - 1) * 100

  # Remove the Google Chrome row from the DataFrame
  df = df[df['browser'] != 'Google Chrome']

  # Create bar graph
  plt.figure("ThirdParty_requestsPercentageChange")
  plt.bar(df['browser'], df['percentage_change'])
  plt.xticks(rotation=45)  # Rotates x-axis labels for better visibility
  plt.xlabel('Browser')
  plt.ylabel('Percentage Change compared to Google Chrome')
  plt.title('Percentage Change of Total Requests per Browser compared to Google Chrome')
  plt.tight_layout()

  plt.savefig(path+'/ThirdParty_requestsPercentageChange.png')
  plt.close()

  print("Percentage graph done")


def main():
  US = False
  if US:
    dbConnection = psycopg2.connect("dbname=crawlUS user=postgres password=I@mastrongpsswd")
    path = './US_requestPlots'
  
  else:
    dbConnection = psycopg2.connect("dbname=crawlUK user=postgres password=I@mastrongpsswd")
    path = './requestPlots'

  cursor = dbConnection.cursor()


  # allTotals(cursor, path)
  # allTotals_ThirdParty(cursor, path)
  # showRequestDistribution_sameSubset(cursor,path)
  totNumDistinctFrames_sameSubset(cursor, path)


  cursor.close()
  dbConnection.close()



if __name__ == '__main__':
  main()

