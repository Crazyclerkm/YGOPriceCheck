
# YGOPriceCheck

YGOPriceCheck is a project aimed at collecting product data from a list of specified Shopify shops, collating this information into a database, and then providing a server and website to access this information for end users. 

Originally designed to be used for New Zealand based vendors of single cards for the trading card game Yu-Gi-Oh!, although should be compatible with all Shopify webstores.

To setup, create a 'vendors.json' file containing a list of vendor names and the endpoint to that vendors products in the following format:

```json
{
  "example vendor 1" : "https://www.examplevendor.com/collections/example-products-endpoint-1/",
  "example vendor 2" : "https://www.examplevendor.com/collections/example-products-endpoint-2/",
  ...
}
```

As well as a db.ini containing the mysql database details in the parent folder to search.php with the following format:
```
[db]
servername = 
database =
username =
password = 
```

Then run YGOPriceCheckDataCollection.py to create the database. \
**Note** that by default this will look for the database config file and the vendors.json file in it's current directory, use the --config flag and the -v or --vendors flag to change these.
