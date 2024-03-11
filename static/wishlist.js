import { base, init, showProducts} from './common.js';

document.getElementById('vendor-form').addEventListener('change', loadWishlists);

init();
loadWishlists();

function getWishlist(wishlist, callback, ...args) {
    const fetchPromise = fetch(base + 'cardlist', {
        method: "POST",
        headers: {
            "Content-type": "application/json; charset=UTF-8",
            Cookie: document.cookie,
        },
        body: wishlist
        }); 

    const streamPromise = fetchPromise.then((response) => {
        const contentLength = response.headers.get("Content-Length");
        if (contentLength === '0') {
            return null;
        } else {
            return response.json();
        }
    }).then((data) => {
        if (data != null) {
            callback(data, ...args);
        }
    });
}

// TODO: Add a loading indicator
function loadWishlists()  {
    const wishlists = JSON.parse(localStorage.getItem("Wishlist"));

    const wishlistContent = document.getElementById("wishlist-content");
    wishlistContent.innerHTML = "";

    for(let wishlist in wishlists) {
        const container = document.createElement('div');
        const header = document.createElement('div');
        const products = document.createElement('div');
        
        container.className = "wishlist-container";
        header.className = "wishlist-header";
        products.className = "wishlist-products";

        const title = document.createElement('h2');
        title.textContent = wishlist;

        const minimiseButton = document.createElement('img');
        const deleteButton = document.createElement('img');
        const editButton = document.createElement('img');

        minimiseButton.className = "wishlist-header-button";
        deleteButton.className = "wishlist-header-button";
        editButton.className  = "wishlist-header-button";

        minimiseButton.src = "static/-.svg"
        deleteButton.src = "static/delete.svg";
        editButton.src = "static/edit.svg";

        minimiseButton.style.height = "32px";
        deleteButton.style.height = "32px";
        editButton.style.height = "32px";

        minimiseButton.onclick = function() {
            if(products.style.display == 'none') {
                products.style.display = 'flex';
                minimiseButton.src = 'static/-.svg';
            } else {
                products.style.display = 'none';
                minimiseButton.src = 'static/+.svg';
            }  
        }

        deleteButton.onclick = function() {
            container.remove();
            deleteWishlist(wishlist);
        }

        header.appendChild(title);
        header.appendChild(editButton);
        header.appendChild(deleteButton);
        header.appendChild(minimiseButton);

        container.appendChild(header);

        getWishlist(JSON.stringify(wishlists[wishlist]), showProducts, true, removeFromWishlist, '-', products, wishlist);
       
        container.append(products);
        wishlistContent.appendChild(container);
    }
}

// TODO: Add confirmation popup
function deleteWishlist(wishlistName) {
    let wishlists = JSON.parse(localStorage.getItem("Wishlist"));
    delete wishlists[wishlistName];
    localStorage.setItem("Wishlist", JSON.stringify(wishlists));
}

function removeFromWishlist(variant_id, vendor, wishlistName, event) {
    let wishlists = JSON.parse(localStorage.getItem("Wishlist"));
    let wishlistItem = wishlists[wishlistName].find(element => element.variant_id == variant_id && element.vendor == vendor);

    const index = wishlists[wishlistName].indexOf(wishlistItem);
    wishlists[wishlistName].splice(index, 1);

    localStorage.setItem("Wishlist", JSON.stringify(wishlists));
    event.target.parentElement.remove();
}