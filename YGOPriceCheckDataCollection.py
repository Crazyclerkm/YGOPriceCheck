import requests
import time
import argparse
import configparser
import os
import json
import mysql.connector
from mysql.connector import Error

class ShopifyScraper():
    def __init__(self, vendor, baseurl):
        self.vendor = vendor
        self.baseurl = baseurl

    def getData(self, endpoint=None, delay=0.1, max_retries=3):
        data = []
        page = 1

        try:
            while(True):
                ## Exponential backoff
                for attempt in range(max_retries):
                    r = requests.get(self.baseurl + f'{endpoint}{page}', timeout=5)
                    if r.status_code == 200:
                        break;
                    wait = 2 ** attempt
                    print(f'{self.vendor} returned {r.status_code}, retrying in {wait}s')
                    time.sleep(wait)
                else:   ## If for loop completed without breaking then we used up all retries
                    print(f'{self.vendor} failed after {max_retries} attempts on page {page}')
                    break
                json_data = r.json()
                products = json_data.get('products', [])
                if not products:
                    break
                data.extend(self.parseJson(products))
                page += 1
                time.sleep(delay)
        except(requests.RequestException, KeyError, ValueError) as e:
            print(f'An error occured processing {self.vendor}: {e}')
        return data
        
    def parseJson(self, jsondata):
        products = []

        for product in jsondata:
            id = product['id']
            name = product['title']
            handle = product['handle']

            for variant in product['variants']:
                if not variant['available']:
                    continue
                item = {
                    'id': id,
                    'name': name,
                    'handle': handle,
                    'variant_id': variant['id'],
                    'variant_title': variant['title'],
                    'price': variant['price'],
                    'vendor': self.vendor
                }

                item['available'] = True

                if len(product['images']) > 0:
                    item['image'] = product['images'][0]['src']

                products.append(item)

        return products

def loadVendors(vendors_file):
    with open(vendors_file) as f:
        return json.load(f)

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
    parser.add_argument("--config", help="The path to the database config file", default=os.path.join(os.path.dirname(__file__), 'db.ini'))
    parser.add_argument("-tb", "--table_name", help="The name of the table to use in the database", default="Products") 
    parser.add_argument("-v", "--vendors", help="The name of the file that contains the shops to search from", default="vendors.json") 
    parser.add_argument("--products_endpoint", help="The endpoint to gather data from each of the shopify websites", default="products.json?limit=250&page=")
    parser.add_argument("-t", "--time", help="Provide timing data for how long it takes to download and process all of the products", action="store_true")
    parser.add_argument("-vb", "--verbose", help="Provide print statements", action="store_true")
    parser.add_argument("--request_delay", "--delay", help="The mandatory delay between subsequent requests", default=0.1, type=float)
    parser.add_argument("--batch_size", type=int, default=500, help="Number of items to insert into the database at a time")
    parser.add_argument("--max_retries", type=int, default=3, help="Maximum number of retries on a failed request")
    args = parser.parse_args()
    return args

def processBatchItems(table, batch, cur):
    query = f"INSERT IGNORE INTO `{table}` (`variant_id`, `id`, `name`, `handle`, `variant_title`, `price`, `vendor`, `img_src`) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
    cur.executemany(query, [(item['variant_id'], item['id'], item['name'], item['handle'], item['variant_title'], item['price'], item['vendor'], item.get('image', 'none')) for item in batch])

def main(args):
    download_time = 0
    upload_time = 0

    config = configparser.ConfigParser()
    file_read = config.read(args.config)

    if not file_read:
        print("Could not read database config file")
        return
    try:
        host = config['db']['servername']
        username = config['db']['username']
        password = config['db']['password']
        database = config['db']['database']
    except KeyError as e:
        print(f"Missing key in database config file: {e}")
        return

    vendors = loadVendors(args.vendors)

    for vendor in vendors.keys():
        scraper = ShopifyScraper(vendor, vendors[vendor])

        if(args.verbose):
            print("Downloading data from " + vendor + "...")

        tic1 = time.perf_counter()
        items = scraper.getData(args.products_endpoint, args.request_delay)
        toc1 = time.perf_counter()

        download_time += toc1 - tic1

        tic2 = time.perf_counter()
        conn, cur = connectDB(database, host, username, password, args.table_name)

        num_items = len(items)
        for i in range(0, num_items, args.batch_size):
            processBatchItems(args.table_name, items[i:i+args.batch_size], cur) 

        conn.commit()
        cur.close()
        conn.close()
        toc2 = time.perf_counter()

        upload_time += toc2 - tic2

    if(args.time):
        print(f"Downloaded data in {download_time:0.4f} seconds")
        print(f"Uploaded the database in {upload_time:0.4f} seconds") 

if __name__ == '__main__':
    args = parseArguments()
    main(args)
