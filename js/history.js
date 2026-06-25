import { supabase } from './api.js';
import { getCurrentUser } from './auth.js';

const user = await getCurrentUser();

if (!user) {
    location.href = 'login.html';
}

const historyList = document.getElementById('history-list');

function getStatus(status) {

    switch (status) {

        case 'pending':
            return '<span class="status status-pending">Pending</span>';

        case 'accepted':
            return '<span class="status status-accepted">Driver Ditemukan</span>';

        case 'pickup':
            return '<span class="status status-pickup">Menuju Jemput</span>';

        case 'ontheway':
            return '<span class="status status-ontheway">Dalam Perjalanan</span>';

        case 'completed':
            return '<span class="status status-completed">Selesai</span>';

        case 'cancel':
            return '<span class="status status-cancel">Dibatalkan</span>';

        default:
            return `<span>${status}</span>`;
    }

}

async function loadHistory() {

    historyList.innerHTML = `
        <div style="text-align:center;padding:40px;">
            Memuat data...
        </div>
    `;

    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user.id)
        .order('id', { ascending: false });

    if (error) {

        console.error(error);

        historyList.innerHTML = `
            <div style="text-align:center;padding:40px;color:red;">
                Gagal mengambil data.
            </div>
        `;

        return;
    }

    if (!data || data.length === 0) {

        historyList.innerHTML = `
            <div style="text-align:center;padding:50px;">
                🚕<br><br>
                Belum ada riwayat perjalanan.
            </div>
        `;

        return;
    }

    historyList.innerHTML = '';

    data.forEach(order => {

        historyList.innerHTML += `
            <div class="card" style="margin-bottom:20px;">

                <h3>${order.nama}</h3>

                <hr style="margin:12px 0;">

                <p>
                    🟢 Jemput<br>
                    <b>${order.jemput}</b>
                </p>

                <p style="margin-top:10px;">
                    🔴 Tujuan<br>
                    <b>${order.tujuan}</b>
                </p>

                <p style="margin-top:10px;">
                    📝 ${order.catatan || '-'}
                </p>

                <div style="margin-top:15px;">
                    ${getStatus(order.status)}
                </div>

            </div>
        `;

    });

}

loadHistory();
