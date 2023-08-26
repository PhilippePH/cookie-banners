import psycopg2
import matplotlib as plt
import pandas as pd
plt.style.use('_mpl-gallery')

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
  cursor.execute('SELECT browser, count(websiteurl) from requestdata group by browser where visited_by_all_browsers = true')
  results = cursor.fetchall()
  df = pd.DataFrame(columns=['browser', 'totRequest'])

  print("totalNumberRequests_sameSubset")
  
  for line in results:
    browser = line[0].strip()
    numRequests = line[1]
    df = pd.concat([pd.DataFrame([[browser,numRequests]], columns=df.columns), df], ignore_index=True)

    print(f"{browser} has a total of {numRequests} requests in the subset of websites visited by every browser")
  
  # plot bar graph
  plt.figure("bar graph")
  ax = plt.bar(y=df['totRequest'])
  ax.set_xticklabels(df['browser'])

def showRequestDistribution_sameSubset(cursor):
  cursor.execute('SELECT browser, websiteurl, count(requestedurl) from requestdata group by browser where visited_by_all_browsers = true')
  results = cursor.fetchall()
  df = pd.DataFrame(columns=['browser', 'wesbiteurl', 'numRequests'])

  print("totalNumberRequests_sameSubset")
  
  fig, ax = plt.subplots()
  ax.margins(0.05) # Optional, just adds 5% padding to the autoscaling

  for line in results:
    browser = line[0].strip()
    websiteurl = line[1]
    numRequests = line[2]
    df = pd.concat([pd.DataFrame([[browser, websiteurl, numRequests]], columns=df.columns), df], ignore_index=True)
    
  groups = df.groupby('websiteurl')
  for name, group in groups:
    ax.plot(group.browser, group.numRequests, marker='o', linestyle='', ms=12)
  plt.show()

def totNumDistinctFrames_sameSubset(cursor):
  cursor.execute('SELECT browser, count(disinct(frameorigin)) from requestdata group by browser where visited_by_all_browsers = true')
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
  ax = plt.bar(y=df['numDistinctFrames'])
  ax.set_xticklabels(df['browser'])

  plt.show()

def totNumDistinctUrls_sameSubset(cursor):
  cursor.execute('SELECT browser, count(disinct(requestedurl)) from requestdata group by browser where visited_by_all_browsers = true')
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
  ax = plt.bar(y=df['numDistinctUrls'])
  ax.set_xticklabels(df['browser'])

  plt.show()

def main():
  dbConnection = psycopg2.connect("dbname=crawl01 user=postgres password=I@mastrongpsswd")
  cursor = dbConnection.cursor()

  avgRequests(cursor)
  avgRequests_sameSubset(cursor)
  totalNumberRequests_sameSubset(cursor)
  showRequestDistribution_sameSubset(cursor)
  totNumDistinctFrames_sameSubset(cursor)
  totNumDistinctUrls_sameSubset(cursor)

  cursor.close()
  dbConnection.close()