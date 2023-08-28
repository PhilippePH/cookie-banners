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


def main():
  dbConnection = psycopg2.connect("dbname=crawl01 user=postgres password=I@mastrongpsswd")
  cursor = dbConnection.cursor()

  avgContentLength(cursor)


  cursor.close()
  dbConnection.close()

if __name__ == '__main__':
  main()