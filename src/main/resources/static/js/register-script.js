document.getElementById('registerForm').onsubmit = function(event) {
    event.preventDefault();
    const errorMsg = document.getElementById('errorMessage');
    errorMsg.style.display = 'none';

    const data = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
        firstName: document.getElementById('firstname').value,
        lastName: document.getElementById('lastname').value,
        country: document.getElementById('country').value,
        role: "USER" // Valor fijo establecido como "USER"
    };

    fetch(this.action, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        console.log('Response status:', response.status);
        if (response.ok) {
            window.location.href = '/login';
        } else {
            return response.text().then(text => {
                try {
                    const errorData = JSON.parse(text);
                    console.error('Error:', errorData);
                } catch (e) {
                    console.error('Error:', text);
                }
                errorMsg.style.display = 'block';
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        errorMsg.style.display = 'block';
    });
};