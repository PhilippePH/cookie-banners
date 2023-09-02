import psycopg2
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

def getSubsetSize(cursor):
  cursor.execute("select count(distinct(websiteurl)) from storagedata where visited_by_all_browsers2 = true")
  results = cursor.fetchall()
  return results[0][0]


def thirdPartyTotalStorage_Subset(cursor):
  cursor.execute("select browser, storagetype, count(*) from storagedata where visited_by_all_browsers2 = true and websiteurl <> frameorigin group by browser, storagetype")
  results = cursor.fetchall()
  
  df = pd.DataFrame(columns=['browser','storagetype', 'totalNum'])
  print("thirdPartyTotalStorage_Subset")
  
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
  plt.figure("thirdPartyTotalStorage_Subset")
  ax = pivot_df.drop(columns='Total').plot(kind='bar', stacked=True, colormap='tab20')  # Use a colormap for different colors
  plt.xlabel('Browser')
  plt.ylabel('Total third-party totalStorage per Website')
  plt.title('Total third-party totalStorage per Website by Browser')
  plt.xticks(rotation=45, ha="right")
  plt.legend(title='Storage Type')
  
  # Set a padding for the y-axis labels
  plt.gca().yaxis.grid(True, linewidth=0.5)
  plt.gca().yaxis.set_label_coords(-0.125, 0.5)
  
  plt.tight_layout()

  plt.savefig('./thirdPartyStoragePlots/thirdPartyTotalStorage_Subset.png')
  plt.close()



def thirdPartyTotalStorage_Subset_Percentage(cursor):
  cursor.execute("select browser, storagetype, count(*) from storagedata where visited_by_all_browsers2 = true and websiteurl <> frameorigin group by browser, storagetype")
  results = cursor.fetchall()

  df = pd.DataFrame(columns=['browser', 'storagetype', 'totalNum'])
  print("thirdPartyTotalStorage_Subset_Percentage")

  for line in results:
      browser = line[0].strip()
      storagetype = line[1].strip()
      totalNum = line[2]

      df = pd.concat([pd.DataFrame([[browser, storagetype, totalNum]], columns=df.columns), df], ignore_index=True)

  googleChromeCookieValue = (df[(df['browser'] == 'Google Chrome') & (df['storagetype'] == 'cookies')])['totalNum'].values[0]
  googleChromeLocalStorageValue = (df[(df['browser'] == 'Google Chrome') & (df['storagetype'] == 'localStorage')])['totalNum'].values[0]
  data_list = []
  
  # Calculate percentage change for each browser
  for browser in ['Brave', 'Firefox', 'Ghostery']:
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

  plt.figure("thirdPartyTotalStorage_Subset_Percentage")
  
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
  plt.title('Percentage Change in Third-Party Cookies and LocalStorage Compared to Google Chrome')
  plt.legend(title='Storage Type')
  plt.tight_layout()
  plt.savefig('./thirdPartyStoragePlots/thirdPartyTotalStorage_Subset_Percentage.png')
  plt.close()


def main():
  dbConnection = psycopg2.connect("dbname=crawl01 user=postgres password=I@mastrongpsswd")
  cursor = dbConnection.cursor()

  thirdPartyTotalStorage_Subset(cursor)
  thirdPartyTotalStorage_Subset_Percentage(cursor)


  cursor.close()
  dbConnection.close()

if __name__ == '__main__':
  main()