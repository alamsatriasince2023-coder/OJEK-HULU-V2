const CACHE_NAME = "ojek-hulu-v2";

const FILES = [

    "/",

    "/index.html",

    "/login.html",

    "/register.html",

    "/customer.html",

    "/customer-history.html",

    "/driver-dashboard.html",

    "/driver-register.html",

    "/order-map.html",

    "/order-status-map.html",

    "/profile.html",

    "/offline.html",

    "/css/style.css",

    "/manifest.webmanifest",

    "/assets/icons/icon-192.png",

    "/assets/icons/icon-512.png",

    "/assets/icons/maskable-512.png",

    "/assets/images/logo.png",

    "/assets/images/banner.png",

    "/assets/images/splash.png",

    "/js/api.js",

    "/js/auth.js",

    "/js/rbac.js",

    "/js/customer.js",

    "/js/order-map.js",

    "/js/order-status-map.js",

    "/js/tariff.js",

    "/js/assign-driver.js",

    "/js/pwa.js"

];

/* ===========================
   INSTALL
=========================== */

self.addEventListener(

    "install",

    event=>{

        self.skipWaiting();

        event.waitUntil(

            caches
            .open(CACHE_NAME)
            .then(cache=>cache.addAll(FILES))

        );

    }

);

/* ===========================
   ACTIVATE
=========================== */

self.addEventListener(

    "activate",

    event=>{

        event.waitUntil(

            caches.keys()

            .then(keys=>{

                return Promise.all(

                    keys.map(key=>{

                        if(key!==CACHE_NAME){

                            return caches.delete(key);

                        }

                    })

                );

            })

        );

        self.clients.claim();

    }

);

/* ===========================
   FETCH
=========================== */

self.addEventListener(

    "fetch",

    event=>{

        if(event.request.method!=="GET"){

            return;

        }

        event.respondWith(

            fetch(event.request)

            .then(response=>{

                const copy=response.clone();

                caches.open(CACHE_NAME)

                .then(cache=>{

                    cache.put(

                        event.request,

                        copy

                    );

                });

                return response;

            })

            .catch(async()=>{

                const cached=

                await caches.match(

                    event.request

                );

                if(cached){

                    return cached;

                }

                if(

                    event.request.mode==="navigate"

                ){

                    return caches.match(

                        "/offline.html"

                    );

                }

            })

        );

    }

);
