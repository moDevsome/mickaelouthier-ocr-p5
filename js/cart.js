/** Définis la clé du panier dans le localStorage
 * ATTENTION !!! doit être à jour sur chaque fichier
 */
const localStorageKey = 'kanap-cart';

/** Erreur générique affichée suite à une erreur système (un parse ou un fetch KO par exemple...) */
const genericError = 'L\'application a rencontré une erreur et n\'a pas pu effectuer l\'action recquise, nous vous prions de nous excuser pour ce désagrément et nous vous invitons à renouveler l\'opération ultérieurement.';

/** Caractère permettant de faire le "join" sur le tableau "colorData" */
const colorDataJoin = '|';

/** Définis la quantité minimum et la quantité maximum pouvant être commandé */
const minQuantity = 1;
const maxQuantity = 100;

/**
 * ------------------------------------
 * Gestion du cas où le panier est vide
 *
 * @return void
 */
function emptyCartRedirect() {

    alert('Votre panier est vide, merci de placer un ou plusieurs canapé(s) dans votre panier afin de passer votre commande.');
    document.location.href = './index.html';
    return;

}

/**
 * ---------------------------------------------------
 * Récupère les produits présents dans le localStorage
 *
 * @return Objet "L'objet Panier présent dans le localStorage"
 */
function getLocalCart() {


    let cartProducts = localStorage.getItem(localStorageKey) ?? '';
    if(cartProducts.length === 0) return {};

    // Parse l'objet panier
    try {

        cartProducts = JSON.parse(cartProducts);

    }
    catch(error) {

        throw error;

    }

    return cartProducts;
}

/**
 * ------------------------------------------------------------------
 * Supprime le panier courant en retirant les données du localStorage
 *
 * @return void
 */
 function deleteCart() {

    try {

        localStorage.removeItem(localStorageKey);

    }
    catch(error) {

        console.error('catch error in deleteCart\n'+ error);
        alert(genericError);

    }

    return;

}

/**
 * ---------------------------------
 * Procède à la validation du panier
 * Si les champs sont validés et que la commande est bien traitée par l'API, l'utilisateur est redirigé vers la page de confirmation.
 *
 * @return void
 */
