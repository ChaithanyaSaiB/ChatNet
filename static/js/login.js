// function setCookie(name, value, minutes) {
//     const date = new Date();
//     date.setTime(date.getTime() + (minutes * 60 * 1000)); // Add expiration time in minutes
//     const expires = "expires=" + date.toUTCString(); // Convert to UTC string format

//     // Set the cookie
//     document.cookie = `${name}=${value};${expires};path=/`;
// }

document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const username = document.querySelector('input[placeholder="Username"]').value;
        const password = document.querySelector('input[placeholder="Password"]').value;

        fetch('/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                username: username,
                password: password
            })
        })
        .then(response => {
            if (response.status == 401) {
                alert("Incorrect username or password. Please try again.");
                form.reset();
                throw new Error("Incorrect username or password");
            }
            else if (response.status == 200) {
                return response.json();
            }
            else
            {
                alert("Login failed. Please try again.");
                form.reset();
                throw new Error("Login failed");
            }
        })
        .then(data => {
            // setCookie("access_token", data.access_token, 30);  // Store token
            window.location.href = "/";  // Redirect to dashboard
        })
        .catch(error => {
            console.error('Error:', error);
        }); 
    });
});
