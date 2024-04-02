export const base = "https://ygopricecheck.nz/";

const productContainer = document.getElementById("product-container");

export function init() {
    getVendors();

    document.getElementById('open-options-menu').addEventListener('click', openOptionsMenu);
    document.getElementById('close-options-menu').addEventListener('click', closeOptionsMenu);
    document.getElementById('vendor-form').addEventListener('change', updateVendors);

    if (!localStorage.getItem("Wishlist")) {
        localStorage.setItem("Wishlist", JSON.stringify(
            [{"name":"wishlist","items":[]}]
        ));
    }
}

export function setCookie(name, value) {
    let cookieStr = name + "=" + value;
    document.cookie = cookieStr;
}

export function getCookie(name) {
    if (document.cookie.indexOf(name) == -1) return false;

    let key = name + "=";
    let cookieValue = document.cookie.split(';').filter(e => e.includes(key))[0].replace(key, '').trim();

    return cookieValue;
}

function openOptionsMenu() {
    const optionsMenu = document.getElementById('options-menu');
    optionsMenu.style.borderLeft = "1px solid #353535";
    
    if (window.innerWidth > 768) {
        optionsMenu.style.width = "30%";
    } else {
        optionsMenu.style.width = "100%";
    }
    
    return false;
}

function closeOptionsMenu() {
    const optionsMenu = document.getElementById('options-menu');
    optionsMenu.style.width = "0%";
    optionsMenu.style.borderLeft = "none";
    return false;
}

function getVendors() {
    fetch(base + 'vendors.json')
    .then((response) => response.json())
    .then((json) => loadVendors(json));
}

function loadVendors(json) {
    localStorage.setItem("Vendors", JSON.stringify(json));
    populateVendors();
}

function populateVendors() {
    let vendorForm = document.getElementById("vendor-form");
    let i = 1

    for (let vendor in JSON.parse(localStorage.getItem("Vendors"))) {
        let htmlStr = `<input type="checkbox" class="vendor" id="vendor${i}" name="vendor${i}" value="${vendor}">
        <label for="vendor${i}">${vendor}</label><br>`;
        vendorForm.innerHTML += htmlStr;
        i++;
    }

    setVendors();
}

function setVendors() {
    let vendorStr = getCookie("Vendors");

    if (!vendorStr) {
        let cookieStr = "";

        for (let vendor in JSON.parse(localStorage.getItem("Vendors"))) {
            cookieStr += vendor + '|';
        }

        setCookie("Vendors", cookieStr);

        let vendorCheckboxes = document.querySelectorAll("input")
        vendorCheckboxes.forEach((checkbox) => checkbox.checked = true);

    } else {
        
        let vendors = vendorStr.split('|').filter(Boolean);

        vendors.forEach((vendor) => {
            let checkbox = document.querySelector('input[value="'+ vendor +'"]');

            // Set checkbox to checked if not null
            // If null, remove from vendorStr as vendor no longer exists
            if(checkbox != null) {
                checkbox.checked = true
            } else {
                setCookie("Vendors", vendorStr.replace(vendor+'|', ''));
            }

        });
    }
}

function updateVendors() {
    let cookieStr = "";

    let selectedVendors = document.querySelectorAll("input:checked")
    selectedVendors.forEach((vendor) => cookieStr += ((vendor.value) + "|"))

    setCookie("Vendors", cookieStr);
}

export function showProducts(products, keep, callback, char, container, wishlist) {
    if(!container) container = productContainer;

    if(!keep) container.innerHTML = "";

    const showProduct = (product) => {
        let img_src = "";
        let vendors = JSON.parse(localStorage.getItem("Vendors"));
        let vendorString = vendors[product.vendor];
        
        if (product.img_src != "none") img_src = product.img_src;
            
        var productBox = document.createElement('div');
        var wishlistButton = document.createElement('img');

        productBox.className = "box";
        wishlistButton.className = "wishlist-button";
        
        wishlistButton.src = "images/" + char + ".svg";
        
        productBox.innerHTML += `
        <a href="${vendorString + 'products/' + product.handle}" target="_blank">
            <div class="product">
                <img class="product-image" src="${img_src}"/>
                <div class="product-text">
                    <div class="product-name">${product.name}</div>
                    <div class="product-description">
                        <b>${product.variant_title}</b> | ${product.vendor}
                        <br>
                        <strong>$ ${parseFloat(product.price).toFixed(2)}</strong>
                    </div>
                </div>
            </div>
        </a>
        `;

        container.appendChild(productBox);
        productBox.appendChild(wishlistButton);

        wishlistButton.addEventListener('click', function(event) {
            callback(product.variant_id, product.vendor.replaceAll("'", "\\'"), wishlist, event);
        });
    }

    products.forEach(showProduct);
}

export function showLoading(container) {
    const loadingContainer = document.createElement('div');
    loadingContainer.id = "loading-container";
    
    const loadingGraphic = document.createElement('img');
    loadingGraphic.id = "loading-wheel";
    loadingGraphic.src = "images/loading.svg";

    loadingContainer.appendChild(loadingGraphic);
    container.appendChild(loadingContainer);

    return loadingContainer;
}

export function hideLoading(loader) {
    loader.remove();
}