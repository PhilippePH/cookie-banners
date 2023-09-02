import psycopg2
import matplotlib.pyplot as plt
import pandas as pd

def avgContentLength(cursor):
  cursor.execute('SELECT browser, count(*) as numReponses, sum(contentlength) from responsedata group by browser')
  results = cursor.fetchall()
  
  print("avgContentLength")
  
  for line in results:
    browser = line[0].strip()
    numReponses = line[1]
    contentLengthSum = line[2]

    print(f"{browser} has on average {round(contentLengthSum/numReponses,2)} content length per responses visited")


def totalNumberResponses_sameSubset(cursor):
  cursor.execute('SELECT browser, count(websiteurl) from responsedata where visited_by_all_browsers = true group by browser')
  results = cursor.fetchall()
  df = pd.DataFrame(columns=['browser', 'totResponses'])

  print("totalNumberResponses_sameSubset")
  
  for line in results:
    browser = line[0].strip()
    numResponses = line[1]
    df = pd.concat([pd.DataFrame([[browser,numResponses]], columns=df.columns), df], ignore_index=True)

    print(f"{browser} has a total of {numResponses} requests in the subset of websites visited by every browser")
  
  # Create bar graph
  plt.figure("totalNumberResponses_sameSubset")
  plt.bar(df['browser'], df['totResponses'])
  plt.xticks(rotation=45)  # Rotates x-axis labels for better visibility
  plt.xlabel('Browser')
  plt.ylabel('Total Reponses')
  plt.title('Total Reponses per Browser')
  plt.tight_layout()

  plt.savefig('./responsePlots/totalNumberResponses_sameSubset.png')  
  plt.close()


import matplotlib.pyplot as plt
import pandas as pd

def totalNumberResponses_sameSubset_PercentageChange(cursor):
    cursor.execute('SELECT browser, count(websiteurl) from responsedata where visited_by_all_browsers = true group by browser')
    results = cursor.fetchall()
    df = pd.DataFrame(columns=['browser', 'totResponses'])

    print("totalNumberResponses_sameSubset_PercentageChange")

    for line in results:
        browser = line[0].strip()
        numResponses = line[1]
        df = pd.concat([pd.DataFrame([[browser, numResponses]], columns=df.columns), df], ignore_index=True)

   # Calculate the percentage change compared to Google Chrome
    google_chrome_responses = df[df['browser'] == 'Google Chrome']['totResponses'].values[0]
    df['percentage_change'] = ((df['totResponses'] / google_chrome_responses) - 1) * 100

    # Remove the Google Chrome row from the DataFrame
    df = df[df['browser'] != 'Google Chrome']

    # Create bar graph
    plt.figure("totalNumberResponses_sameSubset_PercentageChange")
    plt.bar(df['browser'], df['percentage_change'])
    plt.xticks(rotation=45)  # Rotates x-axis labels for better visibility
    plt.xlabel('Browser')
    plt.ylabel('Percentage Change compared to Google Chrome')
    plt.title('Percentage Change of Total Responses per Browser compared to Google Chrome')
    plt.tight_layout()

    plt.savefig('./responsePlots/totalNumberResponses_sameSubset_PercentageChange.png')
    plt.close()


def popularContentTypeCountPerBrowser(cursor):
    cursor.execute("""
    SELECT
      browser,
      SPLIT_PART(contenttype, ';', 1) AS content_type,
      COUNT(*) AS content_type_count
    FROM
      responsedata
    WHERE
      SPLIT_PART(contenttype, ';', 1) in ('application/javascript', 'application/json', 'image/jpeg', 'image/png', 'text/javascript', 'text/html')
    GROUP BY
      browser,
      SPLIT_PART(contenttype, ';', 1)
  """)
    results = cursor.fetchall()
    df = pd.DataFrame(columns=['browser', 'content_type', 'count'])

    print("popularContentTypeCountPerBrowser")

    for line in results:
        browser = line[0].strip()
        content_type = line[1]
        count = line[2]
        df = pd.concat([pd.DataFrame([[browser, content_type, count]], columns=df.columns), df], ignore_index=True)

    # Pivot the DataFrame to prepare for grouped bar chart
    df_pivot = df.pivot(index=['content_type'], columns='browser', values='count')

    # Create grouped bar chart with a logarithmic y-axis scale
    ax = df_pivot.plot(kind='bar', figsize=(12, 8))
    plt.xticks(rotation=45)
    plt.xlabel('Content Type')
    plt.ylabel('Total Responses (Log Scale)')
    plt.title('Total Responses per Content Type and Browser (Log Scale) - Sorted by Count')
    plt.tight_layout()

    plt.savefig('./responsePlots/popularContentTypeCountPerBrowser.png')
    plt.close()


