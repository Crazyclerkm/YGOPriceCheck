// TODO: Add select/deselect all buttons on options menu
// TODO: Ensure infinite scroll works on all screen sizes

export const base = "http://192.168.1.71:5000/";

const productContainer = document.getElementById("product-container");

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

function fetchProducts(uri, callback, keep, func, char) {
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
            callback(data, keep, func, char);
        }
    });
}

export const debouncedfetchProducts = debounce(fetchProducts, 200);

export function init() {
    getVersion();
    getVendors();
    populateVendors();

    document.getElementById('open-options-menu').addEventListener('click', openOptionsMenu);
    document.getElementById('close-options-menu').addEventListener('click', closeOptionsMenu);
    document.getElementById('vendor-form').addEventListener('change', updateVendors);

    if (!getCookie("Vendors")) {
        let vendorStr = "";
        for (let vendor in JSON.parse(localStorage.getItem("Vendors"))) {
            vendorStr += vendor + '|';
        }

        setCookie("Vendors", vendorStr);

        let vendors = document.querySelectorAll("input")
        vendors.forEach((vendor) => vendor.checked = true);
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

function checkVersion(version) {
    if (!getCookie("Version") || getCookie("Version") != version) {
        setCookie("Version", version);
        displayChangelog(version);
    }
}

function getVersion() {
    fetch(base + 'version')
    .then((response) => response.text())
    .then((text) => checkVersion(text));
}

function setChangelog(changelog) {
    const changelogContainer = document.getElementById('changelog-content');
    let htmlString = "<p>" ;
    let lines = changelog.split('-').filter(Boolean);
    for(let l in lines) {
        htmlString += '-' + lines[l]+'<br><br>';
    }
    htmlString += "</p>"
    changelogContainer.innerHTML += htmlString;
    document.getElementById('close-changelog').addEventListener('click', closeChangelog);
}

function displayChangelog(version) {
    const changelog = document.getElementById('changelog');
    changelog.style.display = "inline";

    const changelogTitle = document.getElementById('changelog-title');
    changelogTitle.innerHTML += "(v" + version + ")";
    
    fetch(base + 'changelog')
    .then((response) => response.text())
    .then((text) => setChangelog(text));
}

function closeChangelog() {
    const changelog = document.getElementById('changelog');
    changelog.style.display = "none";
    return false;
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
    fetch(base + 'vendors')
    .then((response) => response.json())
    .then((json) => loadVendors(json));
}

function loadVendors(json) {
    localStorage.setItem("Vendors", JSON.stringify(json));
}

function updateVendors() {
    let vendorStr = ""

    let selectedVendors = document.querySelectorAll("input:checked")
    selectedVendors.forEach((vendor) => vendorStr += ((vendor.value) + "|"))

    setCookie("Vendors", vendorStr);
}

function setVendors() {
    let vendorStr = getCookie("Vendors");

    if (vendorStr) {
        let vendors = vendorStr.split('|').filter(Boolean);

        vendors.forEach((e) => document.querySelector('input[value="'+ e +'"]').checked = true);
    }
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

export function showProducts(products, keep, callback, char) {
    if(!keep) {
        productContainer.innerHTML = "";
    }

    const showProduct = (product) => {
        let img_src = "";
        let vendors = JSON.parse(localStorage.getItem("Vendors"));
        let vendorString = vendors[product.vendor];
        
        if (product.img_src != "none") {
            img_src = product.img_src;
        }
            
        var productBox = document.createElement('div');
        var wishlistButton = document.createElement('div');

        productBox.className = "box";
        wishlistButton.className = "wishlist-button";
        
        wishlistButton.innerText = char;
        
        productBox.innerHTML += `
        <a href="${vendorString + '/products/' + product.handle}" target="_blank">
            <div class="product">
                <img src="${img_src}"/>
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

        productContainer.appendChild(productBox);
        productBox.appendChild(wishlistButton);

        wishlistButton.addEventListener('click', function() {
            callback(product.variant_id, product.vendor.replaceAll("'", "\\'"));
        });
    }
    products.forEach(showProduct);
}