import psycopg2
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np


def numBannersVisible(cursor, path):
  cursor.execute("""
  select browser, count(distinct(websiteurl))
  from bannerdata
  where visibilityandpresence = true
  and visited_by_all_browsers = true
  group by browser
  """)
  results = cursor.fetchall()
  df = pd.DataFrame(columns=['browser', 'numBannersVisible'])

  print("numBannersVisible")
  
  for line in results:
    browser = line[0].strip()
    numBannersVisible = line[1]
    df = pd.concat([pd.DataFrame([[browser,numBannersVisible]], columns=df.columns), df], ignore_index=True)

    print(f"{browser} has a total of {numBannersVisible} numBannersVisible in the subset of websites visited by every browser")
  
  # Sort the DataFrame by 'numBannersVisible' in descending order
  df = df.sort_values(by='numBannersVisible', ascending=False)

  # Create bar graph
  plt.figure("numBannersVisible")
  plt.bar(df['browser'], df['numBannersVisible'])
  plt.xticks(rotation=45)  # Rotates x-axis labels for better visibility
  plt.xlabel('Browser')
  plt.ylabel('Number of Banners Visible')
  plt.title('Number of Banners Visible per Browser')
  plt.tight_layout()

  plt.savefig(path+'/numBannersVisible.png')  
  plt.close()

def numBannersVisible3Browsers(cursor, path):
  cursor.execute("""
  select browser, count(distinct(websiteurl))
  from bannerdata
  where visibilityandpresence = true
  and visited_by_3_browsers = true
  and browser <> 'Firefox'
  group by browser
  """)
  results = cursor.fetchall()
  df = pd.DataFrame(columns=['browser', 'numBannersVisible'])

  print("numBannersVisible3Browsers")
  
  for line in results:
    browser = line[0].strip()
    numBannersVisible = line[1]
    df = pd.concat([pd.DataFrame([[browser,numBannersVisible]], columns=df.columns), df], ignore_index=True)

    print(f"{browser} has a total of {numBannersVisible} numBannersVisible in the subset of websites visited by every browser")
  
  # Sort the DataFrame by 'numBannersVisible' in descending order
  df = df.sort_values(by='numBannersVisible', ascending=False)

  # Create bar graph
  plt.figure("numBannersVisible3Browsers")
  plt.bar(df['browser'], df['numBannersVisible'])
  plt.xticks(rotation=45)  # Rotates x-axis labels for better visibility
  plt.xlabel('Browser')
  plt.ylabel('Number of Banners Visible')
  plt.title('Number of Banners Visible per Browser')
  plt.tight_layout()

  plt.savefig(path+'/numBannersVisible3Browsers.png')  
  plt.close()

def bannersVisiblePercentageChange(cursor, path):
  cursor.execute("""
  select browser, count(distinct(websiteurl))
  from bannerdata
  where visibilityandpresence = true
  and visited_by_all_browsers = true
  group by browser
  """)
  results = cursor.fetchall()
  df = pd.DataFrame(columns=['browser', 'numBannersVisible'])
  browsers = []
  
  for line in results:
    browser = line[0].strip()
    if browser not in browsers:
      browsers.append(browser)
    numBannersVisible = line[1]
    df = pd.concat([pd.DataFrame([[browser,numBannersVisible]], columns=df.columns), df], ignore_index=True)

  googleChromeCookieValue = df[df['browser'] == 'Google Chrome']['numBannersVisible'].values[0]

  data_list = []
  
  # Calculate percentage change for each browser
  for browser in browsers:
    # Filter the data for the current browser
    browser_data = df[(df['browser'] == browser)]
    bannerChange = ((browser_data['numBannersVisible'].values[0] - googleChromeCookieValue) / googleChromeCookieValue) * 100
    data_list.append({'browser': browser, 'bannerChange': bannerChange})

  newdf = pd.DataFrame(data_list)
  
  # Create bar graph
  plt.figure("numBannersVisible")
  plt.bar(newdf['browser'], newdf['bannerChange'])
  plt.xticks(rotation=45)  # Rotates x-axis labels for better visibility
  plt.xlabel('Browser')
  plt.ylabel('Percentage Change')
  plt.title('Percentage Change in Cookie Banner Visibility Compared to Google Chrome')  
  plt.tight_layout()

  plt.savefig(path+'bannersVisiblePercentageChange.png')
  plt.close()

def bannersVisiblePercentageChange3Browsers(cursor, path):
  cursor.execute("""
  select browser, count(distinct(websiteurl))
  from bannerdata
  where visibilityandpresence = true
  and visited_by_3_browsers = true
  and browser <> 'Firefox'
  group by browser
  """)
  results = cursor.fetchall()
  df = pd.DataFrame(columns=['browser', 'numBannersVisible'])
  
  for line in results:
    browser = line[0].strip()
    numBannersVisible = line[1]
    df = pd.concat([pd.DataFrame([[browser,numBannersVisible]], columns=df.columns), df], ignore_index=True)

  googleChromeCookieValue = df[df['browser'] == 'Google Chrome']['numBannersVisible'].values[0]

  data_list = []
  
  # Calculate percentage change for each browser
  for browser in ['Brave', 'Ghostery']:
    # Filter the data for the current browser
    browser_data = df[(df['browser'] == browser)]
    bannerChange = ((browser_data['numBannersVisible'].values[0] - googleChromeCookieValue) / googleChromeCookieValue) * 100
    data_list.append({'browser': browser, 'bannerChange': bannerChange})

  newdf = pd.DataFrame(data_list)
  
  # Create bar graph
  plt.figure("bannersVisiblePercentageChange3Browsers")
  plt.bar(newdf['browser'], newdf['bannerChange'])
  plt.xticks(rotation=45)  # Rotates x-axis labels for better visibility
  plt.xlabel('Browser')
  plt.ylabel('Percentage Change')
  plt.title('Percentage Change in Cookie Banner Visibility Compared to Google Chrome')  
  plt.tight_layout()

  plt.savefig(path+'/bannersVisiblePercentageChange3Browsers.png')
  plt.close()





def main():
  US = True
  if US:
    dbConnection = psycopg2.connect("dbname=crawlUS user=postgres password=I@mastrongpsswd")
    path = './US_bannerPlots'
  
  else:
    dbConnection = psycopg2.connect("dbname=crawlUK user=postgres password=I@mastrongpsswd")
    path = './bannerPlots'

  cursor = dbConnection.cursor()

  numBannersVisible(cursor, path)
  bannersVisiblePercentageChange(cursor, path)
  numBannersVisible3Browsers(cursor, path)
  bannersVisiblePercentageChange3Browsers(cursor, path)

  cursor.close()
  dbConnection.close()

if __name__ == '__main__':
  main()