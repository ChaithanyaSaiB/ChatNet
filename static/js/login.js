document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const username = document.querySelector('input[placeholder="Username"]').value;
        const password = document.querySelector('input[placeholder="Password"]').value;

        fetch('/user_login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Login failed');
            }
            return response.json();
        })
        .then(data => {         
            // Store user ID and username in cookies
            document.cookie = `user_id=${data.user_id}; path=/; max-age=3600`; // Cookie expires in 1 hour
            document.cookie = `username=${data.username}; path=/; max-age=3600`; // Cookie expires in 1 hour
            
            // Redirect to home page
            window.location.href = data.redirect;
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Login failed. Please check your username and password.');
        });        
    });
});
