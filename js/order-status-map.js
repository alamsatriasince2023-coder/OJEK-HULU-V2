import { supabase } from './api.js';
import { requireRole } from './rbac.js';

const auth = await requireRole('customer');

if(!auth){

    throw new Error('Akses ditolak');

}

const params = new URLSearchParams(

    window.location.search

);

const orderId = params.get('id');

if(!orderId){

    alert('Order tidak ditemukan.');

    location.href='customer.html';

}

let map;

let pickupMarker = null;
let destinationMarker = null;

let driverMarker = null;
let driverAnimation = null;
let driverRoute = null;
let currentEta = 0;
let followDriver = true;
let lastBearing = 0;
let currentDistance = 0;

init();

async function init(){

    map = L.map('map').setView(

        [-0.03,111.32],

        15

    );

    L.tileLayer(

        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',

        {

            maxZoom:19

        }

    ).addTo(map);

    await loadOrder();

    subscribeRealtime();
        map.on(
    
        "dragstart",
    
        ()=>{
    
            followDriver = false;
    
        }
    
    );
    document

    .getElementById(
    
        "btn-follow"
    
    )
    
    .addEventListener(
    
        "click",
    
        ()=>{
    
            followDriver = true;
    
            if(driverMarker){
    
                map.panTo(
    
                    driverMarker.getLatLng(),
    
                    {
    
                        animate:true,
    
                        duration:0.5
    
                    }
    
                );
    
            }
    
        }
    
    );

}

async function loadOrder(){

    const { data, error } =

    await supabase

    .from('orders')

    .select('*')

    .eq('id',orderId)

    .single();

    if(error){

        console.error(error);

        return;

    }

    renderOrder(data);

}

async function renderOrder(order){

    document.getElementById(

        'price'

    ).textContent =

    'Rp ' +

    Number(order.price || 0)

    .toLocaleString('id-ID');

    document.getElementById(

        'status-text'

    ).textContent =

    order.status;

    document.getElementById(

        'order-status'

    ).textContent =

    convertStatus(order.status);

    if(order.status === "completed"){

        alert(
    
            "🎉 Perjalanan selesai.\nTerima kasih telah menggunakan Ojek Hulu."
    
        );
    
        setTimeout(()=>{
    
            location.href =
    
            "customer-history.html";
    
        },1500);
    
        return;
    
    }

    document.getElementById(

        'driver-name'
    
    ).textContent =
    
    order.driver_name ||
    
    "Mencari Driver...";
    
    const btnCancel =
    
    document.getElementById(
    
        "btn-cancel"
    
    );
    
    if(btnCancel){
    
        btnCancel.style.display =
    
        [
    
            "accepted",
    
            "pickup",
    
            "ontheway",
    
            "completed"
    
        ].includes(order.status)
    
        ? "none"
    
        : "block";
    
    }

    if(!pickupMarker){

        pickupMarker =

        L.marker([

            order.pickup_latitude,

            order.pickup_longitude

        ]).addTo(map);

    }

    if(!destinationMarker){

        destinationMarker =

        L.marker([

            order.destination_latitude,

            order.destination_longitude

        ]).addTo(map);

    }

    map.fitBounds([

        [

            order.pickup_latitude,

            order.pickup_longitude

        ],

        [

            order.destination_latitude,

            order.destination_longitude

        ]

    ]);

    if(order.driver_id){

        await loadDriver(

            order.driver_id

        );

    }

}

async function loadDriver(driverId){

    const { data } =

    await supabase

    .from('drivers')

    .select('*')

    .eq('id',driverId)

    .single();

    if(!data){

        return;

    }

    if(!driverMarker){

        driverMarker =

        L.marker([

            data.latitude,

            data.longitude

        ]).addTo(map);

    }else{

        animateDriver(
    
            data.latitude,
    
            data.longitude
    
        );
    
    }

}

function convertStatus(status){

    switch(status){

        case 'pending':

            return '🔍 Mencari Driver...';

        case 'offered':

            return '📡 Menghubungi Driver';

        case 'accepted':

            return '🟢 Driver Ditemukan';

        case 'pickup':

            return '📍 Driver Menuju Jemput';

        case 'ontheway':

            return '🚕 Dalam Perjalanan';

        case 'completed':

            return '✅ Order Selesai';

        default:

            return status;

    }

}

function subscribeRealtime(){

    supabase

    .channel(

        'order-'+orderId

    )

    .on(

        'postgres_changes',

        {

            event:'UPDATE',

            schema:'public',

            table:'orders',

            filter:`id=eq.${orderId}`

        },

        payload=>{

            renderOrder(

                payload.new

            );

        }

    )

    .subscribe();

    supabase

    .channel(

        'driver-live'

    )

    .on(

        'postgres_changes',

        {

            event:'UPDATE',

            schema:'public',

            table:'drivers'

        },

        payload=>{

            if(

                driverMarker &&

                payload.new.latitude != null

            ){

                animateDriver(

                    payload.new.latitude,
            
                    payload.new.longitude
            
                );
            
            }

        }

    )

    .subscribe();

}

