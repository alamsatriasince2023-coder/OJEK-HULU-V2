import { supabase } from './api.js';
import { requireRole } from './rbac.js';
import { calculateFare } from './tariff.js';

const auth = await requireRole('customer');

if(!auth){

    throw new Error('Akses ditolak');

}

let map;

let pickupMarker = null;
let destinationMarker = null;
let routingControl = null;

let pickupLat = null;
let pickupLng = null;

let destinationLat = null;
let destinationLng = null;

const pickupAddress =
document.getElementById('pickup-address');

const destinationAddress =
document.getElementById('destination-address');

const distanceEl =
document.getElementById('distance');

const durationEl =
document.getElementById('duration');

const priceEl =
document.getElementById('price');

init();

async function init(){

    map = L.map('map').setView(
        [-0.03,111.32],
        13
    );

    L.tileLayer(

        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',

        {

            maxZoom:19

        }

    ).addTo(map);

    loadCurrentLocation();

    map.on(

        'click',

        onMapClick

    );

}
