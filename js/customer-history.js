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
   ELEMENT
=========================== */

const historyList =
document.getElementById('history-list');

/* ===========================
   STATUS BADGE
=========================== */

function getStatus(status){

    switch(status){

        case 'pending':
            return '<span class="status status-pending">🟡 Menunggu Driver</span>';

        case 'accepted':
            return '<span class="status status-accepted">🟢 Driver Ditemukan</span>';

        case 'pickup':
            return '<span class="status status-pickup">📍 Driver Menuju Jemput</span>';

        case 'ontheway':
            return '<span class="status status-ontheway">🚕 Dalam Perjalanan</span>';

        case 'completed':
            return '<span class="status status-completed">✅ Selesai</span>';

        case 'cancel':
            return '<span class="status status-cancel">❌ Dibatalkan</span>';

        default:
            return status;

    }

}

/* ===========================
   LOAD HISTORY
=========================== */

async function loadHistory(){

    historyList.innerHTML = `
    <div style="text-align:center;padding:40px;">
        Memuat data...
    </div>`;

    const { data, error } =
    await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', user.id)
    .order('id',{ascending:false});

    if(error){

        console.error(error);

        historyList.innerHTML=`
        <div style="text-align:center;padding:40px;color:red;">
            Gagal mengambil data.
        </div>`;

        return;

    }

    if(!data || data.length===0){

        historyList.innerHTML=`
        <div style="text-align:center;padding:40px;">
            🚕<br><br>
            Belum ada riwayat order.
        </div>`;

        return;

    }

    historyList.innerHTML='';

    data.forEach(order=>{

        historyList.innerHTML+=`

        <div class="card" style="margin-bottom:20px;">

            <h3>${order.nama}</h3>

            <hr style="margin:10px 0;">

            <p>

            📍 Jemput

            <br>

            <b>${order.jemput}</b>

            </p>

            <p>

            🎯 Tujuan

            <br>

            <b>${order.tujuan}</b>

            </p>

            <p>

            📝 ${order.catatan || '-'}

            </p>

            <p>

            💰 Tarif

            <br>

            <b>

            Rp ${Number(order.price || 0).toLocaleString('id-ID')}

            </b>

            </p>

            <div style="margin-top:15px;">

            ${getStatus(order.status)}

            </div>

        </div>

        `;

    });

}

/* ===========================
   INIT
=========================== */

loadHistory();
