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

async function loadCurrentLocation(){

    if(!navigator.geolocation){

        alert("GPS tidak tersedia");

        return;

    }

    navigator.geolocation.getCurrentPosition(

        function(pos){

            pickupLat =
            pos.coords.latitude;

            pickupLng =
            pos.coords.longitude;

            map.setView(

                [

                    pickupLat,
                    pickupLng

                ],

                17

            );

            pickupMarker =
            L.marker(

                [

                    pickupLat,
                    pickupLng

                ],

                {

                    draggable:true

                }

            ).addTo(map);

            pickupAddress.innerHTML =

            pickupLat.toFixed(6)

            +

            ", "

            +

            pickupLng.toFixed(6);

            pickupMarker.on(

                'dragend',

                updatePickup

            );

        },

        function(){

            alert(

                "GPS gagal."

            );

        },

        {

            enableHighAccuracy:true

        }

    );

}

function updatePickup(e){

    const pos =

    e.target.getLatLng();

    pickupLat = pos.lat;
    pickupLng = pos.lng;

    pickupAddress.innerHTML =

    pickupLat.toFixed(6)

    +

    ", "

    +

    pickupLng.toFixed(6);

    drawRoute();

}

function onMapClick(e){

    destinationLat =
    e.latlng.lat;

    destinationLng =
    e.latlng.lng;

    if(!destinationMarker){

        destinationMarker =

        L.marker(

            [

                destinationLat,
                destinationLng

            ]

        ).addTo(map);

    }else{

        destinationMarker.setLatLng(

            [

                destinationLat,
                destinationLng

            ]

        );

    }

    destinationAddress.innerHTML =

    destinationLat.toFixed(6)

    +

    ", "

    +

    destinationLng.toFixed(6);

    drawRoute();

}

function drawRoute(){

    if(

        pickupLat == null ||

        destinationLat == null

    ){

        return;

    }

    if(routingControl){

        map.removeControl(

            routingControl

        );

    }

    routingControl =

    L.Routing.control({

        waypoints:[

            L.latLng(

                pickupLat,
                pickupLng

            ),

            L.latLng(

                destinationLat,
                destinationLng

            )

        ],

        draggableWaypoints:false,

        addWaypoints:false,

        createMarker:()=>null,

        routeWhileDragging:false

    }).addTo(map);

    routingControl.on(

        'routesfound',

        function(e){

            const route =

            e.routes[0];

            distanceEl.innerHTML =

            (

                route.summary.totalDistance

                /

                1000

            ).toFixed(2)

            +

            " km";

            durationEl.innerHTML =

            Math.ceil(

                route.summary.totalTime

                /

                60

            )

            +

            " menit";

            const fare =

            calculateFare(

                route.summary.totalDistance

            );

            priceEl.innerHTML =

            "Rp "

            +

            fare.toLocaleString(

                'id-ID'

            );

        }

    );

}
