import { requireRole } from "./rbac.js";
import { supabase } from "./api.js";

const auth = await requireRole("admin");

if (!auth) {

    throw new Error("Akses ditolak");

}

let walletData = [];

init();

async function init() {

    await loadWallet();

    document
    .getElementById("search-driver")
    .addEventListener(
        "input",
        filterWallet
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

}

/* ===========================
   LOAD WALLET
=========================== */

async function loadWallet(){

    const { data, error } =

    await supabase

    .from("driver_wallets")

    .select(`
        *,
        drivers(
            full_name
        )
    `)

    .order(
        "updated_at",
        {
            ascending:false
        }
    );

    if(error){

        console.error(error);

        alert(error.message);

        return;

    }

    walletData = data || [];

    renderWallet(walletData);

}

/* ===========================
   RENDER
=========================== */

function renderWallet(data){

    const list =
    document.getElementById(
        "wallet-list"
    );

    if(data.length===0){

        list.innerHTML = `

        <div
        style="
        padding:30px;
        text-align:center;">

        Belum ada wallet.

        </div>

        `;

        document.getElementById(
            "total-driver"
        ).textContent = 0;

        document.getElementById(
            "total-wallet"
        ).textContent = "Rp 0";

        return;

    }

    let total = 0;

    list.innerHTML = "";

    data.forEach(item=>{

        total += Number(
            item.balance || 0
        );

        list.innerHTML += `

<div
class="promo-card wallet-item"
data-id="${item.driver_id}">

<b>

${item.drivers?.full_name || "Driver"}

</b>

<br><br>

💰 Saldo

<br>

<b>

Rp ${Number(item.balance || 0)
.toLocaleString("id-ID")}

</b>

</div>

`;

    });

    document.getElementById(
        "total-driver"
    ).textContent =
    data.length;

    document.getElementById(
        "total-wallet"
    ).textContent =

    "Rp " +

    total.toLocaleString("id-ID");

    bindWalletClick();

}

/* ===========================
   SEARCH
=========================== */

function filterWallet(){

    const keyword =

    document
    .getElementById(
        "search-driver"
    )

    .value

    .toLowerCase();

    const filtered =

    walletData.filter(item=>{

        return (

            item.drivers?.full_name ||

            ""

        )

        .toLowerCase()

        .includes(keyword);

    });

    renderWallet(filtered);

}

/* ===========================
   CLICK DRIVER
=========================== */

function bindWalletClick(){

    document

    .querySelectorAll(
        ".wallet-item"
    )

    .forEach(item=>{

        item.addEventListener(

            "click",

            ()=>{

                const id =

                item.dataset.id;

                loadHistory(id);

            }

        );

    });

}

/* ===========================
   HISTORY
=========================== */

async function loadHistory(driverId){

    document
    .getElementById(
        "wallet-history"
    )
    .innerHTML = `

<div
style="
padding:20px;
text-align:center;">

⏳ Memuat riwayat...

</div>

`;

    /* Sprint 6.4B */

}
