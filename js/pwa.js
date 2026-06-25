if(

    "serviceWorker" in navigator

){

    window.addEventListener(

        "load",

        ()=>{

            navigator.serviceWorker.register(

                "/sw.js"

            );

        }

    );

}

navigator.serviceWorker.addEventListener(

'controllerchange',

()=>{

window.location.reload();

});
