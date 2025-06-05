
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("theme-toggle");
  const body = document.body;

  let isMoon = true;        // true = ikona w stanie księżyca
  let inTransition = false; // blokada na czas animacji
  const savedTheme = localStorage.getItem("theme");

  // 🌞 Jeśli był zapisany light-mode → nie dodawaj klas księżyca
  if (savedTheme === "light") {
    body.classList.add("light-theme");
    isMoon = false; // ikona słońca – nie księżyc
  } else {
    // domyślnie księżyc
    btn.classList.add("rays-hidden", "circle-expanded", "cut-active");
    isMoon = true;
  }
  // Jeśli body nie ma light-theme (czyli dark od startu), 
  // dodajemy od razu klasy, które postawią ikonę w pozycji "księżyca":
  btn.classList.add("rays-hidden", "circle-expanded", "cut-active");

  btn.addEventListener("click", () => {
    if (inTransition) return;
    inTransition = true;

    if (!isMoon) {
      // ### aktualnie słońce → chcemy przejść do księżyca ###

      // 1) schowaj promienie (0–300ms)
      btn.classList.add("rays-hidden");

      // 2) po 300ms: powiększ koło i od razu usuń light-theme (tło → ciemne)
      setTimeout(() => {
        btn.classList.add("circle-expanded");
        body.classList.remove("light-theme");
        localStorage.setItem("theme", "dark"); // + zapis motywu
      }, 300);

      // 3) po 800ms: wjedź maska (0.5s → 800–1300ms)
      setTimeout(() => {
        btn.classList.add("cut-active");
        setTimeout(() => {
          inTransition = false;
          isMoon = true;
        }, 500);
      }, 800);

    } else {
      // ### aktualnie księżyc → chcemy przejść do słońca ###

      // 1) usuń cut-active (0–500ms): maska wraca poza widok
      btn.classList.remove("cut-active");

      // 2) po 500ms: pomniejsz koło i jednocześnie włącz light-theme (tło → jasne)
      setTimeout(() => {
        btn.classList.remove("circle-expanded");
        body.classList.add("light-theme");
        localStorage.setItem("theme", "light");
      }, 500);

      // 3) po 1000ms: pokaż promienie (1000–1300ms)
      setTimeout(() => {
        btn.classList.remove("rays-hidden");
        setTimeout(() => {
          inTransition = false;
          isMoon = false;
        }, 300);
      }, 1000);
    }
  });
});
