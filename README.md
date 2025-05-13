
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

Then run YGOPriceCheckDataCollection.py

After the database has been created you can then run YGOPriceCheckServer.py to serve a webpage displaying the data.

From then on you can run YGOPriceCheckDataCollection.py whenever you want to update the database (the server can stay running).
