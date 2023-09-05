import psycopg2
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np


def numBannersVisible_USUK_Intersection(cursor, path):
  cursor.execute("""
  select browser, count(distinct(websiteurl))
  from bannerdata
  where visibilityandpresence = true
  and visited_by_all_browsers = true
  and websiteurl in (select * from usuk_websites)
  group by browser
  """)
  results = cursor.fetchall()
  df = pd.DataFrame(columns=['browser', 'numBannersVisible'])

  print("numBannersVisible_USUK_Intersection")
  
  for line in results:
    browser = line[0].strip()
    numBannersVisible = line[1]
    df = pd.concat([pd.DataFrame([[browser,numBannersVisible]], columns=df.columns), df], ignore_index=True)

    print(f"{browser} has a total of {numBannersVisible} numBannersVisible in the subset of websites visited by every browser")
  
  # Sort the DataFrame by 'numBannersVisible' in descending order
  df = df.sort_values(by='numBannersVisible', ascending=False)

  # Create bar graph
  plt.figure("numBannersVisible_USUK_Intersection")
  plt.bar(df['browser'], df['numBannersVisible'])
  plt.xticks(rotation=45)  # Rotates x-axis labels for better visibility
  plt.xlabel('Browser')
  plt.ylabel('Number of Banners Visible')
  plt.title('Number of Banners Visible per Browser')
  plt.tight_layout()

  plt.savefig(path+'/numBannersVisible_USUK_Intersection.png')  
  plt.close()



def main():
  US = False
  if US:
    dbConnection = psycopg2.connect("dbname=crawlUS user=postgres password=I@mastrongpsswd")
    path = '../US_bannerPlots'
  
  else:
    dbConnection = psycopg2.connect("dbname=crawlUK user=postgres password=I@mastrongpsswd")
    path = '../bannerPlots'

  cursor = dbConnection.cursor()

  numBannersVisible_USUK_Intersection(cursor, path)
  
  cursor.close()
  dbConnection.close()

if __name__ == '__main__':
  main()