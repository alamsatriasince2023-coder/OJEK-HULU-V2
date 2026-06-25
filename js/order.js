import { supabase } from './api.js';
import { requireRole } from './rbac.js';

/* ===========================
   AUTH
=========================== */

const auth = await requireRole('customer');

if (!auth) {

    throw new Error('Akses ditolak');

}

const user = auth.user;

/* ===========================
   GPS
=========================== */

let pickupLatitude = null;
let pickupLongitude = null;

let destinationLatitude = null;
let destinationLongitude = null;

/* ===========================
   ELEMENT
=========================== */

const form =
document.getElementById('order-form');

const btnLocation =
document.getElementById('btn-my-location');

const pickupInput =
document.getElementById('pickup');

/* ===========================
   GPS CUSTOMER
=========================== */

btnLocation.addEventListener(
'click',
getCurrentLocation
);

function getCurrentLocation(){

    if(!navigator.geolocation){

        alert('Browser tidak mendukung GPS.');

        return;

    }

    btnLocation.disabled = true;
    btnLocation.innerHTML = 'Mengambil Lokasi...';

    navigator.geolocation.getCurrentPosition(

        (position)=>{

            pickupLatitude =
            position.coords.latitude;

            pickupLongitude =
            position.coords.longitude;

            pickupInput.value =
            `${pickupLatitude.toFixed(6)}, ${pickupLongitude.toFixed(6)}`;

            btnLocation.disabled = false;
            btnLocation.innerHTML =
            '📍 Gunakan Lokasi Saya';

        },

        ()=>{

            alert('Gagal mengambil lokasi.');

            btnLocation.disabled = false;

            btnLocation.innerHTML =
            '📍 Gunakan Lokasi Saya';

        },

        {

            enableHighAccuracy:true,
            timeout:10000

        }

    );

}

/* ===========================
   FORM
=========================== */

form.addEventListener(
'submit',
submitOrder
);

async function submitOrder(e){

    e.preventDefault();

    const pickup =
    pickupInput.value.trim();

    const destination =
    document
    .getElementById('destination')
    .value
    .trim();

    const notes =
    document
    .getElementById('notes')
    .value
    .trim();

    if(!pickup || !destination){

        alert('Lokasi wajib diisi.');

        return;

    }

    const btn =
    form.querySelector(
    'button[type="submit"]'
    );

    btn.disabled = true;

    btn.innerHTML = 'Mengirim...';

    const estimatePrice = 15000;

    const { data, error } =
    await supabase
    .from('orders')
    .insert({

        customer_id:user.id,

        nama:
        auth.profile.full_name ||
        user.email,

        jemput:pickup,

        tujuan:destination,

        catatan:notes,

        price:estimatePrice,

        status:'pending',

        pickup_latitude:
        pickupLatitude,

        pickup_longitude:
        pickupLongitude,

        destination_latitude:
        destinationLatitude,

        destination_longitude:
        destinationLongitude

    })
    .select()
    .single();

    btn.disabled = false;

    btn.innerHTML =
    '🚕 Pesan Sekarang';

    if(error){

        alert(error.message);

        return;

    }

    location.href =
    `order-status.html?id=${data.id}`;

}
