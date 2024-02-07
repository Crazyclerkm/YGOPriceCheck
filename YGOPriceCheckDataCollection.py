import requests
import sqlite3
import time
import argparse
import json
import concurrent.futures
from threading import Thread

class ShopifyScraper():

    def __init__(self, vendor, baseurl):
        self.vendor = vendor
        self.baseurl = baseurl

    def getData(self, endpoint=None):
        data = []
        page = 1

        ## Get the first page of item data from the assosciated vendor
        r = requests.get(self.baseurl + f'{endpoint}{page}', timeout=5)
        if r.status_code != 200:
            print(self.vendor + ' returned status code: ', r.status_code)

        ## Go through all pages of products, processing each item until the request returns no products
        try:
            while len(r.json()['products'])>0:
                productJson = r.json()['products']
                products = self.parseJson(productJson)
                data.extend(products)

                page += 1
                time.sleep(args.request_delay)
                r = requests.get(self.baseurl + f'{endpoint}{page}', timeout=5)
        except:
            print("An error occured processing the following response from " + self.vendor + ":")
            print(r.content)
        return data
        
    def parseJson(self, jsondata):
        products = []

        for product in jsondata:
            id = product['id']
            name = product['title']
            handle = product['handle']

            for variant in product['variants']:
                item = {
                    'id': id,
                    'name': name,
                    'handle': handle,
                    'variant_id': variant['id'],
                    'variant_title': variant['title'],
                    'price': variant['price'],
                    'vendor': self.vendor
                }

                item['available'] = False
                if variant['available']:
                    item['available'] = True

                if len(product['images']) > 0:
                    item['image'] = product['images'][0]['src']

                products.append(item)
                
        return products

## TODO: Create tests 
def loadVendors(vendors_file):
    with open(vendors_file) as f:
        data = f.read()

    return json.loads(data)

def connectDB(db_name):
    conn = sqlite3.connect(db_name + '.db', check_same_thread=False)
    cur = conn.cursor()

    cur.execute(''' 
                    CREATE TABLE IF NOT EXISTS Products
                    ([variant_id] INTEGER, [id] BIGINT, [name] TEXT, [handle] TEXT, [variant_title] TEXT, [price] MONEY, [vendor] TEXT, [img_src] TEXT, CONSTRAINT PK_Product PRIMARY KEY (variant_id,vendor))
                ''')
    conn.commit()
    return cur

def processItemDB(item, cur):
    var_id = item['variant_id']
    vendor = item['vendor']
    key = (var_id, vendor)

    cur.execute("SELECT * FROM Products WHERE variant_id=? AND vendor=?", key)
    result = cur.fetchone()

    ## If an item is not present in the database, add it if available, else update price and image if needed
    ## If an item is present in the database and is no longer available, remove it
    if result is None and item['available']:
        query = "INSERT INTO Products (variant_id, id, name, handle, variant_title, price, vendor, img_src) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        image = 'none'
        if 'image' in item:
            image = item['image']

        cur.execute(query, (var_id, item['id'], item['name'], item['handle'], item['variant_title'], item['price'], vendor, image))

    elif result is not None and not item['available']:
        query = "DELETE FROM Products WHERE variant_id=? AND vendor=?"
        cur.execute(query, key)

    elif result is not None:
        if result[5] is not item['price']:
            query = "UPDATE Products SET price=?WHERE variant_id=? AND vendor=?"
            cur.execute(query, (item['price'], var_id, vendor))

        if 'image' in item and result[7] is not item['image']:
            query = "UPDATE Products SET img_src=? WHERE variant_id=? AND vendor=?"
            cur.execute(query, (item['image'], var_id, vendor))


    cur.connection.commit()

## TODO: Revise abbreviations
def parseArguments():
    parser = argparse.ArgumentParser(description='Program to gather Yu-Gi-Oh card prices from a selection of shopify websites')
    parser.add_argument("-db", "--db_name", help="The name of the database to create/connect to. Does not include the file extension.", default="YGOPriceCheck")
    parser.add_argument("-v", "--vendors", help="The name of the file that contains the shops to search from", default="vendors.json") 
    parser.add_argument("--products_endpoint", help="The endpoint to gather data from each of the shopify websites", default="products.json?limit=250&page=")
    parser.add_argument("-t", "--time", help="Provide timing data for how long it takes to download all of the products", action="store_true")
    parser.add_argument("-vb", "--verbose", help="Provide print statements", action="store_true")
    parser.add_argument("--request_delay", "--delay", help="The mandatory delay between subsequent requests", default=0.1, type=float)
    args = parser.parse_args()
    return args

def main(args):
    if(args.verbose):
        print("Downloading data...")

    if(args.time):
        tic = time.perf_counter()

    cur = connectDB(args.db_name)
    cur.connection.commit()
    vendors = loadVendors(args.vendors)

    for vendor in vendors.keys():
        scraper = ShopifyScraper(vendor, vendors[vendor])
        items = scraper.getData(args.products_endpoint)

        for item in items:
            processItemDB(item, cur)
    
    cur.connection.close()

    if(args.time):
        toc = time.perf_counter()
        print(f"Downloaded the database in {toc - tic:0.4f} seconds")
 
if __name__ == '__main__':
    args = parseArguments()
    main(args)