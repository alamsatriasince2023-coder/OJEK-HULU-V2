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

    await loadStatistic();

    await loadBroadcast();

    subscribeRealtime();

}

/* ===========================
STATISTIK
=========================== */

async function loadStatistic(){

    const [

        total,

        today,

        driver,

        customer

    ] = await Promise.all([

        supabase

        .from("notifications")

        .select("*",{

            head:true,

            count:"exact"

        }),

        supabase

        .from("notifications")

        .select("*",{

            head:true,

            count:"exact"

        })

        .gte(

            "created_at",

            new Date()

            .toISOString()

            .substring(0,10)

        ),

        supabase

        .from("drivers")

        .select("*",{

            head:true,

            count:"exact"

        }),

        supabase

        .from("profiles")

        .select("*",{

            head:true,

            count:"exact"

        })

        .eq("role","customer")

    ]);

    document.getElementById(

        "total-broadcast"

    ).textContent =

    total.count || 0;

    document.getElementById(

        "today-broadcast"

    ).textContent =

    today.count || 0;

    document.getElementById(

        "driver-target"

    ).textContent =

    driver.count || 0;

    document.getElementById(

        "customer-target"

    ).textContent =

    customer.count || 0;

}

/* ===========================
LOAD BROADCAST
=========================== */

async function loadBroadcast(){

    const { data, error } =

    await supabase

    .from("notifications")

    .select("*")

    .order(

        "created_at",

        {

            ascending:false

        }

    )

    .limit(30);

    if(error){

        console.error(error);

        return;

    }

    renderBroadcast(

        data || []

    );

}

/* ===========================
SEND BROADCAST
=========================== */

document

.getElementById(

    "btn-send"

)

.addEventListener(

    "click",

    sendBroadcast

);

async function sendBroadcast(){

    const payload = {

        target:

        document

        .getElementById("target")

        .value,

        title:

        document

        .getElementById("title")

        .value,

        message:

        document

        .getElementById("message")

        .value,

        status:"SENT",

        created_by:auth.profile.id

    };

    const { error } =

    await supabase

    .from("notifications")

    .insert(payload);

    if(error){

        alert(error.message);

        return;

    }

    alert("Broadcast berhasil dikirim.");

    document.getElementById("title").value="";

    document.getElementById("message").value="";

    await loadStatistic();

    await loadBroadcast();

}

/* ===========================
RENDER
=========================== */

function renderBroadcast(data){

    const list =

    document.getElementById(

        "broadcast-list"

    );

    if(data.length===0){

        list.innerHTML =

        "<p>Belum ada broadcast.</p>";

        return;

    }

    list.innerHTML =

    data.map(item=>`

<div
class="promo-card broadcast-item"
data-id="${item.id}">

<b>${item.title}</b>

<br>

📢 ${item.target}

<br>

✅ ${item.status}

<br>

<small>

${new Date(item.created_at).toLocaleString("id-ID")}

</small>

</div>

`).join("");

    document

    .querySelectorAll(".broadcast-item")

    .forEach(el=>{

        el.onclick=()=>{

            const item =

            data.find(

                x=>x.id===el.dataset.id

            );

            showDetail(item);

        };

    });

}

/* ===========================
DETAIL
=========================== */

function showDetail(item){

    if(!item) return;

    document.getElementById(

        "detail-target"

    ).textContent =

    item.target;

    document.getElementById(

        "detail-title"

    ).textContent =

    item.title;

    document.getElementById(

        "detail-status"

    ).textContent =

    item.status;

    document.getElementById(

        "detail-time"

    ).textContent =

    new Date(

        item.created_at

    ).toLocaleString("id-ID");

}

/* ===========================
REALTIME
=========================== */

function subscribeRealtime(){

    supabase

    .channel("notification-center")

    .on(

        "postgres_changes",

        {

            event:"*",

            schema:"public",

            table:"notifications"

        },

        async()=>{

            await loadStatistic();

            await loadBroadcast();

        }

    )

    .subscribe();

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

.getElementById("btn-audit")

.addEventListener(

    "click",

    ()=>{

        location.href="audit-log.html";

    }

);

document

.getElementById("btn-setting")

.addEventListener(

    "click",

    ()=>{

        location.href="system-settings.html";

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
