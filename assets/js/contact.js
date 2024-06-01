document.getElementById('contact-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission

    // Display the confirmation message
    document.getElementById('confirmation-message').style.display = 'block';
    
    // Optionally, you can reset the form fields after submission
    // document.getElementById('contact-form').reset();
});
