(function(){
  document.addEventListener('DOMContentLoaded', () => {
    const logo = document.querySelector('.auth-logo');
    if(!logo) return;

    // Find all forms on the page (login/register)
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        // Add the authenticated class to trigger animation
        logo.classList.add('authenticated');
        
        // Keep the form submission to proceed (will navigate on success)
        // If there's a server error, the animation will complete and page will reload
        // On success, the page will redirect before animation fully completes, which is fine
      });
    });
  });
})();