async function orderSubmit() {

    // Initialise l'objet "contact"
    let contactObject = {};

    // Vérification des champs du formulaire de contact
    const errorMessage = {
        firstName: 'Le champ Prénom ne doit pas être vide et ne doit pas contenir de chiffre ni de caractère spécial.',
        lastName: 'Le champ Nom ne doit pas être vide et ne doit pas contenir de chiffre ni de caractère spécial.',
        address: 'Le champ Adresse ne doit pas être vide et ne doit pas contenir de caractère spécial.',
        city: 'Le champ Ville ne doit pas être vide et ne doit pas contenir de chiffre ni de caractère spécial.',
        email: 'Merci de renseigner une adresse Email valide.'
    }

    let hasError = false;
    document.querySelectorAll('form.cart__order__form > div.cart__order__form__question > input').forEach(field => {

        // Reset le contenu du <p> du message d'erreur avant vérification
        let fieldErrorMsgNode = document.getElementById(field.name +'ErrorMsg') ?? {};
        fieldErrorMsgNode.textContent = '';

        if(field.name === 'email') {

            /*
            => On autorise uniquement les lettres de l'alphabet, les chiffres, les tirets, les underscores, les points et les arobase
                le caractère "@" doit être présent qu'une seul fois
                le caractère "." doit être présent au moins une fois
            */

            let regxpEmail = new RegExp('([a-zA-Z]|[0-9]|[à-ü]|[À-Ü]|[-]|[_]|[.]|[@])','g');
            if(field.value.length === 0
                || (field.value.match(regxpEmail).length !== field.value.length)
                || (field.value.match(new RegExp('[@]', 'g')) ?? []).length !== 1
                || (field.value.match(new RegExp('[.]', 'g')) ?? []).length < 1) {

                fieldErrorMsgNode.textContent = errorMessage[field.name];
                hasError = true;

            }
            else {

                contactObject['email'] = field.value;

            }

        }
        else {

            /*
            case 'firstName'
            case 'lastName'
            case 'city'
            case 'address'
            => On autorise uniquement les lettres de l'alphabet, les apostrophes, les espaces et les tirets
            => on autorise également les chiffres si il s'agit du champ "Adresse"
            */

            let regxp = new RegExp(field.name === 'address' ? '([a-zA-Z]|[ ]|[0-9]|[à-ü]|[À-Ü]|[-]|[\'])' : '([a-zA-Z]|[ ]|[à-ü]|[À-Ü]|[-]|[\'])','g');
            if(field.value.length === 0 || (field.value.match(regxp).length !== field.value.length)) {

                fieldErrorMsgNode.textContent = errorMessage[field.name];
                hasError = true;

            }
            else {

                contactObject[field.name] = field.value;

            }

        }

        console.log(field.name, hasError);

    });

    // Vérification des champs "Qté" (dans le cas où l'utilisateur clique sur le bouton "Commander" dans les 2 secondes après avoir vidé un champ)
    document.querySelectorAll('input.itemQuantity').forEach(input => {

        if(input.value.length === 0) hasError = true;

    });

    if(hasError === true) return;

    // Créer l'Array products
    let productsArray = Object.keys(products);
    if(productsArray.length === 0) { // le panier est vide

        emptyCartRedirect();
        return;

    }

    // La commande est envoyée à l'API pour validation
    fetch('http://localhost:3000/api/products/order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contact: contactObject,
                products: productsArray
            })
        })
        .then((response) => {

            /**
             * Vérification du Code de réponse HTTP retourné par l'API (201 si OK), ainsi que du statut
             * La nullabilité est gérée dans la condition
             * On utilise une comparaison stricte pour pallier un éventuel problème de type
             */
            if((response.status ?? 500) === 201 && (response.ok ?? false) === true) {

                return response.json();

            }
            else {

                throw 'La condition "response.status === 201 && response.ok === true" vaut FALSE.';

            }

        })
        .then((data) => {

            if(!data.hasOwnProperty('orderId') || typeof(data['orderId']) !== 'string' || data['orderId'].length === 0) {

                console.error('La condition "!data.hasOwnProperty(orderId) || typeof(data[orderId]) !== string || data[orderId].length === 0" retourne FALSE');
                alert('L\'application a rencontré une erreur et n\'a pas pu valider le contenu de votre panier, nous vous prions de nous excuser pour ce désagrément et nous vous invitons à renouveler l\'opération ultérieurement.');
                return;

            }

            // On supprime le contenu du panier validé
            deleteCart();

            // On termine par la redirection de l'utilisateur vers la page de confirmation "confirmation.html"
            document.location.href = './confirmation.html?orderId='+ data['orderId'];
            return;

        })
        .catch((error) => {

            console.error('orderSubmit fetch error => '+ error);
            alert('L\'application a rencontré une erreur et n\'a pas pu valider le contenu de votre panier, nous vous prions de nous excuser pour ce désagrément et nous vous invitons à renouveler l\'opération ultérieurement.');
            return;

        });

}


/**
 * -------------------------------------------------------------------------------------------
 * Mise à jour de la quantité total et du prix total à partir du contenu de l'objet "products"
 *
 * @return void
 */
 function updateTotalPrice() {

    let totalQuantity = 0;
    let totalPrice = 0;
    Object.values(products).forEach(product => {

        Object.values(product['quantity']).forEach(quantity => {

            totalQuantity += quantity;
            totalPrice += quantity * product['infos']['price'];

        });

    });

    document.getElementById('totalQuantity').textContent = totalQuantity;
    document.getElementById('totalPrice').textContent = totalPrice;
    return;

}

