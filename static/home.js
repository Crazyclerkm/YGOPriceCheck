import {base, init, setCookie, getCookie, showProducts, showLoading, hideLoading} from "./common.js";

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

function loadOnScrollBottom() {
    if (productContainer.scrollTop > lastScrollPosition && (productContainer.scrollTop - lastScrollPosition) > 1) {
        lastScrollPosition = productContainer.scrollTop;
       
        // May not be exactly equal on some screen sizes due to sub-pixel precision
        if (productContainer.scrollHeight - productContainer.scrollTop <= (productContainer.clientHeight + 1)) {
            addProducts();
            count++;
        }
    }
}

function fetchProducts(uri, callback, ...args) {
    const loader = showLoading(productContainer);
    productContainer.removeEventListener("scroll", loadOnScrollBottom);
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
        hideLoading(loader);
        productContainer.addEventListener("scroll", loadOnScrollBottom);
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

productContainer.addEventListener("scroll", loadOnScrollBottom);

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

function addToWishlist(variant_id, vendor, wishlistNames) {
    let wishlists = JSON.parse(localStorage.getItem("Wishlist"));
    const product = {"variant_id": variant_id, "vendor": vendor};

    for (let i in wishlistNames) {
        let wishlist = wishlists.find(element => element["name"] == wishlistNames[i]);

        if(!wishlist["items"].some(product => product.variant_id == variant_id && product.vendor == vendor)) {
            wishlist["items"].push(product);
            localStorage.setItem("Wishlist", JSON.stringify(wishlists));
            showWishlistNotification(true);
        } else {
            showWishlistNotification(false);
        }
    }
    
}

function populateWishlists() {
    const wishlistContent = document.getElementById('wishlist-menu-content');
    wishlistContent.innerHTML = "";

    const wishlists = JSON.parse(localStorage.getItem("Wishlist"));
    
    let initial = true;

    for(let i in wishlists) {
        const wishlistCheckbox = document.createElement('input');
        wishlistCheckbox.type = "checkbox";
        wishlistCheckbox.classList.add("wishlist-checkbox");
        wishlistCheckbox.id = wishlists[i]["name"] + "-checkbox";
        wishlistCheckbox.name = wishlists[i]["name"] + "-checkbox";

        const wishlistLabel = document.createElement('label');
        wishlistLabel.innerText = wishlists[i]["name"];
        wishlistLabel.htmlFor = wishlistCheckbox.id;

        wishlistContent.appendChild(wishlistCheckbox);
        wishlistContent.appendChild(wishlistLabel);
        wishlistContent.appendChild(document.createElement('br'));

        if(initial) {
            wishlistCheckbox.checked = true;
            initial = false;
        }
    }
}

function addNewWishlist(wishlistName) {
    let wishlists = JSON.parse(localStorage.getItem("Wishlist"));

    if(!wishlistName || wishlists.some(element => element["name"] == wishlistName )) return false;

    wishlists.push({"name":wishlistName,"items":[]});
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
        // Match last occurence of "-checkbox" in the checkbox button id
        const regex = /(-checkbox)(?!-checkbox)/;
        let selectedWishlists = [...document.querySelectorAll('input[class="wishlist-checkbox"]:checked')].map(node => node.id.replace(regex, ""));
        
        addToWishlist(variant_id, vendor, selectedWishlists);
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
    wishlistNotification.style.minWidth = "150px";

    if(added) {
        wishlistNotification.style.backgroundColor = "green";
        wishlistNotification.innerHTML = "<p>Added to wishlist<p>"
    } else {
        wishlistNotification.style.backgroundColor = "red";
        wishlistNotification.innerHTML = "<p>Already in wishlist</p>"
    }

    function removeNotification() {
        wishlistNotification.style.width = "0";
        wishlistNotification.style.minWidth = "0";
    }

    setTimeout(removeNotification, 2000);
}