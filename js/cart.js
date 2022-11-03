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


    /**
     * Insertion des produits dans la <section> #cart__items
     */
    let cartSection = document.getElementById('cart__items');
    products.forEach(product => {

        if(cartContent.hasOwnProperty(product._id)) { // le produit se trouve dans le panier

            console.log(cartContent[product._id], product);

            // TODO : Ne fonctionne pas "TypeError: cartContent[product._id].forEach is not a function"
            cartContent[product._id].forEach(row => {

                console.log(row);

                /*
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

                / ... /

                // Insertion dans la section
                cartSection.appendChild(productNode);
                */
            })
        }

    });
    console.log(cartContent, products);

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