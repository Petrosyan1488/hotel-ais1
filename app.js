const SUPABASE_URL = "https://myratwuodgfzpmmnnzjt.supabase.co";
const SUPABASE_KEY = "sb_publishable_Ic-pUV5WjxAdXnijymzQTA_1IwRQ6Ss";

// Исправленная инициализация
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const roomsGrid = document.getElementById('rooms-grid');
const roomForm = document.getElementById('room-form');
const searchInput = document.getElementById('search-input');
const filterStatus = document.getElementById('filter-status');
const googleBtn = document.getElementById('google-login-btn');
const adminPanel = document.getElementById('admin-panel');

const ADMIN_EMAIL = "твоя_почта@gmail.com"; 

async function checkUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (user) {
        if (googleBtn) {
            googleBtn.innerText = `Выйти (${user.email})`;
            googleBtn.className = "btn";
        }
        if (adminPanel) {
            adminPanel.style.display = (user.email === ADMIN_EMAIL) ? "block" : "none";
        }
    } else {
        if (googleBtn) {
            googleBtn.innerText = "Войти через Google";
            googleBtn.className = "btn google-btn";
        }
        if (adminPanel) adminPanel.style.display = "none";
    }
}

if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (user) {
            await supabaseClient.auth.signOut();
            window.location.reload();
        } else {
            const { error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.href }
            });
            if (error) alert("Ошибка входа: " + error.message);
        }
    });
}

async function fetchRooms() {
    let query = supabaseClient.from('rooms').select('*').order('room_number', { ascending: true });

    const searchValue = searchInput ? searchInput.value.trim() : "";
    const statusValue = filterStatus ? filterStatus.value : "all";

    if (searchValue) {
        query = query.ilike('room_number', `%${searchValue}%`);
    }

    if (statusValue !== 'all') {
        query = query.eq('status', statusValue);
    }

    const { data: rooms, error } = await query;

    if (error) {
        roomsGrid.innerHTML = `<p style="color:red; text-align:center;">🔴 Ошибка: ${error.message}</p>`;
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

if (roomForm) {
    roomForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user || user.email !== ADMIN_EMAIL) {
            alert("У вас нет прав администратора!");
            return;
        }

        const roomData = {
            room_number: document.getElementById('room_number').value,
            type: document.getElementById('room_type').value,
            price_per_night: parseFloat(document.getElementById('room_price').value),
            status: document.getElementById('room_status').value,
            description: document.getElementById('room_desc').value
        };

        const { error } = await supabaseClient.from('rooms').insert([roomData]);

        if (error) {
            alert('Ошибка добавления: ' + error.message);
        } else {
            alert('Номер успешно добавлен!');
            roomForm.reset();
            fetchRooms();
        }
    });
}

if (searchInput) searchInput.addEventListener('input', fetchRooms);
if (filterStatus) filterStatus.addEventListener('change', fetchRooms);

checkUser();
fetchRooms();
searchInput.addEventListener('input', fetchRooms);
filterStatus.addEventListener('change', fetchRooms);

fetchRooms();
