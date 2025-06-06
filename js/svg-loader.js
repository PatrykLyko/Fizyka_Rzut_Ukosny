 // ### WCZYTUJE PLIKI SVG DO KODU HTML ###
 
 // Wczytaj plik SVG github-mark.svg
  fetch('./img/github-mark.svg')
    .then(response => response.text())
    .then(svgData => {
      document.getElementById('github-icon').innerHTML = svgData;
    });

      // Wczytaj plik SVG sun-moon.svg
  fetch('./img/sun-moon.svg')
    .then(response => response.text())
    .then(svgData => {
      document.getElementById('theme-toggle').innerHTML = svgData;
    });

          // Wczytaj plik SVG sun-moon.svg
  fetch('./img/logo.svg')
    .then(response => response.text())
    .then(svgData => {
      document.getElementById('logo').innerHTML = svgData;
    });