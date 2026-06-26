const CACHE_NAME = "ojek-hulu-v4";

/* ===========================
   FILE STATIS
=========================== */

const STATIC_FILES = [

    "/manifest.webmanifest",

    "/css/style.css",

    "/assets/icons/icon-192.png",
    "/assets/icons/icon-512.png",
    "/assets/icons/maskable-512.png",

    "/assets/images/logo.png",
    "/assets/images/banner.png",
    "/assets/images/splash.png"

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
            .then(cache=>cache.addAll(STATIC_FILES))

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

                        if(key !== CACHE_NAME){

                            return caches.delete(key);

                        }

                    })

                );

            })

            .then(()=>self.clients.claim())

        );

    }

);

/* ===========================
   FETCH
=========================== */

self.addEventListener(

    "fetch",

    event=>{

        if(event.request.method !== "GET"){

            return;

        }

        const url = new URL(event.request.url);

        // Jangan cache Supabase
        if(

            url.hostname.includes("supabase.co")

        ){

            return;

        }

        // HTML selalu ambil dari network
        if(

            event.request.mode === "navigate"

        ){

            event.respondWith(

                fetch(event.request)

                .catch(()=>{

                    return caches.match("/offline.html");

                })

            );

            return;

        }

        // Asset: cache first
        event.respondWith(

            caches.match(event.request)

            .then(cache=>{

                if(cache){

                    return cache;

                }

                return fetch(event.request)

                .then(response=>{

                    if(

                        !response ||

                        !response.ok ||

                        response.redirected

                    ){

                        return response;

                    }

                    if(

                        response.type === "basic"

                    ){

                        const clone = response.clone();

                        caches.open(CACHE_NAME)

                        .then(c=>{

                            c.put(

                                event.request,

                                clone

                            );

                        });

                    }

                    return response;

                });

            })

        );

    }

);
