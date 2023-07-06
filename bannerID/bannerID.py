import mysql.connector

# Identifier word selection comes from "Exploring the Cookieverse: A Multi-Perspective Analysis of Web Cookies"
IDENTIFIER_WORDS = ["cookies", "privacy", "policy", "consent", "accept", 
                    "agree", "personalized", "legitimate interest"]

def connectDatabase():
   """ Connects to database server on my machine """
   return mysql.connector.connect(
        host = '127.0.0.1',
        user = 'root',
        password ='I@mastrongpsswd',
        database ='CrawlData',
    )

def getData(databaseConnection, query):
    """ Connects to SQL Databases and returns the result of the query/
    """
    cursor = databaseConnection.cursor()
    cursor.execute(query)
    return cursor.fetchall()

def findCookieBanner(html):
    for word in IDENTIFIER_WORDS:
        if word in html:
            return True
    return False

def analyzeData(data):
    values = []
    for line in data:
        crawlID = line[0]
        browser = line[1]
        url = line[2]
        html = line[3]
        values.append(findCookieBanner(html))
    return values

def main():
    databaseConnection = connectDatabase()

    # queries the data from the last crawl only
    query = "SELECT * FROM HTML_data WHERE crawlID = (SELECT MAX(crawlID) FROM HTML_data)"
    data = getData(databaseConnection, query)
    print(analyzeData(data))

main()
