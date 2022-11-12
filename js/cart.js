/** Définis la clé du panier dans le localStorage
 * ATTENTION !!! doit être à jour sur chaque fichier
 */
const localStorageKey = 'kanap-cart';

/**
 * FONCTION A METTRE EN IMPORT
 * Retourne un objet Panier dans lequel se trouve les élements à commanders
 * @return Objet
 */
function selectCart() {

    const genericError = 'L\'application a rencontré une erreur et n\'a pas pu récupérer le contenu de votre panier, nous vous prions de nous excuser pour ce désagrément et nous vous invitons à renouveler l\'opération ultérieurement.';
    let cartJSONString = '';
    let cartContent= {};

    // On récupère la panier depuis le localStorage, si l'élement n'existe pas la variable cartJSONString sera une chaine JSON vide
    try {

        cartJSONString = localStorage.getItem(localStorageKey) ?? '{}';

    }
    catch(error) {

        console.error('catch error in selectCart')
        console.error(error);
        throw genericError;

    }

    // On parse le JSON
    try {

        cartContent = JSON.parse(cartJSONString);

    }
    catch(error) {

        console.error('catch error in selectCart')
        console.error(error);
        throw genericError;

    }

    return cartContent;

}

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
 * ---------------------------------------------------------------------------------------------------------------------
 * Fonction permettant de mettre à jour la quantité d'un produit dans le panier, en prenant en compte l'option "couleur"
 *
 * @param String productId "L'ID du produit dans le panier"
 * @param String productColor "La valeur de l'option couleur"
 * @param Number productQantity "La nouvelle quantité"
 * @return void
 */
function updateProductQuantity(productId, productColor, productQantity) {

    // TODO:Développer la fonction permettant de mettre à jour la quantité
    console.log(lsKey, productId, productColor, productQantity);
    return;

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
 * Récupère les élements du panier dans le localStorage et les insère dans le DOM
 * @retun void
 */
function insertItems(products) {

    // Récupère le contenu du panier
    cartContent = {};
    try {

        cartContent = selectCart();

    }
    catch(error) {

        alert(error);
        return;

    }

    // Initialisation de la quantité total et du prix total avant la boucle
    let totalQuantity = 0;
    let totalPrice = 0;

    /**
     * Insertion des produits dans la <section> #cart__items
     */
    let cartSection = document.getElementById('cart__items');
    products.forEach(product => {

        if(cartContent.hasOwnProperty(product._id)) { // le produit se trouve dans le panier

            product.colors.forEach(color => {

                let colorIndex = color.toLowerCase();

                if(cartContent[product._id].hasOwnProperty(colorIndex)) {

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
                    productColorNode.textContent = color;

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
                    productQuantityNode.textContent = 'Qté : '+ cartContent[product._id][colorIndex];

                    // Gestion de l'input permettant de mettre à jour la quantité du produit <input> .itemQuantity
                    let productQuantityInputNode = document.createElement('input');
                    productQuantityInputNode.type = 'number';
                    productQuantityInputNode.name = 'itemQuantity';
                    productQuantityInputNode.min = 1;
                    productQuantityInputNode.max = 100;
                    productQuantityInputNode.value = cartContent[product._id][colorIndex];
                    productQuantityInputNode.classList.add('itemQuantity');
                    productQuantityInputNode.addEventListener('input', (event) => {

                        // *** Vérifie la validité de la quantité renseignée ***
                        // * si la valeur est une chaine vide, on attend 2 secondes pour que l'utilisateur puisse remettre une valeur
                        // * si la valeur est incorrecte (caractère non numérique, ou valeur inférieure à égale à 0, ou supérieure à 100), on remet en place la valeur précédente
                        let quantity = parseInt(event.target.value);

                        if(typeof(quantityTimeout) === 'number') clearTimeout(quantityTimeout); // Reset le timeout potentiellement lancé par l'étage ci-dessous
                        if(event.data === null) { // valeur vide

                            console.warn('Valeur vide');
                            quantityTimeout = setTimeout(() => {

                                alert('Merci de renseigner une quantité comprise entre 1 et 100.');
                                event.target.value = cartContent[product._id][colorIndex];

                            }, 2000);

                            return;
                        }

                        if(isNaN(quantity) || quantity <= 0 || quantity > 100) { // La valeur du champ est une chaine de caractère || inférieure ou égale à 0 || supérieure à 100

                            alert('Merci de renseigner une quantité comprise entre 1 et 100.');
                            event.target.value = cartContent[product._id][colorIndex];
                            return;

                        }

                        // La quantité renseignée est valide, on met à jour le tableau "cartContent" ainsi que le panier dans le localStorage
                        cartContent[product._id][colorIndex] = quantity;
                        let productArticle = event.target.closest('article.cart__item'); // Récupère les données du produit en retrouvant le bloc "<article>" parent via la fonction "closest()"
                        updateProductQuantity(productArticle.getAttribute('data-id'), productArticle.getAttribute('data-color').toLowerCase(), quantity);
                        return;

                    });

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

                    cartSection.appendChild(productNode);

                    // Mise à jour de la quantité total et du prix total
                    totalQuantity += cartContent[product._id][colorIndex];
                    totalPrice += cartContent[product._id][colorIndex] * product.price;

                }

            })

        }

    });

    // Gestion de la quantité total et du prix total
    document.getElementById('totalQuantity').textContent = totalQuantity;
    document.getElementById('totalPrice').textContent = totalPrice;

}

/**
 * Récupère la liste des produits
 * @return Array Un tableau contenant la liste des produits OU un tableau vide en cas d'échec
 */
 async function getProducts() {

    /**
     * Récupération des produits via la méthode "fetch"
     * La liste des produits est retounée par le 2eme "then" (promesse de parse du JSON résolue)
     */
    return await fetch('http://localhost:3000/api/products')
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

                throw 'La condition "response.status === 200 && response.ok === true" vaut FALSE.';

            }

        })
        .then((data) => { // Réception des données contenues dans le JSON présent dans le corps de la réponse de l'API

            if(typeof(data) !== 'object') {

                throw 'La condition "typeof(data) !== \'object\'" vaut FALSE.';

            }

            if(data.length === 0) {

                throw 'Le tableau "data" ne contient aucune donnée.';

            }
            else {

                return data;

            }

        })
        .catch((e) => {

            let errorMessage = '--- Echec de la récupération des produits. ---';
            console.error(errorMessage.concat("\n", e));

            return [];

        });

}

/**
 * Récupère la liste des produits et les insère dans le DOM
 * @retun void
 */
async function load() {

    let products = await getProducts();
    insertItems(products);


    document.getElementById('order').addEventListener('click', (event) => {

        event.preventDefault();
        event.stopPropagation();

        orderSubmit();

        return false;
    });

}

load();