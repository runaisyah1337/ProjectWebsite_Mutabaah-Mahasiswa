async function prosesLogin() {
    const userInput = document.getElementById('userInput').value;
    const passInput = document.getElementById('passInput').value;

    try {
        const response = await fetch('https://extensive-essy-mutabaahmahasiswa-1ba513c9.koyeb.app/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                identifier: userInput, 
                password: passInput 
            })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('tazkia_session', JSON.stringify(data.user));
            
            alert('Login Berhasil sebagai ' + data.user.role);

            if (data.user.role === 'pembina') {
                window.location.href = 'dashboardpembina.html';
            } else if (data.user.role === 'admin') {
                window.location.href = 'dashboardadmin.html';
            } else {
                window.location.href = 'dashboardmahasiswa.html';
            }
        } else {
            // REVISI: Logika pesan error spesifik
            if (data.message === "User tidak ditemukan") {
                // Jika input diawali '08', anggap No HP, jika tidak anggap NIM
                if (userInput.startsWith('08')) {
                    alert("No HP salah atau tidak terdaftar!");
                } else {
                    alert("NIM salah atau tidak terdaftar!");
                }
            } else {
                alert(data.message);
            }
        }
    } catch (error) {
        console.error("Error Detail:", error);
        alert("Gagal terhubung ke server!");
    }
}

async function prosesDaftar() {
    const nama = document.getElementById('namaInput').value;
    const nim = document.getElementById('nimInput').value;
    const password = document.getElementById('passInput').value;

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nama, nim, password, role: 'mahasiswa' })
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            window.location.href = 'index.html'; 
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert("Gagal terhubung ke server.");
    }
}