let deferredPrompt = null;

window.addEventListener(

    'beforeinstallprompt',

    (e)=>{

        e.preventDefault();

        deferredPrompt = e;

        const btn = document.getElementById(

            'btn-install'

        );

        if(btn){

            btn.style.display = 'block';

        }

    }

);

document

.getElementById('btn-install')

?.addEventListener(

'click',

async()=>{

    if(!deferredPrompt){

        return;

    }

    deferredPrompt.prompt();

    await deferredPrompt.userChoice;

    deferredPrompt = null;

});
