let routingControl = null;

let lastRoute = null;

let map = null;

let customerMarker = null;

let driverMarker = null;
let animationFrame = null;

/* ===========================
   INIT MAP
=========================== */

export function initMap(){

    if(map) return;

    map = L.map('map').setView(
        [0.8347,112.9368],
        13
    );

    L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
            maxZoom:19,
            attribution:'&copy; OpenStreetMap'
        }
    ).addTo(map);

}

/* ===========================
   CUSTOMER MARKER
=========================== */

export function updateCustomerLocation(
    latitude,
    longitude
){

    if(!map){

        initMap();

    }

    if(
        latitude == null ||
        longitude == null
    ){

        return;

    }

    const position = [

        Number(latitude),

        Number(longitude)

    ];

    if(!customerMarker){

        customerMarker =
        L.marker(position)
        .addTo(map)
        .bindPopup('📍 Lokasi Jemput');

    }else{

        customerMarker.setLatLng(position);

    }

    fitMap();

}

/* ===========================
   DRIVER MARKER
=========================== */

export function updateDriverLocation(
    latitude,
    longitude
){

    if(!map){

        initMap();

    }

    if(
        latitude == null ||
        longitude == null
    ){

        return;

    }

    const position = [

        Number(latitude),

        Number(longitude)

    ];

    if(!driverMarker){

        driverMarker =
        L.marker(position)
        .addTo(map)
        .bindPopup('🚕 Driver');

    }else{

        animateDriverMarker(position);

    }

    fitMap();

}

/* ===========================
   AUTO FIT MAP
=========================== */

function fitMap(){

    if(
        !customerMarker &&
        !driverMarker
    ){

        return;

    }

    const group = [];

    if(customerMarker){

        group.push(
            customerMarker.getLatLng()
        );

    }

    if(driverMarker){

        group.push(
            driverMarker.getLatLng()
        );

    }

    if(group.length===1){

        map.setView(
            group[0],
            16
        );

        return;

    }

    const bounds =
    L.latLngBounds(group);

    map.fitBounds(
        bounds,
        {
            padding:[60,60]
        }
    );

}

/* ===========================
   CLEAR CUSTOMER
=========================== */

export function clearCustomerMarker(){

    if(customerMarker){

        map.removeLayer(
            customerMarker
        );

        customerMarker = null;

    }

}

/* ===========================
   CLEAR DRIVER
=========================== */

export function clearDriverMarker(){

    if(driverMarker){

        map.removeLayer(driverMarker);
        if(animationFrame){
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
         }

        driverMarker = null;

    }

    if(routingControl){

        map.removeControl(
            routingControl
        );

        routingControl = null;

    }

    lastRoute = null;

}

/* ===========================
   ROUTE INFO
=========================== */

export function setRouteInfo(

    distance,

    time

){

    if(

        distance == null ||

        time == null

    ){

        return;

    }

    const distanceEl =
    document.getElementById(
        'route-distance'
    );

    const timeEl =
    document.getElementById(
        'route-time'
    );

    if(distanceEl){

        distanceEl.textContent =
        (distance/1000).toFixed(1) + ' km';

    }

    if(timeEl){

        timeEl.textContent =
        Math.ceil(time/60) + ' menit';

    }

}

/* ===========================
   DRAW ROUTE
=========================== */

export function drawRoute(

    driverLat,
    driverLng,

    customerLat,
    customerLng

){

    if(!map){

        return;

    }

    if(

        driverLat == null ||

        driverLng == null ||

        customerLat == null ||

        customerLng == null

    ){

        return;

    }

    const routeKey =
    `${driverLat},${driverLng},${customerLat},${customerLng}`;

    if(lastRoute === routeKey){

        return;

    }

    lastRoute = routeKey;

    if(routingControl){

        map.removeControl(
            routingControl
        );

        routingControl = null;

    }

    routingControl = L.Routing.control({

        waypoints:[

            L.latLng(
                driverLat,
                driverLng
            ),

            L.latLng(
                customerLat,
                customerLng
            )

        ],

        routeWhileDragging:false,

        addWaypoints:false,

        draggableWaypoints:false,

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

            setRouteInfo(

                route.summary.totalDistance,

                route.summary.totalTime

            );

        }

    );

}

function animateDriverMarker(target){

    if(!driverMarker){

        driverMarker =
        L.marker(target)
        .addTo(map)
        .bindPopup('🚕 Driver');

        return;

    }

    if(animationFrame){

        cancelAnimationFrame(animationFrame);

    }

    const start =
    driverMarker.getLatLng();

    const startLat = start.lat;
    const startLng = start.lng;

    const endLat = target[0];
    const endLng = target[1];

    const duration = 1000;

    const startTime = performance.now();

    function animate(now){

        const progress =
        Math.min(
            (now - startTime) / duration,
            1
        );

        const lat =
        startLat +
        (endLat - startLat) * progress;

        const lng =
        startLng +
        (endLng - startLng) * progress;

        driverMarker.setLatLng([
            lat,
            lng
        ]);

        if(progress < 1){

            animationFrame =
            requestAnimationFrame(
                animate
            );

        }else{

            animationFrame = null;

        }

    }

    animationFrame =
    requestAnimationFrame(
        animate
    );

}
