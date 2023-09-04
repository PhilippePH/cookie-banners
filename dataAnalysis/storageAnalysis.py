import psycopg2
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

def getSubsetSize(cursor):
  cursor.execute("select count(distinct(websiteurl)) from storagedata where visited_by_all_browsers = true")
  results = cursor.fetchall()
  return results[0][0]

# def getWebsitesWithoutStorage(cursor):
  # THIS IS ACTUALLY GOING TO BE MORE COMPLEX



"""
COOKIES, LOCALSTORAGE, AND TOTAL WITHIN THE SUBSET USING ALL THE SUBSET SIZE
"""
def avgNumCookies_Subset(cursor, subsetSize, path):
  cursor.execute("select browser, count(*) from storagedata where visited_by_all_browsers = true and storagetype = 'cookies' group by browser")
  results = cursor.fetchall()
  
  df = pd.DataFrame(columns=['browser', 'avg_cookies'])
  print("avgNumCookies_Subset")
  
  for line in results:
    browser = line[0].strip()
    numCookies = line[1]
    avg_cookies = round(numCookies/subsetSize,2)

    print(f"{browser} has on average {avg_cookies} cookies per website in the subset")
    df = pd.concat([pd.DataFrame([[browser,avg_cookies]], columns=df.columns), df], ignore_index=True)

  # Plotting
  plt.figure("avgNumCookies_Subset")
  plt.bar(df['browser'], df['avg_cookies'])
  plt.xlabel('Browser')
  plt.ylabel('Average Cookies per Website')
  plt.title('Average Cookies per Website by Browser')
  plt.xticks(rotation=45, ha="right")
  plt.tight_layout()

  plt.savefig(path+'/avgNumCookies_Subset.png')  
  plt.close()

def avgNumLocalStorage_Subset(cursor, subsetSize, path):
  cursor.execute("select browser, count(*) from storagedata where visited_by_all_browsers = true and storagetype = 'localStorage' group by browser")
  results = cursor.fetchall()
  
  df = pd.DataFrame(columns=['browser', 'avg_localStorage'])
  print("avgNumLocalStorage_Subset")
  
  for line in results:
    browser = line[0].strip()
    numLocalStorage = line[1]
    avg_localStorage = round(numLocalStorage/subsetSize,2)

    print(f"{browser} has on average {avg_localStorage} localStorage per website in the subset")
    df = pd.concat([pd.DataFrame([[browser,avg_localStorage]], columns=df.columns), df], ignore_index=True)

  # Plotting
  plt.figure("avgNumLocalStorage_Subset")
  plt.bar(df['browser'], df['avg_localStorage'])
  plt.xlabel('Browser')
  plt.ylabel('Average localStorage per Website')
  plt.title('Average localStorage per Website by Browser')
  plt.xticks(rotation=45, ha="right")
  plt.tight_layout()

  plt.savefig(path+'/avgNumLocalStorage_Subset.png')  
  plt.close()

def avgTotalStorage_Subset(cursor, subsetSize, path):
  cursor.execute("select browser, count(*) from storagedata where visited_by_all_browsers = true group by browser")
  results = cursor.fetchall()
  
  df = pd.DataFrame(columns=['browser', 'avg_totalStorage'])
  print("avgTotalStorage_Subset")
  
  for line in results:
    browser = line[0].strip()
    numStorage = line[1]
    avg_totalStorage = round(numStorage/subsetSize,2)

    print(f"{browser} has on average {avg_totalStorage} totalStorage per website in the subset")
    df = pd.concat([pd.DataFrame([[browser,avg_totalStorage]], columns=df.columns), df], ignore_index=True)

  # Plotting
  plt.figure("avgTotalStorage_Subset")
  plt.bar(df['browser'], df['avg_totalStorage'])
  plt.xlabel('Browser')
  plt.ylabel('Average totalStorage per Website')
  plt.title('Average totalStorage per Website by Browser')
  plt.xticks(rotation=45, ha="right")
  plt.tight_layout()

  plt.savefig(path+'/avgTotalStorage_Subset.png')
  plt.close()  





