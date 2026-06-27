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

let selectedCustomer = null;

init();

async function init(){

    await loadStatistic();

    await loadCustomers();

    subscribeRealtime();

}

/* ===========================
STATISTIK
=========================== */

async function loadStatistic(){

    const [

        total,

        active,

        wallet,

        todayOrder

    ] = await Promise.all([

        supabase

        .from("profiles")

        .select("*",{

            head:true,

            count:"exact"

        })

        .eq("role","customer"),

        supabase

        .from("profiles")

        .select("*",{

            head:true,

            count:"exact"

        })

        .eq("role","customer")

        .eq("is_active",true),

        supabase

        .from("customer_wallets")

        .select("balance"),

        supabase

        .from("orders")

        .select("*",{

            head:true,

            count:"exact"

        })

        .gte(

            "created_at",

            new Date()

            .toISOString()

            .substring(0,10)

        )

    ]);

    const walletTotal =

    (wallet.data || [])

    .reduce(

        (sum,row)=>

        sum + Number(row.balance || 0),

        0

    );

    document.getElementById(

        "customer-total"

    ).textContent =

    total.count || 0;

    document.getElementById(

        "customer-active"

    ).textContent =

    active.count || 0;

    document.getElementById(

        "wallet-total"

    ).textContent =

    "Rp " +

    walletTotal.toLocaleString("id-ID");

    document.getElementById(

        "today-order"

    ).textContent =

    todayOrder.count || 0;

}

/* ===========================
LOAD CUSTOMER
=========================== */

async function loadCustomers(){

    const { data, error } =

    await supabase

    .from("profiles")

    .select("*")

    .eq("role","customer")

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

    renderCustomers(

        data || []

    );

}

/* ===========================
RENDER CUSTOMER
=========================== */

function renderCustomers(data){

    const list =

    document.getElementById(

        "customer-list"

    );

    if(data.length===0){

        list.innerHTML =

        "<p>Belum ada customer.</p>";

        return;

    }

    list.innerHTML =

    data.map(customer=>`

<div
class="promo-card customer-item"
data-id="${customer.id}">

<b>

${customer.full_name || "-"}

</b>

<br>

📧 ${customer.email || "-"}

<br>

${customer.is_active ? "🟢 ACTIVE" : "🔴 SUSPENDED"}

</div>

`).join("");

    document

    .querySelectorAll(".customer-item")

    .forEach(el=>{

        el.onclick=()=>{

            selectedCustomer =

            data.find(

                x=>x.id===el.dataset.id

            );

            showDetail(selectedCustomer);

        };

    });

}

/* ===========================
DETAIL CUSTOMER
=========================== */

async function showDetail(customer){

    if(!customer) return;

    document.getElementById(

        "detail-name"

    ).textContent =

    customer.full_name || "-";

    document.getElementById(

        "detail-status"

    ).textContent =

    customer.is_active ?

    "ACTIVE" :

    "SUSPENDED";

    document.getElementById(

        "detail-login"

    ).textContent =

    customer.last_login_at ?

    new Date(customer.last_login_at).toLocaleString("id-ID")

    :

    "-";

    const { data: wallet } =

    await supabase

    .from("customer_wallets")

    .select("balance")

    .eq("customer_id",customer.id)

    .maybeSingle();

    document.getElementById(

        "detail-wallet"

    ).textContent =

    "Rp " +

    Number(

        wallet?.balance || 0

    ).toLocaleString("id-ID");

    const { data: orders } =

    await supabase

    .from("orders")

    .select("price")

    .eq("customer_id",customer.id)

    .eq("status","completed");

    document.getElementById(

        "detail-order"

    ).textContent =

    orders?.length || 0;

    const spending =

    (orders || [])

    .reduce(

        (sum,row)=>

        sum + Number(row.price || 0),

        0

    );

    document.getElementById(

        "detail-spending"

    ).textContent =

    "Rp " +

    spending.toLocaleString("id-ID");

}

/* ===========================
SUSPEND CUSTOMER
=========================== */

document

.getElementById(

    "btn-suspend"

)

.addEventListener(

    "click",

    async()=>{

        if(!selectedCustomer) return;

        const { error } =

        await supabase

        .from("profiles")

        .update({

            is_active:false

        })

        .eq(

            "id",

            selectedCustomer.id

        );

        if(error){

            alert(error.message);

            return;

        }

        alert("Customer berhasil disuspend.");

        await loadStatistic();

        await loadCustomers();

    }

);

/* ===========================
ORDER HISTORY
=========================== */

document

.getElementById(

    "btn-history"

)

.addEventListener(

    "click",

    ()=>{

        if(!selectedCustomer){

            alert("Pilih customer terlebih dahulu.");

            return;

        }

        location.href =

        `order-management.html?customer=${selectedCustomer.id}`;

    }

);

/* ===========================
REALTIME
=========================== */

function subscribeRealtime(){

    supabase

    .channel("customer-management")

    .on(

        "postgres_changes",

        {

            event:"*",

            schema:"public",

            table:"profiles"

        },

        async()=>{

            await loadStatistic();

            await loadCustomers();

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

        location.href =

        "wallet-management.html";

    }

);

document

.getElementById("btn-driver")

.addEventListener(

    "click",

    ()=>{

        location.href =

        "driver-management.html";

    }

);

document

.getElementById("btn-back")

.addEventListener(

    "click",

    ()=>{

        location.href =

        "admin-dashboard.html";

    }

);
