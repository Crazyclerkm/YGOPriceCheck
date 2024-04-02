import requests
import time
import argparse
import json
import mysql.connector
from mysql.connector import Error
class ShopifyScraper():

    def __init__(self, vendor, baseurl):
        self.vendor = vendor
        self.baseurl = baseurl

    def getData(self, endpoint=None, delay=0.1):
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
                time.sleep(delay)
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

def loadVendors(vendors_file):
    with open(vendors_file) as f:
        data = f.read()

    return json.loads(data)

def create_server_connection(host_name, user_name, user_password, db_name=None):
    connection = None
    try:
        if db_name:
            connection = mysql.connector.connect(
                host=host_name,
                user=user_name,
                passwd=user_password,
                database=db_name
            )
            print("MySQL Database connection successful")
        else:
            connection = mysql.connector.connect(
                    host=host_name,
                    user=user_name,
                    passwd=user_password
                )
            print("MySQL Database connection successful")
    except Error as err:
        print(f"Error: '{err}'")

    return connection

def connectDB(db_name, host, username, password, table):
    conn = create_server_connection(host, username, password, db_name)

    cur = conn.cursor()

    create_product_table = f"""
            CREATE TABLE IF NOT EXISTS `{table}` (
            `variant_id` bigint(20) NOT NULL,
            `id` bigint(20) DEFAULT NULL,
            `name` text DEFAULT NULL,
            `handle` text DEFAULT NULL,
            `variant_title` text DEFAULT NULL,
            `price` decimal(10,2) DEFAULT NULL,
            `vendor` varchar(255) NOT NULL,
            `img_src` text DEFAULT NULL,
            PRIMARY KEY (`variant_id`, `vendor`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    cur.execute(create_product_table)
    conn.commit()

    return conn, cur

def processItemDB(table, item, cur):
    var_id = item['variant_id']
    vendor = item['vendor']

    if item['available']:
        image = 'none'
        if 'image' in item:
            image = item['image']

        query = f"INSERT INTO `{table}` (`variant_id`, `id`, `name`, `handle`, `variant_title`, `price`, `vendor`, `img_src`) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
        cur.execute(query, (var_id, item['id'], item['name'], item['handle'], item['variant_title'], item['price'], vendor, image))

def parseArguments():
    parser = argparse.ArgumentParser(description='Program to gather Yu-Gi-Oh card prices from a selection of shopify websites')
    parser.add_argument("db", type=str, help="The name of the database to connect to")
    parser.add_argument("host", help="Host of the database to connect to")
    parser.add_argument("username", help="Username for the database")
    parser.add_argument("password", help="Password for the database")
    parser.add_argument("-tb", "--table_name", help="The name of the table to use in the database", default="Products") 
    parser.add_argument("-v", "--vendors", help="The name of the file that contains the shops to search from", default="vendors.json") 
    parser.add_argument("--products_endpoint", help="The endpoint to gather data from each of the shopify websites", default="products.json?limit=250&page=")
    parser.add_argument("-t", "--time", help="Provide timing data for how long it takes to download all of the products", action="store_true")
    parser.add_argument("-vb", "--verbose", help="Provide print statements", action="store_true")
    parser.add_argument("--request_delay", "--delay", help="The mandatory delay between subsequent requests", default=0.1, type=float)
    args = parser.parse_args()
    return args

def main(args):
    if(args.time):
        tic = time.perf_counter()

    vendors = loadVendors(args.vendors)

    for vendor in vendors.keys():
        scraper = ShopifyScraper(vendor, vendors[vendor])

        if(args.verbose):
            print("Downloading data from " + vendor + "...")

        items = scraper.getData(args.products_endpoint, args.request_delay)

        conn, cur = connectDB(args.db, args.host, args.username, args.password, args.table_name)

        for item in items:
            processItemDB(args.table_name, item, cur)
            conn.commit()

        cur.close()
        conn.close()
    
    if(args.time):
        toc = time.perf_counter()
        print(f"Downloaded the database in {toc - tic:0.4f} seconds")
 
if __name__ == '__main__':
    args = parseArguments()
    main(args)