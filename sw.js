const CACHE_NAME = "ojek-hulu-v2";

const FILES = [

    "/",
    "/index.html",
    "/login.html",
    "/register.html",
    "/customer.html",
    "/driver-dashboard.html",
    "/order-map.html",
    "/order-status-map.html",
    "/offline.html",

    "/css/style.css",

    "/manifest.webmanifest",

    "/assets/icons/icon-192.png",
    "/assets/images/icon-512.png"

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
