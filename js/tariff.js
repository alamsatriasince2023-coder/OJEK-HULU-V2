/* ===========================
   TARIF ENGINE
=========================== */

const BASE_FARE = 10000;

const PRICE_PER_KM = 3000;

/* ===========================
   PARSE KOORDINAT
=========================== */

function parseCoordinate(value){

    if(!value){

        return null;

    }

    const parts =
    value.split(',');

    if(parts.length !== 2){

        return null;

    }

    const latitude =
    Number(parts[0].trim());

    const longitude =
    Number(parts[1].trim());

    if(

        Number.isNaN(latitude) ||

        Number.isNaN(longitude)

    ){

        return null;

    }

    return{

        latitude,

        longitude

    };

}

/* ===========================
   GEOCODING
=========================== */

export async function geocodeAddress(address){

    const url =
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;

    const response =
    await fetch(url,{

        headers:{

            Accept:'application/json'

        }

    });

    if(!response.ok){

        throw new Error(
            'Gagal menghubungi server geocoding.'
        );

    }

    const data =
    await response.json();

    if(!data || data.length===0){

        throw new Error(
            'Alamat tidak ditemukan.'
        );

    }

    return{

        latitude:
        Number(data[0].lat),

        longitude:
        Number(data[0].lon)

    };

}

/* ===========================
   ROUTE OSRM
=========================== */

export async function calculateRoute(

    startLat,
    startLng,

    endLat,
    endLng

){

    const url =
    `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=false`;

    const response =
    await fetch(url);

    if(!response.ok){

        throw new Error(
            'Gagal mengambil rute.'
        );

    }

    const json =
    await response.json();

    if(

        !json.routes ||

        json.routes.length===0

    ){

        throw new Error(
            'Route tidak ditemukan.'
        );

    }

    const route =
    json.routes[0];

    return{

        distance:
        route.distance,

        duration:
        route.duration

    };

}

/* ===========================
   HITUNG TARIF
=========================== */

export function calculateFare(distance){

    const km =
    distance / 1000;

    return Math.round(

        BASE_FARE +

        (km * PRICE_PER_KM)

    );

}

/* ===========================
   ESTIMASI PERJALANAN
=========================== */

export async function estimateTrip(

    pickupAddress,

    destinationAddress

){

    const pickup =

        parseCoordinate(
            pickupAddress
        )

        ||

        await geocodeAddress(
            pickupAddress
        );

    const destination =

        parseCoordinate(
            destinationAddress
        )

        ||

        await geocodeAddress(
            destinationAddress
        );

    const route =
    await calculateRoute(

        pickup.latitude,
        pickup.longitude,

        destination.latitude,
        destination.longitude

    );

    const price =
    calculateFare(
        route.distance
    );

    return{

        pickupLat:
        pickup.latitude,

        pickupLng:
        pickup.longitude,

        destinationLat:
        destination.latitude,

        destinationLng:
        destination.longitude,

        distance:
        route.distance,

        duration:
        route.duration,

        price

    };

}
