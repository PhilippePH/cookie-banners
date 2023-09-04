import psycopg2
import matplotlib.pyplot as plt
import pandas as pd


def avgRequests(cursor):
  cursor.execute('SELECT browser, count(websiteurl), count(distinct(websiteurl)) from requestdata group by browser')
  results = cursor.fetchall()
  
  print("avgRequests")
  
  for line in results:
    browser = line[0].strip()
    numRequests = line[1]
    distinctwebsites = line[2]

    print(f"{browser} has on average {round(numRequests/distinctwebsites,2)} requests per website visited")

def avgRequests_sameSubset(cursor):
  cursor.execute('SELECT browser, count(websiteurl), count(distinct(websiteurl)) from requestdata where visited_by_all_browsers = true group by browser')
  results = cursor.fetchall()
  
  print("avgRequests_sameSubset")
  
  for line in results:
    browser = line[0].strip()
    numRequests = line[1]
    distinctwebsites = line[2]

    print(f"{browser} has on average {round(numRequests/distinctwebsites,2)} requests per website visited")



def totalNumberRequests_sameSubset(cursor):
  cursor.execute('SELECT browser, count(websiteurl) from requestdata where visited_by_all_browsers = true group by browser')
  results = cursor.fetchall()
  df = pd.DataFrame(columns=['browser', 'totRequest'])

  print("totalNumberRequests_sameSubset")
  
  for line in results:
    browser = line[0].strip()
    numRequests = line[1]
    df = pd.concat([pd.DataFrame([[browser,numRequests]], columns=df.columns), df], ignore_index=True)

    print(f"{browser} has a total of {numRequests} requests in the subset of websites visited by every browser")
  
  # Create bar graph
  plt.figure("totalNumberRequests_sameSubset")
  plt.bar(df['browser'], df['totRequest'])
  plt.xticks(rotation=45)  # Rotates x-axis labels for better visibility
  plt.xlabel('Browser')
  plt.ylabel('Total Requests')
  plt.title('Total Requests per Browser')
  plt.tight_layout()

  plt.savefig('./requestPlots/totalNumberRequests_sameSubset.png')  
  plt.close()

def totalNumberRequests_sameSubset_PercentageChange(cursor):
    cursor.execute('SELECT browser, count(websiteurl) from requestdata where visited_by_all_browsers = true group by browser')
    results = cursor.fetchall()
    df = pd.DataFrame(columns=['browser', 'totRequests'])

    print("totalNumberRequests_sameSubset_PercentageChange")

    for line in results:
        browser = line[0].strip()
        numRequests = line[1]
        df = pd.concat([pd.DataFrame([[browser, numRequests]], columns=df.columns), df], ignore_index=True)

   # Calculate the percentage change compared to Google Chrome
    google_chrome_requests = df[df['browser'] == 'Google Chrome']['totRequests'].values[0]
    df['percentage_change'] = ((df['totRequests'] / google_chrome_requests) - 1) * 100

    # Remove the Google Chrome row from the DataFrame
    df = df[df['browser'] != 'Google Chrome']

    # Create bar graph
    plt.figure("totalNumberRequests_sameSubset_PercentageChange")
    plt.bar(df['browser'], df['percentage_change'])
    plt.xticks(rotation=45)  # Rotates x-axis labels for better visibility
    plt.xlabel('Browser')
    plt.ylabel('Percentage Change compared to Google Chrome')
    plt.title('Percentage Change of Total Requests per Browser compared to Google Chrome')
    plt.tight_layout()

    plt.savefig('./requestPlots/totalNumberRequests_sameSubset_PercentageChange.png')
    plt.close()





def showRequestDistribution_sameSubset(cursor):
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
    plt.savefig(f'./requestPlots/showRequestDistribution_{browser}.png')
    plt.close()





  
def totNumDistinctFrames_sameSubset(cursor):
  cursor.execute('SELECT browser, count(distinct(frameorigin)) from requestdata where visited_by_all_browsers = true group by browser')
  results = cursor.fetchall()
  df = pd.DataFrame(columns=['browser', 'numDistinctFrames'])

  print("totNumDistinctFrames_sameSubset")
  
  for line in results:
    browser = line[0].strip()
    numDistinctFrames = line[1]
    df = pd.concat([pd.DataFrame([[browser,numDistinctFrames]], columns=df.columns), df], ignore_index=True)

    print(f"{browser} has a total of {numDistinctFrames} distinct frames making requests in the subset of websites visited by every browser")
  
  # plot bar graph
  plt.figure("totNumDistinctFrames_sameSubset")
  ax = plt.bar(df['browser'], df['numDistinctFrames'])  # Provide both x and y values

  plt.xticks(rotation=45)  # Rotate x-axis labels for better visibility
  plt.xlabel('Browser')
  plt.ylabel('Number of Distinct Frames')
  plt.title('Total Number of Distinct Frames per Browser')
  plt.tight_layout()  # Improve spacing
  plt.savefig('./requestPlots/totNumDistinctFrames_sameSubset.png')  
  plt.close()

def totNumDistinctUrls_sameSubset(cursor):
  cursor.execute('SELECT browser, count(distinct(requestedurl)) from requestdata where visited_by_all_browsers = true group by browser')
  results = cursor.fetchall()
  df = pd.DataFrame(columns=['browser', 'numDistinctUrls'])

  print("totNumDistinctUrls_sameSubset")
  
  for line in results:
    browser = line[0].strip()
    numDistinctUrls = line[1]
    df = pd.concat([pd.DataFrame([[browser,numDistinctUrls]], columns=df.columns), df], ignore_index=True)

    print(f"{browser} has a total of {numDistinctUrls} distinct urls being requested in the subset of websites visited by every browser")
  
  # plot bar graph
  plt.figure("totNumDistinctUrls_sameSubset")
  ax = plt.bar(df['browser'], df['numDistinctUrls'])  # Provide both x and y values

  plt.xticks(rotation=45)  # Rotate x-axis labels for better visibility
  plt.xlabel('Browser')
  plt.ylabel('Number of Distinct URLs')
  plt.title('Total Number of Distinct URLs per Browser')
  plt.tight_layout()  # Improve spacing

  plt.savefig('./requestPlots/totNumDistinctUrls_sameSubset.png')  
  plt.close()

def main():
  dbConnection = psycopg2.connect("dbname=crawlUK user=postgres password=I@mastrongpsswd")
  cursor = dbConnection.cursor()

  # avgRequests(cursor) # runs
  # avgRequests_sameSubset(cursor) #runs 
  
  # totalNumberRequests_sameSubset(cursor) #runs
  # totalNumberRequests_sameSubset_PercentageChange(cursor)
  
  showRequestDistribution_sameSubset(cursor)
  # totNumDistinctFrames_sameSubset(cursor) #runs
  # totNumDistinctUrls_sameSubset(cursor) #runs

  cursor.close()
  dbConnection.close()

if __name__ == '__main__':
  main()