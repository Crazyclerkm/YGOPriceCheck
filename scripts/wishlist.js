import { base, init, showProducts, showLoading, hideLoading} from './common.js';

document.getElementById('vendor-form').addEventListener('change', loadWishlists);

init();
loadWishlists();

function getWishlist(wishlist, callback, ...args) {
    const loading = showLoading(args[3]);

    const fetchPromise = fetch(base + 'search.php', {
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
            hideLoading(loading);
            callback(data, ...args);
        }
    });
}

function loadWishlists()  {
    const wishlists = JSON.parse(localStorage.getItem("Wishlist"));

    const wishlistContent = document.getElementById("wishlist-content");
    wishlistContent.innerHTML = "";

    for(let i in wishlists) {
        const container = document.createElement('div');
        const header = document.createElement('div');
        const products = document.createElement('div');
        
        container.className = "wishlist-container";
        header.className = "wishlist-header";
        products.className = "wishlist-products";

        const title = document.createElement('h2');
        title.textContent = wishlists[i]["name"];

        const minimiseButton = document.createElement('img');
        const deleteButton = document.createElement('img');
        const editButton = document.createElement('img');

        minimiseButton.className = "wishlist-header-button";
        deleteButton.className = "wishlist-header-button";
        editButton.className  = "wishlist-header-button";

        minimiseButton.src = "images/-.svg"
        deleteButton.src = "images/delete.svg";
        editButton.src = "images/edit.svg";

        minimiseButton.style.height = "32px";
        deleteButton.style.height = "32px";
        editButton.style.height = "32px";

        minimiseButton.onclick = function() {
            if(products.style.display == 'none') {
                products.style.display = 'flex';
                minimiseButton.src = 'images/-.svg';
            } else {
                products.style.display = 'none';
                minimiseButton.src = 'images/+.svg';
            }  
        }

        deleteButton.onclick = function() {
            openDeleteConfirmationPopup(container, wishlists[i]["name"]);
        }

        editButton.onclick = function() {
            editTitle(title)
        };

        title.onclick = function() {
            editTitle(title)
        };

        header.appendChild(title);
        header.appendChild(editButton);
        header.appendChild(deleteButton);
        header.appendChild(minimiseButton);

        container.appendChild(header);

        getWishlist(JSON.stringify(wishlists[i]["items"]), showProducts, true, removeFromWishlist, '-', products, wishlists[i]["name"]);
       
        container.append(products);
        wishlistContent.appendChild(container);
    }
}

function editTitle(title) {
    let wishlists = JSON.parse(localStorage.getItem("Wishlist"));
    const initialTitle = title.innerText;
    title.contentEditable = true;
    title.focus();

    title.addEventListener('blur', function eventHandler(){
        title.contentEditable = false;
        let newTitle = title.innerText.trim().replace(/[\r\n\v]+/g, '');
        title.innerText = newTitle;

        if (newTitle !== initialTitle) {
            let wishlist = wishlists.find(element => element["name"] == initialTitle);
            wishlist["name"] = newTitle;
            localStorage.setItem("Wishlist", JSON.stringify(wishlists));
        }
        
        title.removeEventListener('blur', eventHandler);
    });
}

function openDeleteConfirmationPopup(wishlistContainer, wishlistName) {
    const deleteConfirmationPopup = document.getElementById("delete-confirmation");
    const deleteConfirmationPopupHeader = document.getElementById('delete-confirmation-header'); 
    const deleteConfirmationPopupContent = document.getElementById("delete-confirmation-content");
    const deleteConfirmationPopupFooter = document.getElementById('delete-confirmation-footer');

    deleteConfirmationPopupContent.innerText = "Are you sure you want to delete the wishlist \"" + wishlistName + "\"?";

    deleteConfirmationPopup.style.display = "inline";

    deleteConfirmationPopupHeader.style.display = "flex";
    deleteConfirmationPopupHeader.style.justifyContent = "space-between";

    deleteConfirmationPopupFooter.style.display = "flex";
    deleteConfirmationPopupFooter.style.justifyContent = "space-around";

    const deleteWishlistButton = document.getElementById("delete-wishlist");

    function deleteEventHandler() {
        wishlistContainer.remove();
        deleteWishlist(wishlistName);
        closeDeleteConfirmationPopup(deleteEventHandler);
    }

    deleteWishlistButton.addEventListener('click', deleteEventHandler);

    const closePopupButton = document.getElementById("close-delete-confirmation");
    const cancelButton = document.getElementById("cancel-delete-wishlist");

    closePopupButton.addEventListener('click', function eventHandler() {
        closeDeleteConfirmationPopup(deleteEventHandler);
        closePopupButton.removeEventListener('click', eventHandler);
    });

    cancelButton.addEventListener('click', function eventHandler() {
        closeDeleteConfirmationPopup(deleteEventHandler);
        cancelButton.removeEventListener('click', eventHandler);
    });
}

function closeDeleteConfirmationPopup(deleteEventListener) {
    const deleteConfirmationPopup = document.getElementById("delete-confirmation");
    document.getElementById("delete-wishlist").removeEventListener('click', deleteEventListener);
    deleteConfirmationPopup.style.display = "none";
}

function deleteWishlist(wishlistName) {
    let wishlists = JSON.parse(localStorage.getItem("Wishlist"));
    const wishlist = wishlists.find(element => element["name"] == wishlistName);

    wishlists.splice(wishlists.indexOf(wishlist), 1);

    localStorage.setItem("Wishlist", JSON.stringify(wishlists));
}

function removeFromWishlist(variant_id, vendor, wishlistName, event) {
    let wishlists = JSON.parse(localStorage.getItem("Wishlist"));
    let wishlist = wishlists.find(element => element["name"] == wishlistName);
    const wishlistItem = wishlist["items"].find(element => element.variant_id == variant_id && element.vendor == vendor);

    const index = wishlist["items"].indexOf(wishlistItem);
    wishlist["items"].splice(index, 1);

    localStorage.setItem("Wishlist", JSON.stringify(wishlists));
    event.target.parentElement.remove();
}