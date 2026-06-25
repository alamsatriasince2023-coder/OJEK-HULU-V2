import { supabase } from './api.js';

/* ===========================
   HITUNG JARAK (HAVERSINE)
=========================== */

function calculateDistance(

    lat1,
    lng1,

    lat2,
    lng2

){

    const R = 6371;

    const dLat =
    (lat2 - lat1) * Math.PI / 180;

    const dLng =
    (lng2 - lng1) * Math.PI / 180;

    const a =

        Math.sin(dLat / 2) *
        Math.sin(dLat / 2)

        +

        Math.cos(lat1 * Math.PI / 180)

        *

        Math.cos(lat2 * Math.PI / 180)

        *

        Math.sin(dLng / 2)

        *

        Math.sin(dLng / 2);

    const c =

        2 *

        Math.atan2(

            Math.sqrt(a),

            Math.sqrt(1 - a)

        );

    return R * c;

}

/* ===========================
   CARI DRIVER TERDEKAT
=========================== */

export async function assignNearestDriver(

    pickupLatitude,
    pickupLongitude

){

    const {

        data: drivers,

        error

    } =
    await supabase
    .from('drivers')
    .select('*')
    .eq('is_online', true);

    if(error){

        throw error;

    }

    if(!drivers || drivers.length===0){

        return null;

    }

    let nearest = null;

    let shortestDistance = Infinity;

    drivers.forEach(driver=>{

        if(

            driver.latitude == null ||

            driver.longitude == null

        ){

            return;

        }

        const distance =

        calculateDistance(

            pickupLatitude,

            pickupLongitude,

            driver.latitude,

            driver.longitude

        );

        if(distance < shortestDistance){

            shortestDistance = distance;

            nearest = driver;

        }

    });

    if(!nearest){

        return null;

    }

    return {

        driver: nearest,

        distance: shortestDistance,

        assignedAt:
        new Date().toISOString()

    };

}
