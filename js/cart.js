/** Définis la clé du panier dans le localStorage
 * ATTENTION !!! doit être à jour sur chaque fichier
 */
const localStorageKey = 'kanap-cart';

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

/** Erreur générique affichée suite à une erreur système (un parse ou un fetch KO par exemple...) */
const genericError = 'L\'application a rencontré une erreur et n\'a pas pu effectuer l\'action recquise, nous vous prions de nous excuser pour ce désagrément et nous vous invitons à renouveler l\'opération ultérieurement.';


/**
 * FONCTION A METTRE EN IMPORT
 * Supprime le panier courant en retirant les données du localStorage
 * @return void
 */
 function deleteCart() {

    try {

        localStorage.removeItem(localStorageKey);

    }
    catch(error) {

        console.error('catch error in deleteCart() => '+ error);

    }

    return;

}

/**
 * ----------------------------------------------------------------------------------
 * Fonction permettant de vérifier la présence de caractères spéciaux dans une chaine
 * L'array exclude permet de spécifier des caractères à ignorer
 *
 * @param String string_to_test "La chaine de caractère à tester"
 * @param Array exclude "Array contenant un ou plusieurs caractères à exclure du processus de vérification"
 * @return Bool "TRUE si la chaine à tester contient au moins un caractère spécial, sinon FALSE"
 */
function hasSpecialChar(string_to_test, exclude) {

    let pattern = '!"\'#$€µ£%&()*+,./:;<=>-?§@^¨_`°{|}~ ][\\';

    // Gestion des caractères à exclure du processus de vérification
    let excludeList = exclude ?? [];

    // On parcours le pattern en recherchant chaque caractère dans la chaine à tester
    let hasMatch = false;
    pattern.split('').forEach(char => {

        if(!excludeList.includes(char) && string_to_test.includes(char)) {

            hasMatch = true;

        }

    });

    return hasMatch;

}

/**
 * Procède à la validation du panier
 * Si les champs sont validés et que la commande est bien traitée par l'API, l'utilisateur est redirigé
 * @return void
 */
async function orderSubmit() {

    // Initialise l'objet "contact"
    let contactObject = {};

    // Vérification des champs du formulaire de contact
    /**
     * Les caractères spéciaux sont vérifiés via la fonction "hasSpecialChar"
     */
    const errorMessage = {
        firstName: 'Le champ Prénom ne doit pas être vide et ne doit pas contenir de chiffre ni de caractère spécial.',
        lastName: 'Le champ Nom ne doit pas être vide et ne doit pas contenir de chiffre ni de caractère spécial.',
        address: 'Le champ Adresse ne doit pas être vide et ne doit pas contenir de caractère spécial.',
        city: 'Le champ Ville ne doit pas être vide et ne doit pas contenir de chiffre ni de caractère spécial.',
        email: 'Merci de renseigner une adresse Email valide.'
    }

    let hasError = false;
    document.querySelectorAll('form.cart__order__form input').forEach(field => {

        // Reset le contenu du <p> du message d'erreur avant vérification
        let fieldErrorMsgNode = document.getElementById(field.name +'ErrorMsg') ?? {};
        fieldErrorMsgNode.textContent = '';

        switch(field.name) {

            case 'firstName' :
            case 'lastName' :
            case 'city' :
                // On autorise uniquement les lettres de l'alphabet, les apostrophes, les espaces et les tirets
                if(field.value.length === 0 || (field.value.match('[0-9]') ?? []).length > 0 || hasSpecialChar(field.value, ['\'','-',' '])) {

                    fieldErrorMsgNode.textContent = errorMessage[field.name];
                    hasError = true;

                }
                else {

                    contactObject[field.name] = field.value;

                }
                break;

            case 'address' :
                // On vérifie si la chaine contient des caractères spéciaux en excluant les apostrophes, les espaces et les tirets
                if(field.value.length === 0 || hasSpecialChar(field.value, ['\'','-',' ','°'])) {

                    fieldErrorMsgNode.textContent = errorMessage[field.name];
                    hasError = true;

                }
                else {

                    contactObject['address'] = field.value;

                }
                break;

            case 'email' :
                // On vérifie si le caractères "@" se trouve 1 fois dans la chaine, on vérifie également les caractères spéciaux en excluant les tirets, les underscores et les points
                if(field.value.length === 0 || (field.value.split('@') ?? []).length !== 2 || hasSpecialChar(field.value, ['@','-','_','.'])) {

                    fieldErrorMsgNode.textContent = errorMessage[field.name];
                    hasError = true;

                }
                else {

                    contactObject['email'] = field.value;

                }
                break;

            default :
                // Ne rien faire
                break;

        }

    });

    // Vérifie si le panier contient des élements
    try {

        cartProductsList = Object.keys(selectCart());

    }
    catch(error) {

        alert(error);
        return;

    }

    if(cartProductsList.length === 0) {

        alert('Merci de sélectionner au moins un produit à commander.');
        hasError = true;

    }

    if(hasError === true) return;

    // La commande est envoyée à l'API pour validation
    fetch('http://localhost:3000/api/products/order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contact: contactObject,
                products: cartProductsList
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
    let color = productArticle.getAttribute('data-color');

    // *** Vérifie la validité de la quantité renseignée ***
    // * si la valeur est une chaine vide, on attend 2 secondes pour que l'utilisateur puisse remettre une valeur
    // * si la valeur est incorrecte (caractère non numérique, ou valeur inférieure à égale à 0, ou supérieure à 100), on remet en place la valeur précédente
    let quantity = parseInt(event.target.value);

    if(typeof(quantityTimeout) === 'number') clearTimeout(quantityTimeout); // Reset le timeout potentiellement lancé par l'étage ci-dessous
    if(event.data === null) { // valeur vide

        console.warn('Valeur vide');
        quantityTimeout = setTimeout(() => {

            alert('Merci de renseigner une quantité comprise entre 1 et 100.');
            event.target.value = products[productId]['quantity'][color];

        }, 2000);

        return;
    }

    if(isNaN(quantity) || quantity <= 0 || quantity > 100) { // La valeur du champ est une chaine de caractère || inférieure ou égale à 0 || supérieure à 100

        alert('Merci de renseigner une quantité comprise entre 1 et 100.');
        event.target.value = products[productId]['quantity'][color];
        return;

    }

    // La quantité renseignée est valide, on met à jour l'objet "products"
    products[productId]['quantity'][color] = quantity;

    // On met les données dans le localStorage
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

    // On met à jour le HTML du panier
    setCartProductNode(products[productId], color);

    // On met à jour le prix total
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
    productColorNode.textContent = color.substring(0, 1).toUpperCase() + color.substring(1, color.length);

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
    productQuantityInputNode.min = 1;
    productQuantityInputNode.max = 100;
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
    productDeleteNode.addEventListener('click', (event) => {

        // TODO:Développer la fonction permettant de retirer le panier du produit
        alert('TODO:Développer la fonction permettant de retirer le produit du panier');

    });

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
    productNode.dataset.color = color;
    productNode.appendChild(productImgParentNode);
    productNode.appendChild(productContentNode);

    let currentNode = document.querySelector('article[data-id="'+ product._id +'"][data-color="'+ color +'"]');
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
 * @return Promise "resolved => On retourne un objet contenant la liste des produits OU un tableau vide en cas d'échec si le panier est vide"
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

                alert('Votre panier est vide, merci de placer un ou plusieurs canapé(s) dans votre panier afin de passer votre commande.');
                document.location.href = './index.html';
                return;

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