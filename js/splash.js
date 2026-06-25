window.addEventListener(

'load',

()=>{

setTimeout(()=>{

const splash =

document.getElementById(

'splash'

);

if(!splash){

return;

}

splash.style.opacity='0';

setTimeout(()=>{

splash.remove();

},400);

},700);

});
