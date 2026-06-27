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

    await loadWithdraw();

    subscribeRealtime();

}

/* ===========================
STATISTIK
=========================== */

async function loadStatistic(){

    const [

        pending,

        processing,

        success,

        rejected

    ] = await Promise.all([

        supabase

        .from("withdraw_requests")

        .select("*",{

            head:true,

            count:"exact"

        })

        .eq("status","PENDING"),

        supabase

        .from("withdraw_requests")

        .select("*",{

            head:true,

            count:"exact"

        })

        .eq("status","PROCESSING"),

        supabase

        .from("withdraw_requests")

        .select("*",{

            head:true,

            count:"exact"

        })

        .eq("status","SUCCESS"),

        supabase

        .from("withdraw_requests")

        .select("*",{

            head:true,

            count:"exact"

        })

        .eq("status","REJECTED")

    ]);

    document.getElementById(

        "pending-count"

    ).textContent =

    pending.count || 0;

    document.getElementById(

        "processing-count"

    ).textContent =

    processing.count || 0;

    document.getElementById(

        "success-count"

    ).textContent =

    success.count || 0;

    document.getElementById(

        "reject-count"

    ).textContent =

    rejected.count || 0;

}

/* ===========================
LOAD WITHDRAW
=========================== */

async function loadWithdraw(){

    const { data, error } =

    await supabase

    .from("withdraw_requests")

    .select("*")

    .order(

        "created_at",

        {

            ascending:false

        }

    )

    .limit(20);

    if(error){

        console.error(error);

        return;

    }

    renderWithdraw(data || []);

}

/* ===========================
RENDER
=========================== */

function renderWithdraw(data){

    const list =

    document.getElementById(

        "withdraw-list"

    );

    if(data.length===0){

        list.innerHTML =

        "<p>Belum ada withdraw.</p>";

        return;

    }

    list.innerHTML =

    data.map(item=>`

<div
class="promo-card withdraw-item"
data-id="${item.id}">

<b>

Rp ${Number(item.amount).toLocaleString("id-ID")}

</b>

<br>

🏦 ${item.bank_name}

<br>

📌 ${item.status}

<br>

<small>

${new Date(item.created_at)

.toLocaleString("id-ID")}

</small>

</div>

`).join("");

    document

    .querySelectorAll(

        ".withdraw-item"

    )

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

        "detail-driver"

    ).textContent =

    item.driver_id;

    document.getElementById(

        "detail-amount"

    ).textContent =

    "Rp " +

    Number(item.amount)

    .toLocaleString("id-ID");

    document.getElementById(

        "detail-bank"

    ).textContent =

    item.bank_name;

    document.getElementById(

        "detail-status"

    ).textContent =

    item.status;

}

/* ===========================
REALTIME
=========================== */

function subscribeRealtime(){

    supabase

    .channel(

        "withdraw-management"

    )

    .on(

        "postgres_changes",

        {

            event:"*",

            schema:"public",

            table:"withdraw_requests"

        },

        async()=>{

            await loadStatistic();

            await loadWithdraw();

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

.getElementById("btn-finance")

.addEventListener(

    "click",

    ()=>{

        location.href="finance-dashboard.html";

    }

);

document

.getElementById("btn-wallet")

.addEventListener(

    "click",

    ()=>{

        location.href="wallet.html";

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
