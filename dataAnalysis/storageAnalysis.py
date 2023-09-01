import psycopg2
import matplotlib.pyplot as plt
import pandas as pd

def getSubsetSize(cursor):
  cursor.execute("select count(distinct(websiteurl)) from storagedata where visited_by_all_browsers2 = true")
  results = cursor.fetchall()
  return results[0][0]

# def getWebsitesWithoutStorage(cursor):
  # THIS IS ACTUALLY GOING TO BE MORE COMPLEX





"""
COOKIES, LOCALSTORAGE, AND TOTAL WITHIN THE SUBSET USING ALL THE SUBSET SIZE
"""
def avgNumCookies_Subset(cursor, subsetSize):
  cursor.execute("select browser, count(*) from storagedata where visited_by_all_browsers2 = true and storagetype = 'cookies' group by browser")
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

  plt.savefig('./storagePlots/avgNumCookies_Subset.png')  
  plt.close()

def avgNumLocalStorage_Subset(cursor, subsetSize):
  cursor.execute("select browser, count(*) from storagedata where visited_by_all_browsers2 = true and storagetype = 'localStorage' group by browser")
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

  plt.savefig('./storagePlots/avgNumLocalStorage_Subset.png')  
  plt.close()

def avgTotalStorage_Subset(cursor, subsetSize):
  cursor.execute("select browser, count(*) from storagedata where visited_by_all_browsers2 = true group by browser")
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

  plt.savefig('./storagePlots/avgTotalStorage_Subset.png')
  plt.close()  





"""
COOKIES, LOCALSTORAGE, AND TOTAL WITHIN THE SUBSET USING ONLY SITES WITH THE STORAGE TYPE
"""
def avgNumCookies_SubsetWithCookies(cursor):
  cursor.execute("select browser, count(distinct(websiteurl)), count(*) from storagedata where visited_by_all_browsers2 = true and storagetype = 'cookies' group by browser")
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

  plt.savefig('./storagePlots/avgNumCookies_SubsetWithCookies.png')
  plt.close()

def avgNumLocalStorage_SubsetWithLocalStorage(cursor):
  cursor.execute("select browser, count(distinct(websiteurl)), count(*) from storagedata where visited_by_all_browsers2 = true and storagetype = 'localStorage' group by browser")
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

  plt.savefig('./storagePlots/avgNumLocalStorage_SubsetWithLocalStorage.png')
  plt.close()

def avgTotalStorage_SubsetWithStorage(cursor):
  cursor.execute("select browser, storagetype, count(distinct(websiteurl)), count(*) from storagedata where visited_by_all_browsers2 = true group by browser, storagetype")
  results = cursor.fetchall()
  
  df = pd.DataFrame(columns=['browser', 'storageType', 'avg_totalStorage'])
  print("avgTotalStorage_SubsetWithStorage")
  
  for line in results:
    browser = line[0].strip()
    storagetype = line[1].strop
    subsetWithStorage = line[2]
    totalNum = line[3]
    avg_totalStorage = round(totalNum/subsetWithStorage,2)

    print(f"{browser} has on average {avg_totalStorage} totalStorage per website WITH storage in the subset")
    df = pd.concat([pd.DataFrame([[browser,avg_totalStorage]], columns=df.columns), df], ignore_index=True)

  # Plotting
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
  plt.figure("avgTotalStorage_SubsetWithStorage")
  ax = pivot_df.drop(columns='Total').plot(kind='bar', stacked=True, colormap='tab20')  # Use a colormap for different colors
  plt.xlabel('Browser')
  plt.ylabel('Average totalStorage per Website')
  plt.title('Average totalStorage per Website by Browser')
  plt.xticks(rotation=45, ha="right")
  plt.legend(title='Storage Type')
  
  # Set a padding for the y-axis labels
  plt.gca().yaxis.grid(True, linewidth=0.5)
  plt.gca().yaxis.set_label_coords(-0.125, 0.5)
  
  plt.tight_layout()

  plt.savefig('./storagePlots/avgTotalStorage_SubsetWithStorage.png')
  plt.close()


"""
GET TOTALS, NOT AVG: COOKIES, LOCALSTORAGE, AND TOTAL WITHIN THE SUBSET
"""
def totNumCookies_SubsetWithCookies(cursor):
  cursor.execute("select browser, count(*) from storagedata where visited_by_all_browsers2 = true and storagetype = 'cookies' group by browser")
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

  plt.savefig('./storagePlots/totNumCookies_SubsetWithCookies.png')
  plt.close()

def totNumLocalStorage_SubsetWithLocalStorage(cursor):
  cursor.execute("select browser, count(*) from storagedata where visited_by_all_browsers2 = true and storagetype = 'localStorage' group by browser")
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

  plt.savefig('./storagePlots/totNumLocalStorage_SubsetWithLocalStorage.png')
  plt.close()



def totTotalStorage_SubsetWithStorage(cursor):
  cursor.execute("select browser, storagetype, count(*) from storagedata where visited_by_all_browsers2 = true group by browser, storagetype")
  results = cursor.fetchall()
  
  df = pd.DataFrame(columns=['browser','storagetype', 'totalNum'])
  print("totTotalStorage_SubsetWithStorage")
  
  for line in results:
    browser = line[0].strip()
    storagetype = line[1].strip()
    totalNum = line[2]

    print(f"{browser} has on average {totalNum} {storagetype} per website WITH storage in the subset")
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
  plt.figure("totTotalStorage_SubsetWithStorage")
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

  plt.savefig('./storagePlots/totTotalStorage_SubsetWithStorage.png')
  plt.close()





def main():
  dbConnection = psycopg2.connect("dbname=crawl01 user=postgres password=I@mastrongpsswd")
  cursor = dbConnection.cursor()

  
  ## COOKIES, LOCALSTORAGE, AND TOTAL WITHIN THE SUBSET USING ALL THE SUBSET SIZE
  # subsetSize = getSubsetSize(cursor)
  # avgNumCookies_Subset(cursor, subsetSize) 
  # avgNumLocalStorage_Subset(cursor, subsetSize)
  # avgTotalStorage_Subset(cursor, subsetSize)

  # ## COOKIES, LOCALSTORAGE, AND TOTAL WITHIN THE SUBSET USING ONLY SITES WITH THE STORAGE TYPE
  # avgNumCookies_SubsetWithCookies(cursor)
  # avgNumLocalStorage_SubsetWithLocalStorage(cursor)
  avgTotalStorage_SubsetWithStorage(cursor)

  # ## GET TOTALS, NOT AVG: COOKIES, LOCALSTORAGE, AND TOTAL WITHIN THE SUBSET
  # totNumCookies_SubsetWithCookies(cursor)
  # totNumLocalStorage_SubsetWithLocalStorage(cursor)
  # totTotalStorage_SubsetWithStorage(cursor)


  cursor.close()
  dbConnection.close()

if __name__ == '__main__':
  main()