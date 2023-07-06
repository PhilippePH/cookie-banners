import mysql.connector

databaseConnection = mysql.connector.connect(
    host = '127.0.0.1',
    user = 'root',
    password ='I@mastrongpsswd',
    database ='CrawlData',
)

cursor = databaseConnection.cursor()
cursor.execute("SELECT * FROM HTML_data WHERE url = 'https://www.imperial.ac.uk/'")
result = cursor.fetchall()

for line in result:
  crawlID = line[0]
  browser = line[1]
  url = line[2]
  html = line[3]

  print(browser)
