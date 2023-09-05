import psycopg2
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

def thirdPartyTotalStorage_Subset(cursor, path):
  cursor.execute("""
    select browser, storagetype, count(*) 
    from storagedata 
    where visited_by_all_browsers = true 
    and websiteurl <> frameorigin 
    and websiteurl in (select * from usuk_storage_urls)
    and browser <> 'Firefox'
    group by browser, storagetype
    """)
  
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

  plt.savefig(path+'/thirdPartyTotalStorage_Subset_USUK_Intersection.png')
  plt.close()

def main():
  US = True
  if US:
    dbConnection = psycopg2.connect("dbname=crawlUS user=postgres password=I@mastrongpsswd")
    path = '../US_thirdPartyStoragePlots'
  
  else:
    dbConnection = psycopg2.connect("dbname=crawlUK user=postgres password=I@mastrongpsswd")
    path = '../thirdPartyStoragePlots'

  cursor = dbConnection.cursor()

  thirdPartyTotalStorage_Subset(cursor, path)


  cursor.close()
  dbConnection.close()

if __name__ == '__main__':
  main()