"""
COOKIES, LOCALSTORAGE, AND TOTAL WITHIN THE SUBSET USING ONLY SITES WITH THE STORAGE TYPE
"""
def avgNumCookies_SubsetWithCookies(cursor, path):
  cursor.execute("select browser, count(distinct(websiteurl)), count(*) from storagedata where visited_by_all_browsers = true and storagetype = 'cookies' group by browser")
  results = cursor.fetchall()
  
  df = pd.DataFrame(columns=['browser', 'avg_cookies'])
  print("avgNumCookies_SubsetWithCookies")
  
  for line in results:
    browser = line[0].strip()
    subsetWithCookies = line[1]
    numCookies = line[2]
    avg_cookies = round(numCookies/subsetWithCookies,2)

    print(f"{browser} has on average {avg_cookies} cookies per website in the subset")
    df = pd.concat([pd.DataFrame([[browser,avg_cookies]], columns=df.columns), df], ignore_index=True)

  # Plotting
  plt.figure("avgNumCookies_SubsetWithCookies")
  plt.bar(df['browser'], df['avg_cookies'])
  plt.xlabel('Browser')
  plt.ylabel('Average Cookies per Website')
  plt.title('Average Cookies per Website by Browser')
  plt.xticks(rotation=45, ha="right")
  plt.tight_layout()

  plt.savefig(path+'/avgNumCookies_SubsetWithCookies.png')
  plt.close()

def avgNumLocalStorage_SubsetWithLocalStorage(cursor, path):
  cursor.execute("select browser, count(distinct(websiteurl)), count(*) from storagedata where visited_by_all_browsers = true and storagetype = 'localStorage' group by browser")
  results = cursor.fetchall()

  df = pd.DataFrame(columns=['browser', 'avg_localStorage'])
  print("avgNumLocalStorage_Subset")

  for line in results:
    browser = line[0].strip()
    subsetWithLocal = line[1]
    numLocalStorage = line[2]
    avg_localStorage = round(numLocalStorage/subsetWithLocal,2)

    print(f"{browser} has on average {avg_localStorage} localStorage per website WITH localstorage in the subset")
    df = pd.concat([pd.DataFrame([[browser,avg_localStorage]], columns=df.columns), df], ignore_index=True)

  # Plotting
  plt.figure("avgNumLocalStorage_SubsetWithLocalStorage")
  plt.bar(df['browser'], df['avg_localStorage'])
  plt.xlabel('Browser')
  plt.ylabel('Average localStorage per Website')
  plt.title('Average localStorage per Website by Browser')
  plt.xticks(rotation=45, ha="right")
  plt.tight_layout()

  plt.savefig(path+'/avgNumLocalStorage_SubsetWithLocalStorage.png')
  plt.close()

def avgTotalStorage_SubsetWithStorage(cursor, path):
  cursor.execute("select browser, storagetype, count(distinct(websiteurl)), count(*) from storagedata where visited_by_all_browsers = true group by browser, storagetype")
  results = cursor.fetchall()
  
  df = pd.DataFrame(columns=['browser', 'storageType', 'avg_totalStorage'])
  print("avgTotalStorage_SubsetWithStorage")
  
  for line in results:
    browser = line[0].strip()
    storagetype = line[1].strip()
    subsetWithStorage = line[2]
    totalNum = line[3]
    avg_totalStorage = round(totalNum/subsetWithStorage,2)

    print(f"{browser} has on average {avg_totalStorage} totalStorage per website WITH storage in the subset")
    df = pd.concat([pd.DataFrame([[browser,storagetype,avg_totalStorage]], columns=df.columns), df], ignore_index=True)

  # # Plotting
  # # Pivot the dataframe to have browser as index, storagetype as columns, and totalNum as values
  # pivot_df = df.pivot(index='browser', columns='storagetype', values='totalNum')

  # # Calculate the total storage for each browser
  # pivot_df['Total'] = pivot_df.sum(axis=1)
  # pivot_df = pivot_df.sort_values(by='Total', ascending=False)

  # # Calculate the total storage for each browser and the grand total
  # pivot_df['Total'] = pivot_df.sum(axis=1)
  # grand_total = pivot_df['Total'].sum()

  # # Sort the dataframe based on the grand total
  # pivot_df = pivot_df.sort_values(by='Total', ascending=False)

  # # Plotting
  # plt.figure("avgTotalStorage_SubsetWithStorage")
  # ax = pivot_df.drop(columns='Total').plot(kind='bar', stacked=True, colormap='tab20')  # Use a colormap for different colors
  # plt.xlabel('Browser')
  # plt.ylabel('Average totalStorage per Website')
  # plt.title('Average totalStorage per Website by Browser')
  # plt.xticks(rotation=45, ha="right")
  # plt.legend(title='Storage Type')
  
  # # Set a padding for the y-axis labels
  # plt.gca().yaxis.grid(True, linewidth=0.5)
  # plt.gca().yaxis.set_label_coords(-0.125, 0.5)
  
  # plt.tight_layout()

  # plt.savefig(path+'/avgTotalStorage_SubsetWithStorage.png')
  # plt.close()