function animateDriver(

    lat,

    lng

){

    if(!driverMarker){

        return;

    }

    if(driverAnimation){

        clearInterval(

            driverAnimation

        );

    }

    const start =

    driverMarker.getLatLng();

    const end =

    L.latLng(

        lat,

        lng

    );

    lastBearing =

    calculateBearing(

        start.lat,

        start.lng,

        end.lat,

        end.lng

    );

    let step = 0;

    const total = 30;

    driverAnimation =

    setInterval(()=>{

        step++;

        const progress =

        step / total;

        const newLat =

            start.lat +

            (

                end.lat -

                start.lat

            )

            *

            progress;

        const newLng =

            start.lng +

            (

                end.lng -

                start.lng

            )

            *

            progress;

        driverMarker.setLatLng([

            newLat,

            newLng

        ]);

        if(

            driverMarker.setRotationAngle

        ){

            driverMarker.setRotationAngle(

                lastBearing

            );

        }

        drawDriverRoute();
        if(

            pickupMarker
        
        ){
        
            const distance =
        
            getDistanceMeters(
        
                newLat,
        
                newLng,
        
                pickupMarker
        
                .getLatLng()
        
                .lat,
        
                pickupMarker
        
                .getLatLng()
        
                .lng
        
            );
        
            if(distance <= 100){
        
                console.log(
        
                    "Driver hampir tiba di titik jemput"
        
                );
        
            }
        
        }

        if(

            step === total &&

            followDriver

        ){

            map.panTo(

                [

                    newLat,

                    newLng

                ],

                {

                    animate:true,

                    duration:0.5

                }

            );

        }

        if(

            step >= total

        ){

            clearInterval(

                driverAnimation

            );

            driverAnimation = null;

        }

    },50);

}

function drawDriverRoute(){

    if(

        !driverMarker ||

        !pickupMarker

    ){

        return;

    }

    if(driverRoute){

        map.removeControl(

            driverRoute

        );

    }

    driverRoute =

    L.Routing.control({

        waypoints:[

            driverMarker.getLatLng(),

            pickupMarker.getLatLng()

        ],

        draggableWaypoints:false,

        addWaypoints:false,

        fitSelectedRoutes:false,

        show:false,

        createMarker:()=>null,

        lineOptions:{

            styles:[

                {

                    color:"#00AA13",

                    weight:6,

                    opacity:0.9

                }

            ]

        }

    })

    .addTo(map);

        driverRoute.on(
    
        "routesfound",
    
        e=>{
    
            const route =
    
            e.routes[0];
    
            currentDistance =
    
            route.summary.totalDistance;
    
            currentEta =
    
            route.summary.totalTime;
    
            updateEta();
    
        }
    
    );

}

function updateEta(){

    document
    .getElementById("distance")
    .textContent =
    (currentDistance / 1000).toFixed(1)
    + " km";

    document
    .getElementById("eta")
    .textContent =
    Math.ceil(currentEta / 60)
    + " menit";

}

function calculateBearing(

    lat1,

    lng1,

    lat2,

    lng2

){

    const toRad =

    Math.PI / 180;

    const y =

        Math.sin(

            (lng2 - lng1)

            *

            toRad

        )

        *

        Math.cos(

            lat2 * toRad

        );

    const x =

        Math.cos(

            lat1 * toRad

        )

        *

        Math.sin(

            lat2 * toRad

        )

        -

        Math.sin(

            lat1 * toRad

        )

        *

        Math.cos(

            lat2 * toRad

        )

        *

        Math.cos(

            (

                lng2 - lng1

            )

            *

            toRad

        );

    return (

        Math.atan2(

            y,

            x

        )

        *

        180

        /

        Math.PI

        +

        360

    ) % 360;

}

function getDistanceMeters(

    lat1,

    lng1,

    lat2,

    lng2

){

    const R = 6371000;

    const dLat =

    (lat2-lat1)

    *

    Math.PI/180;

    const dLng =

    (lng2-lng1)

    *

    Math.PI/180;

    const a =

        Math.sin(dLat/2)

        *

        Math.sin(dLat/2)

        +

        Math.cos(lat1*Math.PI/180)

        *

        Math.cos(lat2*Math.PI/180)

        *

        Math.sin(dLng/2)

        *

        Math.sin(dLng/2);

    const c =

    2 *

    Math.atan2(

        Math.sqrt(a),

        Math.sqrt(1-a)

    );

    return R*c;

}
