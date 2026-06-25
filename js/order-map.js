import { assignNearestDriver } from './assign-driver.js';
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

let currentFare = 0;
let currentDistance = 0;
let currentDuration = 0;

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
        pickupLng == null ||
        destinationLat == null ||
        destinationLng == null

    ){

        return;

    }

    if(routingControl){

        map.removeControl(routingControl);

        routingControl = null;

    }

    routingControl = L.Routing.control({

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

        routeWhileDragging:false,

        draggableWaypoints:false,

        addWaypoints:false,

        fitSelectedRoutes:true,

        show:false,

        createMarker:()=>null

    }).addTo(map);

    routingControl.on(

        'routesfound',

        function(e){

            if(

                !e.routes ||

                e.routes.length===0

            ){

                return;

            }

            const route =
            e.routes[0];

            currentDistance =
            route.summary.totalDistance;

            currentDuration =
            route.summary.totalTime;

            currentFare =
            calculateFare(
                currentDistance
            );

            distanceEl.textContent =
            (currentDistance / 1000).toFixed(2)
            + " km";

            durationEl.textContent =
            Math.ceil(currentDuration / 60)
            + " menit";

            priceEl.textContent =
            "Rp " +
            currentFare.toLocaleString("id-ID");

        }

    );

}

async function submitOrder(){

    if(

        pickupLat == null ||
        pickupLng == null ||
        destinationLat == null ||
        destinationLng == null

    ){

        alert(
            'Silakan pilih lokasi tujuan.'
        );

        return;

    }

    if(currentFare <= 0){

        alert(

            'Tarif belum dihitung.'

        );

        return;

    }

    const btn =
    document.getElementById(
        'btn-order'
    );

    btn.disabled = true;

    btn.innerHTML =
    'Memesan...';

    try{

        const nearest =
        await assignNearestDriver(

            pickupLat,
            pickupLng

        );

        const driver =
        nearest?.driver;

        const { data, error } =
        await supabase
        .from('orders')
        .insert({

            customer_id:
            auth.user.id,

            nama:
            auth.profile.full_name ||
            auth.user.email,

            jemput:
            `${pickupLat},${pickupLng}`,

            tujuan:
            `${destinationLat},${destinationLng}`,

            pickup_latitude:
            pickupLat,

            pickup_longitude:
            pickupLng,

            destination_latitude:
            destinationLat,

            destination_longitude:
            destinationLng,

            price:
            currentFare,

            driver_id:
            driver?.id || null,

            driver_name:
            driver?.full_name || null,

            status:
            driver
            ? 'accepted'
            : 'pending',

            accepted_at:
            driver
            ? new Date().toISOString()
            : null

            assigned_at:
            driver
            ? new Date().toISOString()
            : null,

        })
        .select()
        .single();

        if(error){

            throw error;

        }

        location.href =
        `order-status.html?id=${data.id}`;

    }

    catch(err){

        console.error(err);

        alert(err.message);

    }

    finally{

        btn.disabled = false;

        btn.innerHTML =
        '🚕 Pesan Sekarang';

    }

}

document
.getElementById("btn-order")
.addEventListener(
"click",
submitOrder
);
