import { supabase } from './api.js';
import { requireRole } from './rbac.js';

/* ===========================
   AUTH
=========================== */

const auth = await requireRole('customer');

if (!auth) {

    throw new Error('Akses ditolak');

}

const user = auth.user;

/* ===========================
   FORM
=========================== */

const form =
document.getElementById('order-form');

form.addEventListener('submit', submitOrder);

async function submitOrder(e){

    e.preventDefault();

    const pickup =
    document.getElementById('pickup').value.trim();

    const destination =
    document.getElementById('destination').value.trim();

    const notes =
    document.getElementById('notes').value.trim();

    if(!pickup || !destination){

        alert('Lokasi wajib diisi.');

        return;

    }

    const btn =
    form.querySelector('button[type="submit"]');

    btn.disabled = true;

    btn.innerHTML = 'Mengirim...';

    const { data, error } =
    await supabase
    .from('orders')
    .insert({

        customer_id: user.id,

        nama: auth.profile.full_name || user.email,

        jemput: pickup,

        tujuan: destination,

        catatan: notes,

        status: 'pending'

    })
    .select()
    .single();

    btn.disabled = false;

    btn.innerHTML = '🚕 Pesan Sekarang';

    if(error){

        alert(error.message);

        return;

    }

    location.href =
    `order-status.html?id=${data.id}`;

}
