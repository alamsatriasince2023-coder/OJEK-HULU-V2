import { supabase } from "./api.js";

/* ===========================
   GET WALLET
=========================== */

export async function getWallet(driverId){

    const { data, error } =

    await supabase

    .from("driver_wallets")

    .select("*")

    .eq("driver_id", driverId)

    .single();

    if(error){

        throw error;

    }

    return data;

}

/* ===========================
   CREDIT
=========================== */

export async function credit({

    driver_id,

    amount,

    type,

    description = "",

    reference_id = null

}){

    const wallet =

    await getWallet(driver_id);

    const balance =

        Number(wallet.balance || 0)

        + Number(amount);

    const { error: walletError } =

    await supabase

    .from("driver_wallets")

    .update({

        balance: balance,

        updated_at: new Date().toISOString()

    })

    .eq("driver_id", driver_id);

    if(walletError){

        throw walletError;

    }

    const { error: trxError } =

    await supabase

    .from("wallet_transactions")

    .insert({

        driver_id,

        type,

        amount,

        balance_after: balance,

        description,

        reference_id

    });

    if(trxError){

        throw trxError;

    }

    return balance;

}

/* ===========================
   DEBIT
=========================== */

export async function debit({

    driver_id,

    amount,

    type,

    description = "",

    reference_id = null

}){

    const wallet =

    await getWallet(driver_id);

    const currentBalance =

    Number(wallet.balance || 0);

    if(currentBalance < amount){

        throw new Error(

            "Saldo tidak mencukupi."

        );

    }

    const balance =

        currentBalance

        - Number(amount);

    const { error: walletError } =

    await supabase

    .from("driver_wallets")

    .update({

        balance: balance,

        updated_at: new Date().toISOString()

    })

    .eq("driver_id", driver_id);

    if(walletError){

        throw walletError;

    }

    const { error: trxError } =

    await supabase

    .from("wallet_transactions")

    .insert({

        driver_id,

        type,

        amount: -Math.abs(amount),

        balance_after: balance,

        description,

        reference_id

    });

    if(trxError){

        throw trxError;

    }

    return balance;

}

/* ===========================
   HISTORY
=========================== */

export async function history(driver_id){

    const { data, error } =

    await supabase

    .from("wallet_transactions")

    .select("*")

    .eq("driver_id", driver_id)

    .order(

        "created_at",

        {

            ascending:false

        }

    );

    if(error){

        throw error;

    }

    return data || [];

}
