/* ===========================
   TARIF ENGINE
=========================== */

const BASE_FARE = 10000;

const PRICE_PER_KM = 3000;

/* ===========================
   GEOCODING
=========================== */

export async function geocodeAddress(address){

    const url =
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

    const response =
    await fetch(url);

    const data =
    await response.json();

    if(!data.length){

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

export function calculateFare(

    distance

){

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
    await geocodeAddress(
        pickupAddress
    );

    const destination =
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
