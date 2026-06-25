import { supabase } from './api.js';

/* ===========================
   REGISTER
=========================== */

export async function registerUser(
    email,
    password,
    fullName,
    phone
){

    const { data, error } =
    await supabase.auth.signUp({

        email,
        password

    });

    if(error){

        return {
            data:null,
            error
        };

    }

    const user = data.user;

    if(user){

        const { error: profileError } =
        await supabase
        .from('profiles')
        .upsert({

            id: user.id,
            full_name: fullName,
            phone: phone,
            role: 'customer'

        });

        if(profileError){

            return {
                data:null,
                error:profileError
            };

        }

    }

    return {
        data,
        error:null
    };

}

/* ===========================
   REGISTER DRIVER
=========================== */

export async function registerDriver({

    full_name,
    phone,
    email,
    password,
    vehicle_type,
    vehicle_number

}){

    // Buat akun Auth
    const { data, error } =
    await supabase.auth.signUp({

        email,
        password

    });

    if(error){

        return {
            data:null,
            error
        };

    }

    const user = data.user;

    if(!user){

        return {
            data:null,
            error:{
                message:'User tidak berhasil dibuat.'
            }
        };

    }

    // Simpan ke profiles
    const { error: profileError } =
    await supabase
    .from('profiles')
    .insert({

        id:user.id,

        full_name,

        phone,

        role:'driver'

    });

    if(profileError){

        return {

            data:null,

            error:profileError

        };

    }

    // Simpan ke tabel drivers
   const { error: driverError } =
   await supabase
   .from('drivers')
   .insert({
   
       id: user.id,
   
       user_id: user.id,
   
       vehicle_type,
   
       vehicle_number,
   
       status: 'offline',
   
       is_online: false
   
   });

    if(driverError){

        return {

            data:null,

            error:driverError

        };

    }

    return {

        data,

        error:null

    };

}

/* ===========================
   LOGIN
=========================== */

export async function loginUser(
    email,
    password
){

    return await supabase.auth.signInWithPassword({

        email,
        password

    });

}

/* ===========================
   LOGOUT
=========================== */

export async function logoutUser(){

    await supabase.auth.signOut();

}

/* ===========================
   CURRENT USER
=========================== */

export async function getCurrentUser(){

    const {

        data:{ user }

    } = await supabase.auth.getUser();

    return user;

}

/* ===========================
   PROFILE
=========================== */

export async function getProfile(){

    const user =
    await getCurrentUser();

    if(!user) return null;

    const { data } =
    await supabase
    .from('profiles')
    .select('*')
    .eq('id',user.id)
    .single();

    return data;

}