def popularContentTypeCountPerBrowserPercentageChange(cursor):
  cursor.execute("""
    SELECT
      browser,
      SPLIT_PART(contenttype, ';', 1) AS content_type,
      COUNT(*) AS content_type_count
    FROM
      responsedata
    WHERE
      SPLIT_PART(contenttype, ';', 1) in ('application/javascript', 'application/json', 'image/jpeg', 'image/png', 'text/javascript', 'text/html')
    GROUP BY
      browser,
      SPLIT_PART(contenttype, ';', 1)
  """)
  results = cursor.fetchall()
  df = pd.DataFrame(columns=['browser', 'content_type', 'count'])

  print("popularContentTypeCountPerBrowserPercentageChange")
  
  for line in results:
    browser = line[0].strip()
    content_type = line[1]
    count = line[2]
    df = pd.concat([pd.DataFrame([[browser, content_type, count]], columns=df.columns), df], ignore_index=True)

  # Pivot the DataFrame to prepare for grouped bar chart
  df_pivot = df.pivot(index=['content_type'], columns='browser', values='count')

  # Calculate the percentage change compared to Google Chrome and make it negative
  df_pivot_percentage = ((df_pivot.div(df_pivot['Google Chrome'], axis=0) - 1) * 100).drop(columns='Google Chrome')

  # Create grouped bar chart
  ax = df_pivot_percentage.plot(kind='bar', figsize=(10, 6))
  plt.xticks(rotation=45)
  plt.xlabel('Browser')
  plt.ylabel('Percentage Change compared to Google Chrome')
  plt.title('Percentage Change of Total Responses per Browser and Content Type compared to Google Chrome')
  plt.tight_layout()

  plt.savefig('./responsePlots/popularContentTypeCountPerBrowserPercentageChange.png')
  plt.close()




def pieChartContentType(cursor):
  cursor.execute("""
  SELECT
  browser,
  SPLIT_PART(contenttype, ';', 1) AS content_type,
  COUNT(*) AS content_type_count
  FROM
  responsedata
  GROUP BY
  browser, SPLIT_PART(contenttype, ';', 1)
                """)
  results = cursor.fetchall()
  
  # Create a DataFrame from the data
  df = pd.DataFrame(columns=["Browser", "Content_Type", "Count"])
  print("pieChartContentType")
  
  for line in results:
    browser = line[0].strip()
    content_type = line[1]
    count = line[2]

    df = pd.concat([pd.DataFrame([[browser, content_type, count]], columns=df.columns), df], ignore_index=True)

  # Get distinct browser values
  distinct_browsers = df["Browser"].unique()

  for browser in distinct_browsers:
    browser_data = df[df["Browser"] == browser]
    browser_data = browser_data.sort_values(by="Count", ascending=False)
    
    top_10_content_types = browser_data.head(10)
    other_count = browser_data.iloc[10:]["Count"].sum()

    # Create a list of content types for the pie chart
    content_types = top_10_content_types["Content_Type"].tolist()
    content_types.append("Other")

    # Calculate counts for the pie chart
    counts = top_10_content_types["Count"].tolist()
    counts.append(other_count)

    # Create a pie chart
    plt.figure(f"pieChartContentType_{browser}")
    plt.pie(counts, labels=content_types, autopct="%1.1f%%")
    plt.title(f"Content Types Distribution - {browser}")
    plt.axis("equal")  # Equal aspect ratio ensures that pie is drawn as a circle.
    plt.savefig(f"./responsePlots/pieChartContentType_{browser}.png")
    plt.close()




def main():
  dbConnection = psycopg2.connect("dbname=crawl01 user=postgres password=I@mastrongpsswd")
  cursor = dbConnection.cursor()

  # avgContentLength(cursor)  # doesn't yet work with non-number content length

  # totalNumberResponses_sameSubset(cursor)
  # totalNumberResponses_sameSubset_PercentageChange(cursor)
  # popularContentTypeCountPerBrowser(cursor)
  # popularContentTypeCountPerBrowserPercentageChange(cursor)

  pieChartContentType(cursor)

  cursor.close()
  dbConnection.close()

if __name__ == '__main__':
  main()