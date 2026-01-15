 window.onload = function() {
            const user = JSON.parse(localStorage.getItem('tazkia_session'));
            if (!user || user.role !== 'admin') { 
                window.location.href = "index.html"; 
                return; 
            }
            document.getElementById('adminName').innerText = "Assalamu'alaikum " + user.nama + "!";
        };
