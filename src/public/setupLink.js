document.addEventListener('DOMContentLoaded', function() {
    const homeLink = document.getElementById('homeLink');
    if (homeLink) {
        // Create a new URL object based on the current location
        const currentUrl = new URL(window.location.href);

        // Extract and modify the hostname from the URL
        let parts = currentUrl.hostname.split('.');
        if (parts.length > 2) {
            // Remove the first part (subdomain) and join back the remaining parts
            parts.shift(); // This removes the first element, e.g., 'auth' from 'auth.example.com'
        }
        const domain = parts.join('.'); // Join back the remaining parts to form 'example.com'

        // Construct the home URL by combining protocol, modified hostname, and port if present
        const homeUrl = `${currentUrl.protocol}//${domain}${currentUrl.port ? ':' + currentUrl.port : ''}/`;

        // Add click event to prevent going back
        homeLink.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default link behavior
            window.location.replace(homeUrl); // Replace the current location in the history
        });
    }
});
