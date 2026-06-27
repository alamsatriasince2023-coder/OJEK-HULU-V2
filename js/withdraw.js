import { requireRole } from "./rbac.js";
import { supabase } from "./api.js";

const auth = await requireRole("driver");

if(!auth){

    throw new Error("Akses ditolak");

}

const user = auth.user;

init();

async function init(){

    await loadWallet();

    await loadHistory();

    document
    .getElementById("btn-submit")
    .addEventListener(
        "click",
        submitWithdraw
    );

    document
    .getElementById("btn-back")
    .addEventListener(
        "click",
        ()=>{

            location.href =
            "driver-dashboard.html";

        }
    );

}

/* ===========================
   WALLET
=========================== */

async function loadWallet(){

    const { data } = await supabase

    .from("driver_wallets")

    .select("balance")

    .eq("driver_id", user.id)

    .maybeSingle();

    const balance = Number(data?.balance || 0);

    document.getElementById("wallet-balance").textContent =

        "Rp " +

        balance.toLocaleString("id-ID");

}

/* ===========================
   SUBMIT
=========================== */

async function submitWithdraw(){

    const amount = Number(

        document.getElementById(
            "withdraw-amount"
        ).value

    );

    const bank =

        document.getElementById(
            "bank-name"
        ).value;

    const account =

        document.getElementById(
            "bank-account"
        ).value;

    const owner =

        document.getElementById(
            "account-name"
        ).value;

    if(amount<=0){

        alert("Nominal tidak valid.");

        return;

    }

    const { data: wallet } = await supabase

    .from("driver_wallets")

    .select("balance")

    .eq("driver_id", user.id)

    .single();

    const balance =

        Number(wallet.balance || 0);

    if(amount > balance){

        alert("Saldo tidak cukup.");

        return;

    }

    const fee = 0;

    const receive =

        amount - fee;

    const { error } = await supabase

    .from("withdraw_requests")

    .insert({

        driver_id:user.id,

        amount,

        fee,

        receive_amount:receive,

        bank_name:bank,

        bank_account:account,

        account_name:owner,

        status:"PENDING"

    });

    if(error){

        alert(error.message);

        return;

    }

    alert("✅ Withdraw berhasil diajukan.");

    document.getElementById("withdraw-amount").value="";

    await loadHistory();

}

/* ===========================
   HISTORY
=========================== */

async function loadHistory(){

    const { data } = await supabase

    .from("withdraw_requests")

    .select("*")

    .eq("driver_id", user.id)

    .order(

        "created_at",

        {

            ascending:false

        }

    );

    const box =

    document.getElementById(

        "withdraw-history"

    );

    if(!data || data.length===0){

        box.innerHTML =

        "<p>Belum ada withdraw.</p>";

        return;

    }

    box.innerHTML =

    data.map(item=>`

<div class="promo-card">

<b>

Rp ${Number(item.amount)

.toLocaleString("id-ID")}

</b>

<br>

${item.bank_name}

<br>

${item.status}

<br>

<small>

${new Date(item.created_at)

.toLocaleString("id-ID")}

</small>

</div>

`).join("");

}
