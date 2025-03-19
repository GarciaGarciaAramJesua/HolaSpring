document.getElementById('loginForm').onsubmit = function(event) {
    event.preventDefault();
    
    const errorMsg = document.getElementById('errorMessage');
    errorMsg.style.display = 'none';
    
    fetch(this.action, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: document.getElementById('username').value,
            password: document.getElementById('password').value
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem('token', data.token);
            window.location.replace('view/my-profile'); // Usar replace en lugar de href
        } else {
            errorMsg.style.display = 'block';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        errorMsg.style.display = 'block';
    });
};