import { debouncedfetchProducts, base, init, setCookie, getCookie, showProducts} from "./common.js";

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
    debouncedfetchProducts(uri, showProducts, true, addToWishlist, '+');
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
    debouncedfetchProducts(uri, showProducts, false, addToWishlist, '+');
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

function addToWishlist(variant_id, vendor) {
    let wishlist = getCookie("Wishlist");
    let wishlistStr = String(variant_id) + ':' + vendor + '|';
    if(!wishlist.includes(wishlistStr)) {
        setCookie("Wishlist", wishlist + wishlistStr);
        showWishlistNotification(true);
    } else {
        showWishlistNotification(false);
    }
}

// TODO: Fix wishlist notification
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