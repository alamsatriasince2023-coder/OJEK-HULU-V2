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

    await loadDrivers();

    subscribeRealtime();

}

/* ===========================
STATISTIK
=========================== */

async function loadStatistic(){

    const [

        total,

        online,

        offline

    ] = await Promise.all([

        supabase

        .from("drivers")

        .select("*",{

            head:true,

            count:"exact"

        }),

        supabase

        .from("drivers")

        .select("*",{

            head:true,

            count:"exact"

        })

        .eq("is_online",true),

        supabase

        .from("drivers")

        .select("*",{

            head:true,

            count:"exact"

        })

        .eq("is_online",false)

    ]);

    document.getElementById(

        "driver-total"

    ).textContent =

    total.count || 0;

    document.getElementById(

        "driver-online"

    ).textContent =

    online.count || 0;

    document.getElementById(

        "driver-offline"

    ).textContent =

    offline.count || 0;

    document.getElementById(

        "driver-active"

    ).textContent =

    online.count || 0;

}

/* ===========================
LOAD DRIVER
=========================== */

async function loadDrivers(){

    const { data, error } =

    await supabase

    .from("drivers")

    .select("*")

    .order(

        "created_at",

        {

            ascending:false

        }

    );

    if(error){

        console.error(error);

        return;

    }

    renderDrivers(

        data || []

    );

}

/* ===========================
RENDER DRIVER
=========================== */

function renderDrivers(data){

    const list =

    document.getElementById(

        "driver-list"

    );

    if(data.length===0){

        list.innerHTML =

        "<p>Belum ada driver.</p>";

        return;

    }

    list.innerHTML =

    data.map(driver=>`

<div
class="promo-card driver-item"
data-id="${driver.id}">

<b>

${driver.nama || driver.name || "Tanpa Nama"}

</b>

<br>

${driver.is_online ? "🟢 ONLINE" : "🔴 OFFLINE"}

<br>

⭐ ${Number(driver.rating || 0).toFixed(1)}

</div>

`).join("");

    document

    .querySelectorAll(".driver-item")

    .forEach(el=>{

        el.onclick=()=>{

            const driver =

            data.find(

                x=>x.id===el.dataset.id

            );

            showDetail(driver);

        };

    });

}

/* ===========================
DETAIL
=========================== */

async function showDetail(driver){

    if(!driver) return;

    document.getElementById(

        "detail-name"

    ).textContent =

    driver.nama || driver.name || "-";

    document.getElementById(

        "detail-status"

    ).textContent =

    driver.is_online ?

    "ONLINE" :

    "OFFLINE";

    document.getElementById(

        "detail-rating"

    ).textContent =

    Number(

        driver.rating || 0

    ).toFixed(1);

    const { data: wallet } =

    await supabase

    .from("driver_wallets")

    .select("balance")

    .eq("driver_id",driver.id)

    .maybeSingle();

    document.getElementById(

        "detail-wallet"

    ).textContent =

    "Rp " +

    Number(

        wallet?.balance || 0

    ).toLocaleString("id-ID");

    const { count } =

    await supabase

    .from("orders")

    .select("*",{

        head:true,

        count:"exact"

    })

    .eq("driver_id",driver.id)

    .eq("status","completed");

    document.getElementById(

        "detail-order"

    ).textContent =

    count || 0;

    const { data: income } =

    await supabase

    .from("wallet_transactions")

    .select("amount")

    .eq("driver_id",driver.id)

    .eq("type","RIDE");

    const totalIncome =

    (income || [])

    .reduce(

        (sum,row)=>

        sum + Number(row.amount || 0),

        0

    );

    document.getElementById(

        "detail-income"

    ).textContent =

    "Rp " +

    totalIncome.toLocaleString("id-ID");

}

/* ===========================
REALTIME
=========================== */

function subscribeRealtime(){

    supabase

    .channel(

        "driver-management"

    )

    .on(

        "postgres_changes",

        {

            event:"*",

            schema:"public",

            table:"drivers"

        },

        async()=>{

            await loadStatistic();

            await loadDrivers();

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

.getElementById("btn-wallet")

.addEventListener(

    "click",

    ()=>{

        location.href="wallet-management.html";

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

.getElementById("btn-back")

.addEventListener(

    "click",

    ()=>{

        location.href="admin-dashboard.html";

    }

);
