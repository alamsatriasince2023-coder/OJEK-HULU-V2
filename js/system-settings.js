import { requireRole } from "./rbac.js";
import { supabase } from "./api.js";

const auth = await requireRole("admin");

if(!auth){

    throw new Error("Akses ditolak");

}

document.getElementById(

    "admin-name"

).textContent =

auth.profile.full_name;

init();

async function init(){

    await loadSettings();

}

/* ===========================
LOAD SETTINGS
=========================== */

async function loadSettings(){

    const { data, error } =

    await supabase

    .from("system_settings")

    .select("*");

    if(error){

        console.error(error);

        return;

    }

    setValue(data,"base_fare","base-fare");

    setValue(data,"price_per_km","price-per-km");

    setValue(data,"minimum_fare","minimum-fare");

    setValue(data,"driver_radius","driver-radius");

    setValue(data,"offer_timeout","offer-timeout");

    setValue(data,"minimum_topup","minimum-topup");

    setValue(data,"maximum_topup","maximum-topup");

    setValue(data,"minimum_withdraw","minimum-withdraw");

    setValue(data,"maximum_withdraw","maximum-withdraw");

    setValue(data,"platform_fee","platform-fee");

    setValue(data,"withdraw_fee","withdraw-fee");

    setValue(data,"topup_fee","topup-fee");

    setValue(data,"gps_interval","gps-interval");

    setValue(data,"auto_assign","auto-assign");

    setValue(data,"maintenance_mode","maintenance-mode");

    setValue(data,"realtime_enable","realtime-enable");

}

function setValue(data,key,id){

    const item =

    data.find(

        x=>x.setting_key===key

    );

    if(item){

        document

        .getElementById(id)

        .value =

        item.setting_value;

    }

}

/* ===========================
SAVE SETTINGS
=========================== */

document

.getElementById(

    "btn-save"

)

.addEventListener(

    "click",

    saveSettings

);

async function saveSettings(){

    const settings = [

        ["base_fare","base-fare"],
        ["price_per_km","price-per-km"],
        ["minimum_fare","minimum-fare"],
        ["driver_radius","driver-radius"],
        ["offer_timeout","offer-timeout"],

        ["minimum_topup","minimum-topup"],
        ["maximum_topup","maximum-topup"],
        ["minimum_withdraw","minimum-withdraw"],
        ["maximum_withdraw","maximum-withdraw"],

        ["platform_fee","platform-fee"],
        ["withdraw_fee","withdraw-fee"],
        ["topup_fee","topup-fee"],

        ["gps_interval","gps-interval"],
        ["auto_assign","auto-assign"],
        ["maintenance_mode","maintenance-mode"],
        ["realtime_enable","realtime-enable"]

    ];

    for(const [key,id] of settings){

        const value =

        document

        .getElementById(id)

        .value;

        await supabase

        .from("system_settings")

        .upsert({

            setting_key:key,

            setting_value:value

        },{

            onConflict:"setting_key"

        });

    }

    alert(

        "Konfigurasi berhasil disimpan."

    );

}

/* ===========================
MENU
=========================== */

document

.getElementById("btn-home")

.addEventListener(

    "click",

    ()=>{

        location.reload();

    }

);

document

.getElementById("btn-finance")

.addEventListener(

    "click",

    ()=>{

        location.href="finance-dashboard.html";

    }

);

document

.getElementById("btn-driver")

.addEventListener(

    "click",

    ()=>{

        location.href="driver-management.html";

    }

);

document

.getElementById("btn-back")

.addEventListener(

    "click",

    ()=>{

        location.href="admin-dashboard.html";

    }

);
