const footer = document.getElementById('footer');

window.addEventListener('scroll', function () {
  // Get the total scrollable height and the current scroll position
  const scrollableHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolledToBottom = Math.ceil(window.scrollY) >= scrollableHeight;

  if (scrolledToBottom) {
    footer.classList.add('visible');
  } else {
    footer.classList.remove('visible');
  }
});