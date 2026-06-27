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

    await loadSummary();

    await loadWallet();

    subscribeRealtime();

}

/* ===========================
SUMMARY
=========================== */

async function loadSummary(){

    const [

        wallet,

        trx

    ] = await Promise.all([

        supabase

        .from("driver_wallets")

        .select("balance"),

        supabase

        .from("wallet_transactions")

        .select("*",{

            head:true,

            count:"exact"

        })

    ]);

    const total =

    (wallet.data || [])

    .reduce(

        (sum,row)=>

        sum + Number(row.balance || 0),

        0

    );

    document.getElementById(

        "driver-wallet-total"

    ).textContent =

    "Rp " +

    total.toLocaleString("id-ID");

    document.getElementById(

        "customer-wallet-total"

    ).textContent =

    "Coming Soon";

    document.getElementById(

        "wallet-total"

    ).textContent =

    "Rp " +

    total.toLocaleString("id-ID");

    document.getElementById(

        "transaction-total"

    ).textContent =

    trx.count || 0;

}

/* ===========================
LOAD WALLET
=========================== */

async function loadWallet(){

    const { data, error } =

    await supabase

    .from("driver_wallets")

    .select("*")

    .order(

        "balance",

        {

            ascending:false

        }

    );

    if(error){

        console.error(error);

        return;

    }

    renderWallet(

        data || []

    );

}

/* ===========================
RENDER WALLET
=========================== */

function renderWallet(data){

    const list =

    document.getElementById(

        "wallet-list"

    );

    if(data.length===0){

        list.innerHTML =

        "<p>Belum ada wallet.</p>";

        return;

    }

    list.innerHTML =

    data.map(item=>`

<div
class="promo-card wallet-item"
data-id="${item.driver_id}">

<b>

Rp ${Number(item.balance).toLocaleString("id-ID")}

</b>

<br>

Driver ID

<br>

${item.driver_id}

</div>

`).join("");

    document

    .querySelectorAll(".wallet-item")

    .forEach(el=>{

        el.onclick=()=>{

            const wallet =

            data.find(

                x=>x.driver_id===el.dataset.id

            );

            showDetail(wallet);

            loadTransactions(wallet.driver_id);

        };

    });

}

/* ===========================
DETAIL
=========================== */

function showDetail(wallet){

    if(!wallet) return;

    document.getElementById(

        "detail-driver"

    ).textContent =

    wallet.driver_id;

    document.getElementById(

        "detail-balance"

    ).textContent =

    "Rp " +

    Number(wallet.balance)

    .toLocaleString("id-ID");

    document.getElementById(

        "detail-status"

    ).textContent =

    "ACTIVE";

}

/* ===========================
TRANSACTIONS
=========================== */

async function loadTransactions(driverId){

    const { data } =

    await supabase

    .from("wallet_transactions")

    .select("*")

    .eq("driver_id",driverId)

    .order(

        "created_at",

        {

            ascending:false

        }

    )

    .limit(20);

    document.getElementById(

        "detail-total"

    ).textContent =

    data?.length || 0;

    const list =

    document.getElementById(

        "transaction-list"

    );

    if(!data || data.length===0){

        list.innerHTML =

        "<p>Belum ada transaksi.</p>";

        return;

    }

    list.innerHTML =

    data.map(item=>`

<div class="promo-card">

<b>

${item.type}

</b>

<br>

Rp ${Number(item.amount).toLocaleString("id-ID")}

<br>

${item.description ?? "-"}

</div>

`).join("");

}

/* ===========================
REALTIME
=========================== */

function subscribeRealtime(){

    supabase

    .channel("wallet-management")

    .on(

        "postgres_changes",

        {

            event:"*",

            schema:"public",

            table:"driver_wallets"

        },

        async()=>{

            await loadSummary();

            await loadWallet();

        }

    )

    .on(

        "postgres_changes",

        {

            event:"*",

            schema:"public",

            table:"wallet_transactions"

        },

        async()=>{

            await loadSummary();

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

.getElementById("btn-business")

.addEventListener(

    "click",

    ()=>{

        location.href="business.html";

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
