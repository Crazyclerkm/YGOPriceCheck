import {base, init, setCookie, getCookie, showProducts} from "./common.js";

// TODO: Adjust wishlist menu UI

const debounce = (mainFunction, delay) => {
    let timer;
  
    // Return a function that takes in arguments and runs mainFunction after the specified delay
    return function (...args) {
      clearTimeout(timer);
  
      timer = setTimeout(() => {
        mainFunction(...args);
      }, delay);
    };
  };

function fetchProducts(uri, callback, ...args) {
    const fetchPromise = fetch(uri, {
        headers: {
            "Accept": "application/json",
            Cookie: document.cookie,
        },
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

const debouncedfetchProducts = debounce(fetchProducts, 200);

let count = 1;
let lastScrollPosition = 0;
const search_bar = document.getElementById('search-input');
const productContainer = document.getElementById("product-container");
const sort_select = document.getElementById('sort-select')

search_bar.addEventListener("input", function() {
    resetProducts();
    getProducts();
});

productContainer.addEventListener("scroll", function() {
    if (productContainer.scrollTop > lastScrollPosition && (productContainer.scrollTop - lastScrollPosition) > 1) {
        lastScrollPosition = productContainer.scrollTop;
       
        // May not be exactly equal on some screen sizes due to sub-pixel precision
        if (productContainer.scrollHeight - productContainer.scrollTop <= (productContainer.clientHeight + 1)) {
            addProducts();
            count++;
        }
    }
});

sort_select.addEventListener("change", function() {
    setCookie("Sort", sort_select.value);
    resetProducts();
    getProducts();
});

document.getElementById('vendor-form').addEventListener('change', getProducts);
document.getElementById('close-wishlist-menu').addEventListener('click', closeWishlistMenu);

init();

if (!getCookie("Sort")) {
    setCookie("Sort", "");
} else {
    sort_select.value = getCookie("Sort");
}

if (!getCookie("Wishlist")) {
    setCookie("Wishlist", '');
}

if (!localStorage.getItem("Wishlist")) {
    localStorage.setItem("Wishlist", JSON.stringify(
        {
                "Wishlist": []
        }
    ));
}
 
getProducts();

function addProducts() {
    const search = document.getElementById('search-input').value;
    const uri = buildURI(search, count*12);
    debouncedfetchProducts(uri, showProducts, true, openWishlistMenu, '+');
}

function resetProducts() {
    count = 1;
    lastScrollPosition = 0;
    productContainer.scrollTo(0, 0);
    productContainer.innerHTML = "";
}

function getProducts() {
    const search = document.getElementById('search-input').value;
    const uri = buildURI(search, 0);
    debouncedfetchProducts(uri, showProducts, false, openWishlistMenu, '+');
}

function buildURI(search, index) {
    let uri;

    if(!search.trim().length) {
        uri = base + `Products/index=${index}&count=${12}`;
    } else {
        uri = base + `Products/${search}&index=${index}&count=${12}`;
    }

    return uri;
}

function addToWishlist(variant_id, vendor, wishlistName) {
    let wishlists = JSON.parse(localStorage.getItem("Wishlist"));
    let product = {"variant_id": variant_id, "vendor": vendor};

    if(!wishlists[wishlistName].some(element => element.variant_id == variant_id && element.vendor == vendor)) {
        wishlists[wishlistName].push(product);
        localStorage.setItem("Wishlist", JSON.stringify(wishlists));
        showWishlistNotification(true);
    } else {
        showWishlistNotification(false);
    }
}

function populateWishlists() {
    const wishlistContent = document.getElementById('wishlist-menu-content');
    wishlistContent.innerHTML = "";

    const wishlists = JSON.parse(localStorage.getItem("Wishlist"));
    
    let initial = true;

    for(let wishlist in wishlists) {
        const wishlistRadio = document.createElement('input');
        wishlistRadio.type = "radio";
        wishlistRadio.id = wishlist + "-radio";
        wishlistRadio.name = "wishlist-radio"

        const wishlistLabel = document.createElement('label');
        wishlistLabel.innerText = wishlist;
        wishlistLabel.htmlFor = wishlistRadio.id;

        wishlistContent.appendChild(wishlistRadio);
        wishlistContent.appendChild(wishlistLabel);
        wishlistContent.appendChild(document.createElement('br'));

        if(initial) {
            wishlistRadio.checked = true;
            initial = false;
        }
    }
}

function addNewWishlist(wishlistName) {
    let wishlists = JSON.parse(localStorage.getItem("Wishlist"));

    if(!wishlistName || wishlists[wishlistName]) return false;

    wishlists[wishlistName] = [];
    localStorage.setItem("Wishlist", JSON.stringify(wishlists));

    return true;
}

function openWishlistMenu(variant_id, vendor) {
    const wishlistMenu = document.getElementById('wishlist-menu');
    const wishlistHeader = document.getElementById('wishlist-menu-header');
    const wishlistFooter = document.getElementById('wishlist-menu-footer');

    wishlistMenu.style.display = "inline";

    wishlistHeader.style.display = "flex";
    wishlistHeader.style.justifyContent = "space-between";

    wishlistFooter.style.display = "flex";
    wishlistFooter.style.justifyContent = "space-around";

    populateWishlists();

    document.getElementById('new-wishlist').addEventListener('click', function() {
        const wishlistForm = document.getElementById("new-wishlist-form");
        wishlistForm.style.display = "flex";

        const submitButtom = document.getElementById("new-wishlist-submit");

        submitButtom.addEventListener('click', function eventHandler(){
            const wishlistInput = document.getElementById("new-wishlist-input");

            if(addNewWishlist(wishlistInput.value)) {
                wishlistInput.style.borderColor = "black";
                wishlistInput.value = "";
                wishlistForm.style.display = "none";
                submitButtom.removeEventListener('click', eventHandler);
                populateWishlists();
            } else {
                wishlistInput.style.borderColor = "red";
            }
        });
    });

    document.getElementById('add-wishlist').addEventListener('click', function eventHandler() {
        // Match last occurence of "-radio" in the radio button id
        const regex = /(-radio)(?!-radio)/;
        addToWishlist(variant_id, vendor, document.querySelector('input[name="wishlist-radio"]:checked').id.replace(regex,""));
        this.removeEventListener('click', eventHandler);
        closeWishlistMenu();
    });

    // Allow escape key to close the wishlist menu
    window.onkeydown = function(event) {
        if (event.which == 27) closeWishlistMenu();
        window.onkeydown = null;
    }
}

function closeWishlistMenu() {
    const wishlistMenu = document.getElementById('wishlist-menu');
    const wishlistForm = document.getElementById("new-wishlist-form");
    const wishlistInput = document.getElementById("new-wishlist-input");

    wishlistInput.style.value = "";
    wishlistInput.style.borderColor = "black";
    wishlistForm.style.display = "none";
    wishlistMenu.style.display = "none";
}

function showWishlistNotification(added) {
    const wishlistNotification = document.getElementById('wishlist-notification');
    
    wishlistNotification.style.width = "15%";

    if(added) {
        wishlistNotification.style.backgroundColor = "green";
        wishlistNotification.innerHTML = "<p>Added to wishlist<p>"
    } else {
        wishlistNotification.style.backgroundColor = "red";
        wishlistNotification.innerHTML = "<p>Already in wishlist</p>"
    }

    function removeNotification() {
        wishlistNotification.style.width = "0";
    }

    setTimeout(removeNotification, 2000);
}