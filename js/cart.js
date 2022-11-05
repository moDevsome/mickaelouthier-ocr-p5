/**
 * Récupère les élements du panier dans le localStorage et les insère dans le DOM
 * @retun void
 */
function insertItems(products) {

    const localStorageKey = 'kanap-cart';
    let cartJSONString = '';
    let cartContent= {};

    // On récupère la panier depuis le localStorage
    try {

        cartJSONString = localStorage.getItem(localStorageKey);

    }
    catch(error) {

        console.error(error);
        alert('L\'application a rencontré une erreur et n\'a pas pu mettre votre panier à jour, nous vous prions de nous excuser pour ce désagrément et nous vous invitons à réessayer l\'opération ultérieurement.');
        return;

    }

    // On parse le JSON
    try {

        cartContent = JSON.parse(cartJSONString);

    }
    catch(error) {

        console.error(error);
        alert('L\'application a rencontré une erreur et n\'a pas pu mettre votre panier à jour, nous vous prions de nous excuser pour ce désagrément et nous vous invitons à réessayer l\'opération ultérieurement.');
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

                    console.log(product.name, product.price);

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

                        // TODO:Développer la fonction permettant de mettre à jour la quantité
                        alert('TODO:Développer la fonction permettant de mettre à jour la quantité');

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

}

load();