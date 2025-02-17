document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const username = document.querySelector('input[placeholder="Username"]').value;
        const password = document.querySelector('input[placeholder="Password"]').value;
        const confirmPassword = document.querySelector('input[placeholder="Confirm Password"]').value;

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        fetch('/user_signup', {
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
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Signup successful:', data);
            alert(data.message);  // Show the success message
            if (data.redirect) {
                window.location.href = data.redirect;  // Redirect to login page
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Signup failed. Please try again.');
        });
    });
});
