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
  plt.figure("bar graph")
  plt.bar(df['browser'], df['totRequest'])
  plt.xticks(rotation=45)  # Rotates x-axis labels for better visibility
  plt.xlabel('Browser')
  plt.ylabel('Total Requests')
  plt.title('Total Requests per Browser')
  plt.show()  # Display the plot

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

  # Create a grouped box plot
  fig, ax = plt.subplots()

  # Group the data by 'browser' and aggregate 'numRequests' using a list
  grouped_data = df.groupby('browser')['numRequests'].apply(list)

  # Plot the grouped box plot
  ax.violinplot(grouped_data, showmedians=True)

  # Set x-axis tick positions and labels
  browsers = df['browser'].unique()
  x_positions = list(range(1, len(browsers) + 1))
  ax.set_xticks(x_positions)
  ax.set_xticklabels(browsers, rotation=45, ha='right')

  plt.xlabel('Browser')
  plt.ylabel('Number of Requests')
  plt.title('Request Distribution per Browser for Different URLs')
  plt.tight_layout()  # Improve spacing
  # Set the y-axis limit to 2500
  ax.set_ylim(0, 1000)
 
  plt.show()
  
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
  plt.figure("bar graph")
  ax = plt.bar(df['browser'], df['numDistinctFrames'])  # Provide both x and y values

  plt.xticks(rotation=45)  # Rotate x-axis labels for better visibility
  plt.xlabel('Browser')
  plt.ylabel('Number of Distinct Frames')
  plt.title('Total Number of Distinct Frames per Browser')
  plt.tight_layout()  # Improve spacing
  plt.show()

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
  plt.figure("bar graph")
  ax = plt.bar(df['browser'], df['numDistinctUrls'])  # Provide both x and y values

  plt.xticks(rotation=45)  # Rotate x-axis labels for better visibility
  plt.xlabel('Browser')
  plt.ylabel('Number of Distinct URLs')
  plt.title('Total Number of Distinct URLs per Browser')
  plt.tight_layout()  # Improve spacing
  plt.show()

def main():
  dbConnection = psycopg2.connect("dbname=crawl01 user=postgres password=I@mastrongpsswd")
  cursor = dbConnection.cursor()

  # avgRequests(cursor) # runs
  # avgRequests_sameSubset(cursor) #runs 
  # totalNumberRequests_sameSubset(cursor) #runs
  showRequestDistribution_sameSubset(cursor)
  # totNumDistinctFrames_sameSubset(cursor) #runs
  # totNumDistinctUrls_sameSubset(cursor) #runs

  cursor.close()
  dbConnection.close()

if __name__ == '__main__':
  main()