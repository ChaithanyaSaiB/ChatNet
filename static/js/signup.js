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
        fetch('/signup', {
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
            if (response.status == 400) {
                alert("Username already exists. Please choose a different username.");
                form.reset();
                throw new Error("Username already exists");
            }
            else if (response.status == 201) {
                alert("Signup successful!");  // Show the success message
                window.location.href = "/login";
            }
            else {
                alert("Signup failed. Please try again.");
                form.reset();
                throw new Error("Signup failed");
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });
});
