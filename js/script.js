/**
 * Insère les produits dans le DOM
 * @retun void
 */
function insertProducts(products) {

    if(products.length > 0) {

        /**
         * Insertion des produits dans la <section> #items
         */
        let itemsSection = document.getElementById('items');
        products.forEach(product => {

            // Gestion de l'image du produit <img>
            let productImgNode = document.createElement('img');
            productImgNode.src = product.imageUrl;
            productImgNode.alt = product.altTxt;

            // Gestion du nom du produit <h3>
            let productNameNode = document.createElement('h3');
            productNameNode.textContent = product.name;

            // Gestion de la description du produit <p>
            let productDescriptionNode = document.createElement('p');
            productDescriptionNode.textContent = product.description;

            // Gestion de l'article <article>
            let productArticleNode = document.createElement('article');
            productArticleNode.appendChild(productImgNode);
            productArticleNode.appendChild(productNameNode);
            productArticleNode.appendChild(productDescriptionNode);

            // Gestion du lien <a>
            let productNode = document.createElement('a');
            productNode.href = './product.html?id='+ product._id;
            productNode.appendChild(productArticleNode);

            // Insertion dans la section
            itemsSection.appendChild(productNode);

        });
    }

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
    insertProducts(products);

}

load();