/**
 * ---------------------------------------------------
 * Fonction permettant de retirer un produit du panier
 *
 * @param Event event "Évenement déclenché suite au click sur le bouton SUPPRIMER (p.deleteItem)"
 * @return void
 */
 function deleteCartProduct(event) {

    // Récupère les données du produit en retrouvant le bloc "<article>" parent via la fonction "closest()"
    let productArticle = event.target.closest('article.cart__item');
    let productId = productArticle.getAttribute('data-id');
    let colorDataString = productArticle.getAttribute('data-color');
    let colorData = colorDataString.split(colorDataJoin);
    let color = colorData[0];

    // ** Petit bonus par rapport à la spec, on demande une confirmation **
    let confirmMessage = 'Confirmez-vous le retrait du canapé "'+ products[productId]['infos'].name +'" de couleur "'+ colorData[1] +'" ?';
    if(confirm(confirmMessage) === false) {

        return;

    }

    // ** Retire l'objet du panier**
    // - si le produit n'est présent que dans une seule couleur, on le retire complètement (variable totalRemove = TRUE)
    // - si le produit est présent dans plusieurs couleurs, on retire uniquement la couleur en question
    let totalRemove = Object.keys(products[productId]['quantity']).length === 1; // totalRemove = true si une seule couleur

    // Retire le produit de l'objet "products"
    // https://www.w3schools.com/howto/howto_js_remove_property_object.asp
    if(totalRemove === true) {

        delete products[productId];

    }
    else {

        delete products[productId]['quantity'][color];

    }

    // Mise à jour du panier dans le localStorage
    let currentCartProducts = getLocalCart();
    if(totalRemove === true) {

        delete currentCartProducts[productId];

    }
    else {

        delete currentCartProducts[productId][color];

    }

    try {

        // Si le panier ne contient plus de produit, alors on supprime complètement le record du site
        if(Object.keys(currentCartProducts).length > 0) {

            localStorage.setItem(localStorageKey, JSON.stringify(currentCartProducts));

        }
        else {

            localStorage.removeItem(localStorageKey);
            emptyCartRedirect();

        }

    }
    catch(error) {

        console.error(error);
        alert(genericError);
        return;

    }

    // Mise à jour du panier HTML
    document.getElementById('cart__items').removeChild( document.querySelector('article[data-id="'+ productId +'"][data-color="'+ colorDataString +'"]') );

    // Mise à jour du prix et de la quantité total
    updateTotalPrice();

    return;

 }

/**
 * ----------------------------------------------------------------------------
 * Fonction permettant de mettre à jour la quantité d'un produit dans le panier
 *
 * @param Event event "Évenement déclenché suite à la mise à jour du champ Quantité"
 * @return void
 */
function updateCartProductQuantity(event) {

    // Récupère les données du produit en retrouvant le bloc "<article>" parent via la fonction "closest()"
    let productArticle = event.target.closest('article.cart__item');
    let productId = productArticle.getAttribute('data-id');
    let color = productArticle.getAttribute('data-color').split(colorDataJoin)[0];

    // *** Vérifie la validité de la quantité renseignée ***
    // * si la valeur est une chaine vide, on attend 2 secondes pour que l'utilisateur puisse remettre une valeur
    // * si la valeur est incorrecte (caractère non numérique, ou valeur inférieure à égale à 0, ou supérieure à 100), on remet en place la valeur précédente
    let quantity = parseInt(event.target.value);
    let quantityError = 'Merci de renseigner une quantité comprise entre '+ minQuantity +' et '+ maxQuantity +'.';

    if(typeof(quantityTimeout) === 'number') clearTimeout(quantityTimeout); // Reset le timeout potentiellement lancé par l'étage ci-dessous
    if(event.data === null && event.target.value.length === 0) { // Le contenu du champ est vide, cela peut intervenir dans le cas d'une supression du contenu du champ.

        console.warn('Valeur vide');
        quantityTimeout = setTimeout(() => {

            alert(quantityError);
            event.target.value = products[productId]['quantity'][color];

        }, 2000);

        return;
    }

    if(isNaN(quantity) || quantity < minQuantity || quantity > maxQuantity) { // La valeur du champ est une chaine de caractère || inférieure ou égale à 0 || supérieure à 100

        alert(quantityError);
        event.target.value = products[productId]['quantity'][color];
        return;

    }

    // La quantité renseignée est valide, on met à jour l'objet "products"
    products[productId]['quantity'][color] = quantity;

    // Mise à jour du panier dans le localStorage
    let currentCartProducts = getLocalCart();
    currentCartProducts[productId][color] = quantity;
    try {

        localStorage.setItem(localStorageKey, JSON.stringify(currentCartProducts));

    }
    catch(error) {

        console.error(error);
        alert(genericError);
        return;

    }

    // Mise à jour du panier HTML
    try { // securisation suite à l'ajout du script de gestion de la couleur dans "setCartProductNode"

        setCartProductNode(products[productId], color);

    }
    catch(error) {

        console.error(error);
        alert(genericError);
        return;

    }

    // Mise à jour du prix et de la quantité total
    updateTotalPrice();

    return;

}

