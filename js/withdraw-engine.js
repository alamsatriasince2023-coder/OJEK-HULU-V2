import { supabase } from "./api.js";
import * as wallet from "./wallet-engine.js";

/* ===========================
   REQUEST WITHDRAW
=========================== */

export async function request({

    driver_id,

    amount,

    bank_name,

    bank_account,

    account_name

}){

    /* Ambil setting */

    const { data: feeSetting } = await supabase

    .from("system_settings")

    .select("setting_value")

    .eq("setting_key","withdraw_fee")

    .maybeSingle();

    const { data: minSetting } = await supabase

    .from("system_settings")

    .select("setting_value")

    .eq("setting_key","minimum_withdraw")

    .maybeSingle();

    const { data: maxSetting } = await supabase

    .from("system_settings")

    .select("setting_value")

    .eq("setting_key","maximum_withdraw")

    .maybeSingle();

    const fee = Number(feeSetting?.setting_value || 0);

    const minimum = Number(minSetting?.setting_value || 50000);

    const maximum = Number(maxSetting?.setting_value || 5000000);

    if(amount < minimum){

        throw new Error(`Minimum withdraw Rp ${minimum.toLocaleString("id-ID")}`);

    }

    if(amount > maximum){

        throw new Error(`Maximum withdraw Rp ${maximum.toLocaleString("id-ID")}`);

    }

    const receive = amount - fee;

    if(receive <= 0){

        throw new Error("Nominal diterima tidak valid.");

    }

    /* Cek saldo */

    const walletInfo = await wallet.getWallet(driver_id);

    if(Number(walletInfo.balance) < amount){

        throw new Error("Saldo tidak mencukupi.");

    }

    /* Simpan request */

    const { data, error } = await supabase

    .from("withdraw_requests")

    .insert({

        driver_id,

        amount,

        fee,

        receive_amount: receive,

        bank_name,

        bank_account,

        account_name,

        status:"PENDING"

    })

    .select()

    .single();

    if(error){

        throw error;

    }

    return data;

}

/* ===========================
   APPROVE
=========================== */

export async function approve(id){

    return await supabase

    .from("withdraw_requests")

    .update({

        status:"PROCESSING",

        updated_at:new Date().toISOString()

    })

    .eq("id",id);

}

/* ===========================
   SUCCESS
=========================== */

export async function complete(request){

    await wallet.debit({

        driver_id:request.driver_id,

        amount:Number(request.amount),

        type:"WITHDRAW",

        description:"Withdraw",

        reference_id:request.id

    });

    return await supabase

    .from("withdraw_requests")

    .update({

        status:"SUCCESS",

        processed_at:new Date().toISOString(),

        updated_at:new Date().toISOString()

    })

    .eq("id",request.id);

}

/* ===========================
   REJECT
=========================== */

export async function reject(id, notes=""){

    return await supabase

    .from("withdraw_requests")

    .update({

        status:"REJECTED",

        notes,

        updated_at:new Date().toISOString()

    })

    .eq("id",id);

}
