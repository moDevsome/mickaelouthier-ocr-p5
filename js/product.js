/**
 * Ajoute le produit dans le panier après validation de la quantité, puis redirige l'utilisateur vers la page de confirmation
* @retun void
 */
function submitProduct(product, inputQuantityMin, inputQuantityMax) {

    const localStorageKey = 'kanap-cart';
    let errors = [];

    // Vérification du champ "couleur", la couleur sélectionnée doit faire partie des couleurs retournées par l'API
    let colorsField = document.getElementById('colors');
    let selectedColor = colorsField.value;
    if(!product.colors.map(color => color.toLowerCase()).includes(selectedColor)) {

        colorsField.options.selectedIndex = 0;
        errors.push('Merci de sélectionner une couleur.');

    }

    // Vérification du champ "quantité", la quantité doit un nombre compris entre la valeur de l'attribut "min" et la valeur de l'attribut "max" du noeud input#quantity
    let providedQuantity = parseInt(document.getElementById('quantity').value);
    if(isNaN(providedQuantity) || (providedQuantity < inputQuantityMin || providedQuantity > inputQuantityMax)) {

        document.getElementById('quantity').value = inputQuantityMin;
        errors.push('Merci de renseigner une quantité comprise entre '+ inputQuantityMin +' et '+ inputQuantityMax+ '.');

    }

    // Gestion des erreurs détecté, le panier ne peut pas etre mis à jour
    if(errors.length > 0) {

        alert(errors.join('\n'));
        return;

    }
    else {

        /*
        * On continue vers l'ajout du produit dans le panier
        */

        // On récupère l'objet panier courant dans le localstorage
        let cartObject = {};
        let cartObjectString = localStorage.getItem(localStorageKey) ?? '';
        if(cartObjectString.length > 0) {

            try {

                cartObject = JSON.parse(cartObjectString);

            }
            catch(error) {

                console.error(error);
                return;

            }

        }

        if(cartObject.hasOwnProperty(product._id)) { // Ce produit est déjà dans le panier

            // On vérifie si la couleur sélectionnée est déjà présente
            if(cartObject[product._id].hasOwnProperty(selectedColor)) { // la couleur est déjà présente, donc on incrémente la quantité

                cartObject[product._id][selectedColor] += providedQuantity;

            }
            else { // la couleur n'est pas présente, on ajoute la couleur avec la quantité

                cartObject[product._id][selectedColor] = providedQuantity;

            }

        }
        else { // Le produit n'est pas encore dans le panier

            let productObj = {};
            productObj[selectedColor] = providedQuantity;

            cartObject[product._id] = productObj;

        }

        // On réinjecte le panier à jour dans le localStorage
        try {

            localStorage.setItem(localStorageKey, JSON.stringify(cartObject));

        }
        catch(error) {

            console.error(error);
            alert('L\'application a rencontré une erreur et n\'a pas pu mettre votre panier à jour, nous vous prions de nous excuser pour ce désagrément et nous vous invitons à réessayer l\'opération ultérieurement.');

        }

        // On termine par la redirection de l'utilisateur vers la page de commande "cart.html"
        document.location.href = "./cart.html";

    }

}

/**
 * Insère les information détaillée du produit dans le DOM
 * @retun void
 */
 function insertProduct(product, inputQuantityMin) {

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

        // Gestion du champ <input> #quantity
        document.getElementById('quantity').value = inputQuantityMin;

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
            // const dataObjectProperties = Object.getOwnPropertyNames(data);
            let badProperties = [];

            for(prop of Object.getOwnPropertyNames(expectedPropeties)) {

                if(!data.hasOwnProperty(prop)) {

                    badProperties.push('La propriété "'+ prop +'" n\'est pas présente dans l\'objet reçu.');

                }
                else {

                    if(typeof(data[prop]) !== expectedPropeties[prop]) {

                        badProperties.push('Le type de la propriété "'+ prop +'" présente dans l\'objet reçu ('+ typeof(data[prop]) +') ne correspond pas au type attendu ('+ expectedPropeties[prop] +').');

                    }

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

    // On récupère les valeurs "min" et "max" de l'objet du noeud input#quantity
    // Ces valeurs seront utilisées dans les fonctions "insertProduct" et "submitProduct"
    let inputQuantity = document.getElementById('quantity');
    const inputQuantityMin = parseInt(inputQuantity.getAttribute('min') ?? 0);
    const inputQuantityMax = parseInt(inputQuantity.getAttribute('max') ?? 0);

    if((isNaN(inputQuantityMin) || isNaN(inputQuantityMax)) || (inputQuantityMin <= 0 || inputQuantityMax <= 0)) {

        console.error('Erreur de paramétrage du champ "quantity", la valeur des attributs "max" et "min" doit être un nombre supérieur à 0.');
        return;

    }

    const product = await getProduct();
    insertProduct(product, inputQuantityMin);

    // On ajoute un écouteur d'évenement de type "click" sur le bouton button#addToCart
    // le clic va déclencher l'ajout du produit dans le panier via la fonction "submitProduct"
    document.getElementById('addToCart').addEventListener('click', (event) => {

        event.stopPropagation();
        event.preventDefault();
        submitProduct(product, inputQuantityMin, inputQuantityMax);

        return false;
    })

}

load();