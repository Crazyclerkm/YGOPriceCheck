import { debouncedfetchProducts, base, init, setCookie, getCookie, showProducts} from './common.js';

document.getElementById('vendor-form').addEventListener('change', loadWishlist);

init();
loadWishlist();

function loadWishlist()  {
    debouncedfetchProducts(base + 'cardlist', showProducts, false, removeFromWishlist, '-');
}

function removeFromWishlist(variant_id, vendor) {
    let wishlist = getCookie("Wishlist");
    let wishlistStr = String(variant_id) + ':' + vendor + '|';
    
    setCookie("Wishlist", wishlist.replace(wishlistStr, ''));

    loadWishlist()
}