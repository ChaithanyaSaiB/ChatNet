/**
 * @file This script handles user registration by processing the signup form submission.
 */

document.addEventListener('DOMContentLoaded', function() {
    /**
     * Event listener for signup form submission.
     * @param {Event} e - The submit event
     * @description
     * - Validates password confirmation
     * - Sends POST request to '/signup' endpoint
     * - Handles success/failure responses and redirects
     */
    const form = document.querySelector('form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Get form values
        const username = document.querySelector('input[placeholder="Username"]').value;
        const password = document.querySelector('input[placeholder="Password"]').value;
        const confirmPassword = document.querySelector('input[placeholder="Confirm Password"]').value;

        // Validate password match
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        // Send registration request
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
            /**
             * Handles server response:
             * - 400: Username exists
             * - 201: Successful registration
             * - Other: General failure
             */
            if (response.status == 400) {
                alert("Username already exists. Please choose a different username.");
                form.reset();
                throw new Error("Username already exists");
            }
            else if (response.status == 201) {
                alert("Signup successful!");
                window.location.href = "/login";
            }
            else {
                alert("Signup failed. Please try again.");
                form.reset();
                throw new Error("Signup failed");
            }
        })
        .catch(error => {
            /**
             * Handles network errors and failed promises
             * @param {Error} error - The caught error object
             */
            console.error('Error:', error);
        });
    });
});
