let map = null;

let driverMarker = null;

/* ===========================
   INIT MAP
=========================== */

export function initMap() {

    if (map) return;

    map = L.map('map').setView(
        [0.8347, 112.9368], // Putussibau
        13
    );

    L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
        }
    ).addTo(map);

}

/* ===========================
   UPDATE DRIVER MARKER
=========================== */

export function updateDriverLocation(latitude, longitude) {

    if (!map) {

        initMap();

    }

    if (
        latitude == null ||
        longitude == null
    ) {

        return;

    }

    const position = [
        Number(latitude),
        Number(longitude)
    ];

    if (!driverMarker) {

        driverMarker =
        L.marker(position)
        .addTo(map)
        .bindPopup('🚕 Driver');

    } else {

        driverMarker.setLatLng(position);

    }

    map.setView(position, 16);

}

/* ===========================
   REMOVE DRIVER
=========================== */

export function clearDriverMarker() {

    if (driverMarker) {

        map.removeLayer(driverMarker);

        driverMarker = null;

    }

}
