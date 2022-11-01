/**
 * Insère les information détaillée du produit dans le DOM
 * @retun void
 */
 function insertProduct(product) {

    if(typeof(product) === "object") {

        /**
         * Insertion des détails du produit
         */

        // Gestion de l'image du produit <img>
        let productImgNode = document.createElement('img');
        productImgNode.src = product.imageUrl;
        productImgNode.alt = product.altTxt;
        try {

            // Gestion de l'absence d'un ID unique pour l'élement
            document.querySelector('section.item > article > div.item__img').appendChild(productImgNode);

        }
        catch(error) {

            console.error(error);

        }

        // Gestion du nom du produit <h1> #title
        document.getElementById('title').textContent = product.name;

        // Gestion du prix <span> #price
        document.getElementById('price').textContent = product.price;

        // Gestion de la description du produit <p> #description
        document.getElementById('description').textContent = product.description;

        // Gestion de l'option couleur <select> #colors
        // Chaque option est ajoutée en tant que noeud HTML
        let colorsSelect = document.getElementById('colors');
        product.colors.forEach(color => {

            let option = document.createElement('option');
            option.value = color.toLowerCase();
            option.text = color;
            colorsSelect.options.add(option);

        });

    }

}

/**
 * Récupère les informations détaillées du produit à partir de la valeur du paramètre ID présent dans l'URL
 * @return Object Un objet contenant les informations OU FALSE si une erreur survient
 */
async function getProduct() {

    const errorTitle = '--- Echec de la récupération des informations du produit via la fonction getProduct() ---\n';

    let urlSearchParams = new URLSearchParams(document.location.search);
    if(!urlSearchParams.has('id')) {

        console.error(errorTitle +'"urlSearchParams.has(\'id\')" retourne FALSE. Le paramètre ID est absent de l\'URL du document.');
        return false;

    }

    /**
     * Récupération des informations du produit via la méthode "fetch"
     * Les informations du produit sont retounées par le 2eme "then" (promesse de parse du JSON résolue)
     */
    return await fetch('http://localhost:3000/api/products/'+ urlSearchParams.get('id'))
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

            // Vérification des propriétés de l'objet
            const expectedPropeties = { //Objet contenant la liste des propriétés attendues sous la forme : clé => nom de la propriété, valeur => type de la propriété
                _id: 'string',
                colors: 'object',
                name: 'string',
                price: 'number',
                imageUrl: 'string',
                description: 'string',
                altTxt: 'string'
            }
            const dataObjectProperties = Object.getOwnPropertyNames(data);
            let badProperties = [];

            for(prop of Object.getOwnPropertyNames(expectedPropeties)) {

                if(!dataObjectProperties.includes(prop)) {

                    badProperties.push('La propriété "'+ prop +'" n\'est pas présente dans l\'objet reçu.');

                }

                if(typeof(data[prop]) !== expectedPropeties[prop]) {

                    badProperties.push('Le type de la propriété "'+ prop +'" présente dans l\'objet reçu ('+ typeof(data[prop]) +') ne correspond pas au type attendu ('+ expectedPropeties[prop] +').');

                }

            }

            if(badProperties.length > 0) {

                throw badProperties.join('\n');

            }
            else {

                return data;

            }

        })
        .catch((e) => {

            console.error(errorTitle + e);
            return false;

        });

}

/**
 * Récupère les informations détaillées du produit et les insère dans le DOM
 * @retun void
 */
 async function load() {

    let product = await getProduct();
    insertProduct(product);

}

load();