/**
 * ------------------------------------------------------------
 * Insère ou Met à jour le produit dans la section <section id="cart__items">
 *
 * @param Object productData "L'objet du produit"
 * @param String color "La couleur du produit"
 * @return void
*/
function setCartProductNode(productData, color) {

    let product = productData['infos'];
    let cartSection = document.getElementById('cart__items');

    // Gestion de la couleur
    // On stock la valeur sélectionnée et la valeur textuelle dans un tableau que l'on join avec le caractère"|"
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
    let colorTextFindPredicat = (colorText) => {

        return color === colorText.toLowerCase();

    };
    let colorData = [ color, product.colors.find( colorTextFindPredicat ) ?? ''];
    if(colorData[1].length === 0) { // La couleur n'a pas été trouvée dans l'Array

        throw 'Corresponsdance inexistante dans le tableau "colors" pour la valeur "'+ color +'"';

    }
    let colorDataString = colorData.join('|');

    // Gestion de l'image du produit <img> dans une <div> .cart__item__img
    let productImgNode = document.createElement('img');
    productImgNode.src = product.imageUrl;
    productImgNode.alt = product.altTxt;
    let productImgParentNode = document.createElement('div');
    productImgParentNode.classList.add('cart__item__img');
    productImgParentNode.appendChild(productImgNode);

    // Gestion du nom du produit <h2>
    let productNameNode = document.createElement('h2');
    productNameNode.textContent = product.name;

    // Gestion de la couleur du produit <p>
    let productColorNode = document.createElement('p');
    productColorNode.textContent = colorData[1];

    // Gestion du prix <p>
    let productPriceNode = document.createElement('p');
    productPriceNode.textContent = product.price + ' €';

    // Gestion de la description produit (englobe le nom, la couleur et le prix) <div>  .cart__item__content__description"
    let productDescriptionNode = document.createElement('div');
    productDescriptionNode.classList.add('cart__item__content__description');
    productDescriptionNode.appendChild(productNameNode);
    productDescriptionNode.appendChild(productColorNode);
    productDescriptionNode.appendChild(productPriceNode);

    // Gestion de la quantité <p>
    let productQuantityNode = document.createElement('p');
    productQuantityNode.textContent = 'Qté : '+ productData['quantity'][color];

    // Gestion de l'input permettant de mettre à jour la quantité du produit <input> .itemQuantity
    let productQuantityInputNode = document.createElement('input');
    productQuantityInputNode.type = 'number';
    productQuantityInputNode.name = 'itemQuantity';
    productQuantityInputNode.min = minQuantity;
    productQuantityInputNode.max = maxQuantity;
    productQuantityInputNode.value = productData['quantity'][color];
    productQuantityInputNode.classList.add('itemQuantity');
    productQuantityInputNode.addEventListener('input', event => updateCartProductQuantity(event));

    // Gestion de la l'élement parent englobant la quantité et l'input permettant de la changer <div> .cart__item__content__settings__quantity
    let productQuantityParentNode = document.createElement('div');
    productQuantityParentNode.classList.add('cart__item__content__settings__quantity');
    productQuantityParentNode.appendChild(productQuantityNode);
    productQuantityParentNode.appendChild(productQuantityInputNode);

    // Gestion du bouton Supprimmer <p> .cart__item__content__settings__delete
    let productDeleteNode = document.createElement('p');
    productDeleteNode.classList.add('deleteItem');
    productDeleteNode.textContent = 'Supprimer';
    productDeleteNode.addEventListener('click', event => deleteCartProduct(event));

    // Gestion du parent du bouton Supprimmer <div> .cart__item__content__settings__delete
    let productDeleteParentNode = document.createElement('div');
    productDeleteParentNode.classList.add('cart__item__content__settings__delete');
    productDeleteParentNode.appendChild(productDeleteNode);

    // Gestion de la div englobant la quantité et le bouton supprimer <div> .cart__item__content__settings
    let productSettingsNode = document.createElement('div');
    productSettingsNode.classList.add('cart__item__content__settings');
    productSettingsNode.appendChild(productQuantityParentNode);
    productSettingsNode.appendChild(productDeleteParentNode);

    // Gestion de la div englobant la description et la quantité <div> .cart__item__content <div> .cart__item__content
    let productContentNode = document.createElement('div');
    productContentNode.classList.add('cart__item__content');
    productContentNode.appendChild(productDescriptionNode);
    productContentNode.appendChild(productSettingsNode);

    // Insertion dans la section
    let productNode = document.createElement('article');
    productNode.classList.add('cart__item');
    productNode.dataset.id = product._id;
    productNode.dataset.color = colorDataString;
    productNode.appendChild(productImgParentNode);
    productNode.appendChild(productContentNode);

    let currentNode = document.querySelector('article[data-id="'+ product._id +'"][data-color="'+ colorDataString +'"]');
    if(currentNode === null) { // Insertion d'un nouveau node

        cartSection.appendChild(productNode);

    }
    else {

        // Remplacement du Node existant par un nouveau node
        // https://developer.mozilla.org/en-US/docs/Web/API/Node/replaceChild
        cartSection.replaceChild(productNode, currentNode);

    }

    return;

}

