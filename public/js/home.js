var dropdownBtns = document.querySelectorAll('.dropdown-btn');

dropdownBtns.forEach(function(btn) {
  btn.addEventListener('click', function() {
    this.classList.toggle('active');
    // Toggle the next sibling dropdown-content
    var content = this.nextElementSibling;
    content.classList.toggle('show');
  });
});

// Close dropdowns when clicking outside
window.addEventListener('click', function(event) {
  if (!event.target.matches('.dropdown-btn')) {
    var dropdowns = document.querySelectorAll('.dropdown-content');
    var buttons = document.querySelectorAll('.dropdown-btn');
    dropdowns.forEach(function(dropdown, index) {
      if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        buttons[index].classList.remove('active');
      }
    });
  }
});
