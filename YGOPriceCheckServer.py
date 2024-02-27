import os
import json
from flask import Flask, render_template, Response, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func, text
from flask import request
from markupsafe import escape

app = Flask(__name__)
db = SQLAlchemy()

VERSION_NUM = 0.3

basedir = os.path.abspath(os.path.dirname(__file__))
db_name = 'YGOPriceCheck.db'

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, db_name)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True

db.init_app(app)

class Product(db.Model):
    __tablename__ = 'Products'
    variant_id = db.Column(db.Integer, primary_key=True)
    id = db.Column(db.BigInteger)
    name = db.Column(db.String)
    handle = db.Column(db.String)
    variant_title = db.Column(db.String)
    price = db.Column(db.String)
    vendor = db.Column(db.String, primary_key=True)
    img_src = db.Column(db.String)
    
    @property
    def serialized(self):
        """Return object data in serializeable format"""
        return {
            'variant_id': self.variant_id,
            'id': self.id,
            'name': self.name,
            'handle': self.handle,
            'variant_title': self.variant_title,
            'price': self.price,
            'vendor': self.vendor,
            'img_src': self.img_src
        }

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(basedir, 'static'),'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/wishlist')
def wishlist():
    return render_template('wishlist.html')

@app.route('/version')
def version():
    return Response(str(VERSION_NUM), mimetype='text/plain')

@app.route('/changelog')
def changelog():
    with open(os.path.join(basedir, 'static', 'changelog.txt'), "r") as file:
        content = file.readlines()
        return Response(content, mimetype='text/plain')

@app.route('/vendors')
def vendors():
    with open(os.path.join(basedir, 'vendors.json'), "r") as file:
        content = file.read()

    return Response(content, mimetype='application/json')

@app.route('/Products')
@app.route('/Products/<name>')
@app.route('/Products/index=<int:index>&count=<int:count>')
@app.route('/Products/<name>&index=<int:index>&count=<int:count>')
def getProducts(name=None, index=-1, count=-1):
    vendors = None;
    if 'Vendors' in request.cookies:
        vendor_string = request.cookies.get('Vendors')
        vendors = list(filter(None, vendor_string.split('|')))

    try:
        query = db.select(Product)
        if (name != None):
            keywords = list(filter(None, name.split(' ')))
            for word in keywords:
                query = query.filter(func.lower(Product.name).contains(func.lower(escape(word))))
        
        if (vendors != None):
            query = query.filter(Product.vendor.in_(vendors))
        
        if (index != -1 and count != -1):
            query = query.limit(escape(count)).offset(escape(index))

        if 'Sort' in request.cookies:
            query = query.order_by(text(escape(request.cookies.get('Sort').lower())))

        products = db.session.execute(query).scalars()

        return Response(json.dumps([product.serialized for product in products]), mimetype='application/json')
    
    except Exception as e:
        error_text = "<p>The error:<br>" + str(e) + "</p>"
        hed = '<h1>Something is broken.</h1>'
        return hed + error_text

@app.route('/cardlist', methods=['POST'])
def getWishlist():
    wishlist = request.json
    products = []

    vendors = None;
    if 'Vendors' in request.cookies:
        vendor_string = request.cookies.get('Vendors')
        vendors = list(filter(None, vendor_string.split('|')))

    for item in wishlist:
        if vendors != None and item["vendor"].replace("\\'", "'") in vendors:
            product = db.session.get(Product, (item["variant_id"], item["vendor"].replace("\\'", "'")))

            if product is not None:
                products.append(product)

    return Response(json.dumps([product.serialized for product in products]), mimetype='application/json')      

if __name__ == "__main__":
   app.run(debug=True, host="0.0.0.0")