"""
GET TOTALS, NOT AVG: COOKIES, LOCALSTORAGE, AND TOTAL WITHIN THE SUBSET
"""
def totNumCookies_SubsetWithCookies(cursor, path):
  cursor.execute("select browser, count(*) from storagedata where visited_by_all_browsers = true and storagetype = 'cookies' group by browser")
  results = cursor.fetchall()
  
  df = pd.DataFrame(columns=['browser', 'numCookies'])
  print("avgNumCookies_SubsetWithCookies")
  
  for line in results:
    browser = line[0].strip()
    numCookies = line[1]

    print(f"{browser} has on average {numCookies} cookies per website in the subset")
    df = pd.concat([pd.DataFrame([[browser,numCookies]], columns=df.columns), df], ignore_index=True)

  # Plotting
  plt.figure("totNumCookies_SubsetWithCookies")
  plt.bar(df['browser'], df['numCookies'])
  plt.xlabel('Browser')
  plt.ylabel('Total Cookies per Website')
  plt.title('Total Cookies per Website by Browser')
  plt.xticks(rotation=45, ha="right")
  plt.tight_layout()

  plt.savefig(path+'/totNumCookies_SubsetWithCookies.png')
  plt.close()

def totNumLocalStorage_SubsetWithLocalStorage(cursor, path):
  cursor.execute("select browser, count(*) from storagedata where visited_by_all_browsers = true and storagetype = 'localStorage' group by browser")
  results = cursor.fetchall()

  df = pd.DataFrame(columns=['browser', 'numLocalStorage'])
  print("totNumLocalStorage_SubsetWithLocalStorage")

  for line in results:
    browser = line[0].strip()
    numLocalStorage = line[1]

    print(f"{browser} has on average {numLocalStorage} localStorage per website WITH localstorage in the subset")
    df = pd.concat([pd.DataFrame([[browser,numLocalStorage]], columns=df.columns), df], ignore_index=True)

  # Plotting
  plt.figure("totNumLocalStorage_SubsetWithLocalStorage")
  plt.bar(df['browser'], df['numLocalStorage'])
  plt.xlabel('Browser')
  plt.ylabel('Total localStorage per Website')
  plt.title('Total localStorage per Website by Browser')
  plt.xticks(rotation=45, ha="right")
  plt.tight_layout()

  plt.savefig(path+'/totNumLocalStorage_SubsetWithLocalStorage.png')
  plt.close()


# HEY NOTE TO SELF: if this is total storage, we don't need to only count websites with storage.
def totTotalStorage_Subset(cursor, path):
  cursor.execute("select browser, storagetype, count(*) from storagedata where visited_by_all_browsers = true group by browser, storagetype")
  results = cursor.fetchall()
  
  df = pd.DataFrame(columns=['browser','storagetype', 'totalNum'])
  print("totTotalStorage_Subset")
  
  for line in results:
    browser = line[0].strip()
    storagetype = line[1].strip()
    totalNum = line[2]

    print(f"{browser} has a total of {totalNum} {storagetype} in the subset")
    df = pd.concat([pd.DataFrame([[browser,storagetype,totalNum]], columns=df.columns), df], ignore_index=True)

  # Pivot the dataframe to have browser as index, storagetype as columns, and totalNum as values
  pivot_df = df.pivot(index='browser', columns='storagetype', values='totalNum')

  # Calculate the total storage for each browser
  pivot_df['Total'] = pivot_df.sum(axis=1)
  pivot_df = pivot_df.sort_values(by='Total', ascending=False)

  # Calculate the total storage for each browser and the grand total
  pivot_df['Total'] = pivot_df.sum(axis=1)
  grand_total = pivot_df['Total'].sum()

  # Sort the dataframe based on the grand total
  pivot_df = pivot_df.sort_values(by='Total', ascending=False)

  # Plotting
  plt.figure("totTotalStorage_Subset")
  ax = pivot_df.drop(columns='Total').plot(kind='bar', stacked=True, colormap='tab20')  # Use a colormap for different colors
  plt.xlabel('Browser')
  plt.ylabel('Total totalStorage per Website')
  plt.title('Total totalStorage per Website by Browser')
  plt.xticks(rotation=45, ha="right")
  plt.legend(title='Storage Type')
  
  # Set a padding for the y-axis labels
  plt.gca().yaxis.grid(True, linewidth=0.5)
  plt.gca().yaxis.set_label_coords(-0.125, 0.5)
  
  plt.tight_layout()

  plt.savefig(path+'/totTotalStorage_Subset.png')
  plt.close()


