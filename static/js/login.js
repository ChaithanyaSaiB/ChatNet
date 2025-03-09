/**
 * @file This script handles user authentication by processing the login form submission.
 */

document.addEventListener('DOMContentLoaded', function() {
    /**
     * Event listener for the login form submission.
     * Handles the submission by preventing the default action, collecting user inputs,
     * sending a POST request to the '/token' endpoint, and processing the response.
     *
     * @param {Event} e - The submit event.
     */
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
            window.location.href = "/";
        })
        .catch(error => {
            console.error('Error:', error);
        }); 
    });
});
