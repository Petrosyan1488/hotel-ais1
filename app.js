const SUPABASE_URL = "https://myratwuodgfzpmmnnzjt.supabase.co";
const SUPABASE_KEY = "sb_publishable_Ic-pUV5WjxAdXnijymzQTA_1IwRQ6Ss";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const roomsGrid = document.getElementById('rooms-grid');
const roomForm = document.getElementById('room-form');
const searchInput = document.getElementById('search-input');
const filterStatus = document.getElementById('filter-status');

async function fetchRooms() {
    // Явно указываем таблицу rooms
    let query = supabase.from('rooms').select('*').order('room_number', { ascending: true });

    const searchValue = searchInput.value.trim();
    const statusValue = filterStatus.value;

    if (searchValue) {
        query = query.ilike('room_number', `%${searchValue}%`);
    }

    if (statusValue !== 'all') {
        query = query.eq('status', statusValue);
    }

    const { data: rooms, error } = await query;

    if (error) {
        roomsGrid.innerHTML = `<p style="color:red; text-align:center;">🔴 Ошибка Supabase: ${error.message} (Код: ${error.code})</p>`;
        return;
    }

    roomsGrid.innerHTML = '';

    if (!rooms || rooms.length === 0) {
        roomsGrid.innerHTML = '<p class="loading">Номера не найдены в базе данных.</p>';
        return;
    }

    rooms.forEach(room => {
        const card = document.createElement('div');
        card.className = 'room-card';
        
        const statusClass = room.status.toLowerCase().replace(/\s+/g, '-');

        card.innerHTML = `
            <span class="room-badge status-${statusClass}">${room.status}</span>
            <h3>Номер ${room.room_number}</h3>
            <p><strong>Тип:</strong> ${room.type}</p>
            <p><strong>Цена:</strong> ${room.price_per_night} ₸ / сутки</p>
            <p><em>${room.description || 'Описание отсутствует'}</em></p>
        `;
        roomsGrid.appendChild(card);
    });
}

roomForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const roomData = {
        room_number: document.getElementById('room_number').value,
        type: document.getElementById('room_type').value,
        price_per_night: parseFloat(document.getElementById('room_price').value),
        status: document.getElementById('room_status').value,
        description: document.getElementById('room_desc').value
    };

    const { error } = await supabase.from('rooms').insert([roomData]);

    if (error) {
        alert('Ошибка добавления: ' + error.message);
    } else {
        alert('Номер успешно добавлен!');
        roomForm.reset();
        fetchRooms();
    }
});

searchInput.addEventListener('input', fetchRooms);
filterStatus.addEventListener('change', fetchRooms);

fetchRooms();
