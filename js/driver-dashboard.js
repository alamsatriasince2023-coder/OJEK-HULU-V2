import { supabase } from './api.js';
import {
    getCurrentUser,
    logoutUser
} from './auth.js';

const user = await getCurrentUser();

if (!user) {
    location.href = 'login.html';
}

document.getElementById('driver-name').textContent = user.email;

const orderList = document.getElementById('order-list');

async function loadOrders() {

    orderList.innerHTML = `
        <div style="padding:30px;text-align:center;">
            Memuat order...
        </div>
    `;

    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) {

        console.error(error);

        orderList.innerHTML = `
            <div style="padding:30px;text-align:center;color:red;">
                Gagal mengambil order.
            </div>
        `;

        return;
    }

    if (!data || data.length === 0) {

        orderList.innerHTML = `
            <div style="padding:30px;text-align:center;">
                Tidak ada order masuk.
            </div>
        `;

        return;
    }

    orderList.innerHTML = '';

    data.forEach(order => {

        orderList.innerHTML += `

        <div class="card" style="margin-bottom:20px;">

            <h3>${order.nama}</h3>

            <p><b>📍 Jemput</b><br>${order.jemput}</p>

            <p><b>🏁 Tujuan</b><br>${order.tujuan}</p>

            <p><b>💰 Tarif</b><br>
            Rp ${Number(order.price || 0).toLocaleString('id-ID')}</p>

            <button
                class="btn btn-green accept-btn"
                data-id="${order.id}">
                ✅ Terima Order
            </button>

        </div>

        `;

    });

    document
        .querySelectorAll('.accept-btn')
        .forEach(btn => {

            btn.addEventListener('click', acceptOrder);

        });

}

async function acceptOrder(e) {

    const orderId = e.target.dataset.id;

    e.target.disabled = true;
    e.target.innerHTML = 'Memproses...';

    const { error } = await supabase
        .from('orders')
        .update({

            status: 'accepted',

            driver_id: user.id,

            driver_name: user.email,

            accepted_at: new Date().toISOString()

        })
        .eq('id', orderId);

    if (error) {

        alert(error.message);

        e.target.disabled = false;
        e.target.innerHTML = '✅ Terima Order';

        return;
    }

    alert('Order berhasil diterima.');

    loadOrders();

}

document
.getElementById('btn-logout')
.addEventListener('click', async()=>{

    await logoutUser();

    location.href='login.html';

});

loadOrders();
