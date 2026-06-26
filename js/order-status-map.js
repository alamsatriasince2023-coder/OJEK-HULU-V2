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
let driverAnimation = null;
let driverMarker = null;

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

    document.getElementById(

        'driver-name'

    ).textContent =

    order.driver_name ||

    'Mencari Driver...';

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

                driverMarker.setLatLng([

                    payload.new.latitude,

                    payload.new.longitude

                ]);

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

    L.latLng(lat,lng);

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

        ) * progress;

        const newLng =

        start.lng +

        (

            end.lng -

            start.lng

        ) * progress;

        driverMarker.setLatLng([

            newLat,

            newLng

        ]);

        if(step>=total){

            clearInterval(

                driverAnimation

            );

        }

    },50);

}