def totTotalStorage_Subset_Percentage(cursor, path):
  cursor.execute("select browser, storagetype, count(*) from storagedata where visited_by_all_browsers = true group by browser, storagetype")
  results = cursor.fetchall()

  df = pd.DataFrame(columns=['browser', 'storagetype', 'totalNum'])
  print("totTotalStorage_Subset_Percentage")
  browsers = []

  for line in results:
      browser = line[0].strip()
      if browser not in browsers:
        browsers.append(browser)
      storagetype = line[1].strip()
      totalNum = line[2]

      df = pd.concat([pd.DataFrame([[browser, storagetype, totalNum]], columns=df.columns), df], ignore_index=True)

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

  newdf = pd.DataFrame(data_list)
  # print(newdf)
  # Plotting
  x = np.arange(3)
  bar_width = 0.35

  plt.figure("totTotalStorage_Subset_Percentage")
  
  # Create the bars for 'cookieChange'
  plt.bar(x, newdf['cookieChange'], width=bar_width, label='Cookie Change', color='blue', alpha=0.7)

  # Create the bars for 'localStorageChange' next to 'cookieChange'
  plt.bar(x + bar_width, newdf['localStorageChange'], width=bar_width, label='LocalStorage Change', color='green', alpha=0.7)

  # Set x-axis labels
  plt.xticks(x + bar_width / 2, newdf['browser'])

  # Add labels and title
  plt.xlabel('Browser')
  plt.xticks(rotation=45, ha="right")
  plt.ylabel('Percentage Change')
  plt.title('Percentage Change in Cookies and LocalStorage Compared to Google Chrome')
  plt.legend(title='Storage Type')
  plt.tight_layout()
  plt.savefig(path+'/totTotalStorage_Subset_Percentage.png')
  plt.close()

def main():
  US = True
  if US:
    dbConnection = psycopg2.connect("dbname=crawlUS user=postgres password=I@mastrongpsswd")
    path = './US_storagePlots'
  
  else:
    dbConnection = psycopg2.connect("dbname=crawlUK user=postgres password=I@mastrongpsswd")
    path = './storagePlots'

  cursor = dbConnection.cursor()

  
  # COOKIES, LOCALSTORAGE, AND TOTAL WITHIN THE SUBSET USING ALL THE SUBSET SIZE
  subsetSize = getSubsetSize(cursor)     ######## check ehre
  avgNumCookies_Subset(cursor, subsetSize, path) 
  avgNumLocalStorage_Subset(cursor, subsetSize, path)
  avgTotalStorage_Subset(cursor, subsetSize, path)

  # ## COOKIES, LOCALSTORAGE, AND TOTAL WITHIN THE SUBSET USING ONLY SITES WITH THE STORAGE TYPE
  avgNumCookies_SubsetWithCookies(cursor, path)
  avgNumLocalStorage_SubsetWithLocalStorage(cursor, path)
  avgTotalStorage_SubsetWithStorage(cursor, path )

  ## GET TOTALS, NOT AVG: COOKIES, LOCALSTORAGE, AND TOTAL WITHIN THE SUBSET
  totNumCookies_SubsetWithCookies(cursor, path)
  totNumLocalStorage_SubsetWithLocalStorage(cursor, path)
  totTotalStorage_Subset(cursor, path)

  # total storage percentage change per storage type
  totTotalStorage_Subset_Percentage(cursor, path)

  cursor.close()
  dbConnection.close()

if __name__ == '__main__':
  main()