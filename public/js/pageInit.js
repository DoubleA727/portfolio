fetch("navbar.html")
.then(function (res) {
  return res.text();
})
.then(function (html) {
  document.getElementById("navbar-container").innerHTML = html;
  setActiveNav();
});

function setActiveNav() {
  var currentPage = window.location.pathname.split("/").pop();

  if (currentPage === "") {
    currentPage = "home.html";
  }

  var links = document.querySelectorAll(".nav-link");

  links.forEach(function (link) {
    if (link.dataset.page === currentPage) {
      link.classList.add("active");
      link.classList.add("goldShi");
    }
  });
}

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