/**
 * ----------------------------------------------
 * Charge les produits se trouvant dans le panier
 * * Récupération des données via un fetch sur l'API
 * * Insertion dans le panier via la fonction setCartProductNode()
 *
 * Structure de chaque objet Produit présent dans la liste
 * [PRODUCT_ID] Objet
 * -- quantity Objet
 * -- -- [COLOR]:[QUANTITY] Number
 * -- infos Objet
 * -- -- _id: [Product id] String
 * -- -- name:[Product name] String
 * -- -- price:[Product price] Number
 * -- -- imageUrl:[Product image] String
 * -- -- description:[Product description] String
 * -- -- altTxt:[Product image alt text] String
 * -- -- -- colors: Array
 * -- -- -- -- [color]
 *
 * @return Promise "resolved => On retourne un objet contenant la liste des produits OU un tableau vide si le panier est vide"
 */
 async function loadCartProducts() {

    return new Promise((resolve, reject) => {

        let products = {};
        let cartProducts = {}; //Objet panier dans le localStorage

        // Récupère le contenu du panier
        try {

            cartProducts = getLocalCart();

        }
        catch(error) {

            reject(error);

        }

        // Vérifie si le contenu du panier est vide, si c'est le cas on renvoit un objet vide
        if(Object.keys(cartProducts).length === 0) resolve(products);

        // *** Récupère les infos des produits se trouvant dans le panier
        let productIdList = Object.keys(cartProducts);
        let fetchCounter = 0;
        productIdList.forEach(productId => {

            fetch('http://localhost:3000/api/products/'+ productId)
                .then((response) => {

                    /**
                     * Vérification du Code de réponse HTTP retourné par l'API, ainsi que du statut
                     * La nullabilité est gérée dans la condition
                     * On utilise une comparaison stricte pour pallier un éventuel problème de type
                     */
                    if((response.status ?? 500) === 200 && (response.ok ?? false) === true) {

                        return response.json();

                    }
                    else {

                        reject('Echec de la récupération du produit "'+ productId +'". La condition "response.status === 200 && response.ok === true" vaut FALSE.');

                    }

                })
                .then(data => {

                    fetchCounter++;

                    products[data._id] = {
                        quantity: cartProducts[data._id],
                        infos: data
                    };

                    // On profite de la boucle pour insérer le produit dans le DOM
                    // On aura un Node pour chaque couleur
                    Object.keys(cartProducts[data._id]).forEach(color => setCartProductNode(products[data._id], color));

                    // Tous les produits ont été récupérés, la promesse est tenue
                    if(fetchCounter === productIdList.length) {

                        resolve(products);

                    }

                })
                .catch(error => {

                    reject(error);

                });

        });

    });

}

/**
 * Récupère la liste des produits et les insère dans le DOM
 * @retun void
 */
async function load() {

    loadCartProducts()
        .then(loadedProducts => {

            // Si le panier est vide, on redirige l'utilisateur vers la page d'accueil
            if(Object.keys(loadedProducts).length === 0) {

                emptyCartRedirect();

            }
            else {

                products = loadedProducts;

                // Tous les produits ont été insérés, on met à jour la quantité et le prix total
                updateTotalPrice();

                document.getElementById('order').addEventListener('click', (event) => {

                    event.preventDefault();
                    event.stopPropagation();

                    orderSubmit();

                    return false;
                });

            }

        })
        .catch(error => {

            console.error(error);
            alert(genericError);

        });

    return;
}

// Objet contenant les produits présent dans le panier, chaque object contient un sous-objet "quantity" et un sous-objet "infos"
let products = {};
load();