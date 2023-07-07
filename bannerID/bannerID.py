import mysql.connector

# Question: Should we have something detecting the language and droping sites not in english?


# Identifier word selection comes from "Exploring the Cookieverse: A Multi-Perspective Analysis of Web Cookies"
# Capitalization does not matter
IDENTIFIER_WORDS = ["cookies", "privacy", "policy", "consent", "accept", 
                    "agree", "personalized", "legitimate interest"]
POSITIVE_CSS_WORDS = ["z-index", "position: fixed"]
NEGATIVE_CSS_WORDS = ["display: none", "visibility: hidden"]
OTHER_WORD_IDEAS = ["gdpr", "onetrust"]

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


# Here, use BeautifulSoup, because we need to make our analysis more closely based on the place where we find certain terms
def findCookieBanner(html):
    for word in IDENTIFIER_WORDS:
        if word in html:
            for css_word in POSITIVE_CSS_WORDS:
                if css_word in html:
                    for hide_word in NEGATIVE_CSS_WORDS:
                        if hide_word in html:
                            return False
                        return True
    return False

def analyzeData(data):
    values = []
    for line in data:
        values.append(findCookieBanner(line[3]))
    return values

def main():
    databaseConnection = connectDatabase()

    # queries the data from the last crawl only
    query = "SELECT * FROM HTML_data WHERE crawlID = (SELECT MAX(crawlID) FROM HTML_data)"
    data = getData(databaseConnection, query)
    hasACookieBanner = analyzeData(data)
    for i in range(len(data)):
        print(data[i][1], "    ", data[i][2], "    ", hasACookieBanner[i])

main()
