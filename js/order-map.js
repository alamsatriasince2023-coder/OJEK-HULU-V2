import { assignNearestDriver } from './assign-driver.js';
import { supabase } from './api.js';
import { requireRole } from './rbac.js';
import { calculateFare } from './tariff.js';

let driverAnimations = new Map();
let nearbyDrivers = [];
let driverMarkers = new Map();

const auth = await requireRole('customer');

if(!auth){

    throw new Error('Akses ditolak');

}

/* ===========================
   CUSTOM ICON
=========================== */

const pickupIcon = L.icon({

    iconUrl:'assets/icons/pickup.png',

    iconSize:[42,42],

    iconAnchor:[21,42]

});

const destinationIcon = L.icon({

    iconUrl:'assets/icons/destination.png',

    iconSize:[42,42],

    iconAnchor:[21,42]

});

const driverIcon = L.icon({

    iconUrl:'assets/icons/motor.png',

    iconSize:[36,36],

    iconAnchor:[18,18]

});

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

const searchInput =
document.getElementById(
'destination-search'
);

const searchResult =
document.getElementById(
'search-result'
);

let pickupAddressText = "";
let destinationAddressText = "";
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

        async function(pos){

            pickupLat = pos.coords.latitude;

            pickupLng = pos.coords.longitude;

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

                    draggable:true,

                    icon:pickupIcon

                }

            ).addTo(map);

            try{

                const address =

                await reverseGeocode(

                    pickupLat,

                    pickupLng

                );

                console.log(

                    "Display Name:",

                    address

                );

                pickupAddressText =

                address;

                pickupAddress.textContent =

                address;

                setTimeout(()=>{

                    console.log(

                        "HTML setelah 1 detik:",

                        pickupAddress.textContent

                    );

                },1000);

            }

            catch(err){

                console.error(

                    "Reverse Geocode Error:",

                    err

                );

                pickupAddress.textContent =

                    pickupLat.toFixed(6)

                    +

                    ", "

                    +

                    pickupLng.toFixed(6);

            }

            pickupMarker.on(

                "dragend",

                updatePickup

            );

            loadNearbyDrivers();

        },

        function(err){

            console.error(

                err

            );

            alert(

                "GPS gagal."

            );

        },

        {

            enableHighAccuracy:true,

            timeout:15000,

            maximumAge:0

        }

    );

}

async function updatePickup(e){

    const pos =

    e.target.getLatLng();

    pickupLat =

    pos.lat;

    pickupLng =

    pos.lng;

    try{

        const address =

        await reverseGeocode(

            pickupLat,

            pickupLng

        );

        pickupAddressText =

        address;
        
        pickupAddress.textContent =
        
        address;

    }

    catch{

        pickupAddress.textContent =

        pickupLat.toFixed(6)

        +

        ", "

        +

        pickupLng.toFixed(6);

    }

    drawRoute();

    loadNearbyDrivers();

}

async function onMapClick(e){

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

            ],

            {

                icon:destinationIcon

            }

        ).addTo(map);

    }else{

        destinationMarker.setLatLng(

            [

                destinationLat,

                destinationLng

            ]

        );

    }

    try{

        const address =

        await reverseGeocode(

            destinationLat,

            destinationLng

        );

        destinationAddressText =

        address;
        
        destinationAddress.textContent =
        
        address;

    }

    catch{

        destinationAddress.textContent =

        destinationLat.toFixed(6)

        +

        ", "

        +

        destinationLng.toFixed(6);

    }

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

            pickupAddressText ||
            
            `${pickupLat},${pickupLng}`,
            
            tujuan:
            
            destinationAddressText ||
            
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

            driver_name:null,
            

            status:
            driver
            ? 'accepted'
            : 'pending',

            accepted_at:
            driver
            ? new Date().toISOString()
            : null,

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
        `order-status-map.html?id=${data.id}`;

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

async function loadNearbyDrivers(){

    if(
        pickupLat == null ||
        pickupLng == null
    ){
        return;
    }

    const { data, error } =
    await supabase
    .from('drivers')
    .select(`
        id,
        latitude,
        longitude,
        is_online
    `)
    .eq('is_online', true);

    if(error){

        console.error(error);

        return;

    }

    nearbyDrivers = data || [];

    renderNearbyDrivers();

}

function renderNearbyDrivers(){

    /* ===========================
       HAPUS MARKER LAMA
    =========================== */

    driverMarkers.forEach(marker=>{

        if(map.hasLayer(marker)){

            map.removeLayer(marker);

        }

    });

    driverMarkers.clear();

    /* ===========================
       TAMPILKAN DRIVER
    =========================== */

    nearbyDrivers.forEach(driver=>{

        if(

            driver.latitude == null ||
            driver.longitude == null

        ){

            return;

        }

        /* ===========================
           FILTER DRIVER (±5 KM)
        =========================== */

        const distance = Math.sqrt(

            Math.pow(

                Number(driver.latitude) - pickupLat,

                2

            ) +

            Math.pow(

                Number(driver.longitude) - pickupLng,

                2

            )

        );

        if(distance > 0.05){

            return;

        }

        /* ===========================
           MARKER DRIVER
        =========================== */

        const marker =
        L.marker(

            [

                Number(driver.latitude),
                Number(driver.longitude)

            ],

            {

                icon:driverIcon

            }

        )

        .addTo(map)

        .bindPopup(

            '🚕 Driver Online'

        );

        driverMarkers.set(

            driver.id,

            marker

        );

    });

}

searchInput.addEventListener(

'input',

searchLocation

);

async function searchLocation(){

    const keyword =

    searchInput.value.trim();

    if(keyword.length < 3){

        searchResult.style.display='none';

        return;

    }

    const response =

    await fetch(

`https://ojek-hulu-geocode.alamsatria-since2023.workers.dev/?q=${encodeURIComponent(keyword)}`

    );

    const data =
    await response.json();

    searchResult.innerHTML='';

    data.forEach(item=>{

        const div =
        document.createElement('div');

        div.className='search-item';

        div.innerHTML=
        item.display_name;

        div.onclick=()=>{

            selectDestination(item);

        };

        searchResult.appendChild(div);

    });

    searchResult.style.display='block';

}

function selectDestination(item){

    destinationLat =
    Number(item.lat);

    destinationLng =
    Number(item.lon);

    searchInput.value =
    item.display_name;

    destinationAddress.textContent =
    item.display_name;

    searchResult.style.display='none';

    if(!destinationMarker){

        destinationMarker =
        L.marker([

            destinationLat,

            destinationLng

        ]).addTo(map);

    }else{

        destinationMarker.setLatLng([

            destinationLat,

            destinationLng

        ]);

    }

    map.panTo([

        destinationLat,

        destinationLng

    ]);

    drawRoute();

}

async function reverseGeocode(

    lat,

    lng

){

    const url =

`https://ojek-hulu-geocode.alamsatria-since2023.workers.dev/reverse?lat=${lat}&lng=${lng}`;

    console.log("Reverse URL:", url);

    const response =

    await fetch(url);

    console.log("Status:", response.status);

    const data =

    await response.json();

    console.log("Reverse Result:", data);

    return (

        data.display_name ||

        `${lat},${lng}`

    );

}

supabase

.channel(

    'drivers-live'

)

.on(

    'postgres_changes',

    {

        event:'UPDATE',

        schema:'public',

        table:'drivers'

    },

    ()=>{

        loadNearbyDrivers();

    }

)

.subscribe();
