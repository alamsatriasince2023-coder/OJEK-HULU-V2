let routingControl = null;

let map = null;

let customerMarker = null;

let driverMarker = null;

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

        driverMarker.setLatLng(position);

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

        map.removeLayer(
            driverMarker
        );

        driverMarker = null;

    }

}

export function drawRoute(

    driverLat,
    driverLng,

    customerLat,
    customerLng

){

    if(!map){

        return;

    }

    if(routingControl){

        map.removeControl(routingControl);

    }

    routingControl = L.Routing.control({

        waypoints:[

            L.latLng(driverLat,driverLng),

            L.latLng(customerLat,customerLng)

        ],

        routeWhileDragging:false,

        addWaypoints:false,

        draggableWaypoints:false,

        fitSelectedRoutes:true,

        show:false,

        createMarker:()=>null

    }).addTo(map);

}
