// Récupération du paramètre orderId dans l'URL
let orderId = new URLSearchParams(document.location.search).get('orderId') ?? '';

if(orderId.length === 0) {

    console.error('Le paramètre "orderId" est absent de la requête ou sa valeur est vide.');

}
else {

    document.getElementById('orderId').textContent = orderId;

}