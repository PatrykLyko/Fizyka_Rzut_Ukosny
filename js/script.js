        // ### UCHWYTY DO HTML ###
        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");
        const angleSlider = document.getElementById("angle");
        const speedSlider = document.getElementById("speed");
        const angleVal = document.getElementById("angleVal");
        const speedVal = document.getElementById("speedVal");
        const startBtn = document.getElementById("startBtn");
        const pauseBtn = document.getElementById("pauseBtn");
        const stopBtn = document.getElementById("stopBtn");
        const czasVal = document.getElementById("czasVal");
        const xVal = document.getElementById("xVal");
        const yVal = document.getElementById("yVal");
        const vxVal = document.getElementById("vxVal");
        const vyVal = document.getElementById("vyVal");
        const v0Val = document.getElementById("v0Val");
        const vVal = document.getElementById("vVal");
        const hMaxVal = document.getElementById("hMaxVal");

        // ### ZMIENNE ###

        // Stałe Fizyczne
        const g = 9.81;

        // Parametry wizualne
        const padding = 70;
        let scale = 4;

        // Parametry wejscia
        let angle = 45;
        let speed = 30;

        // Stan Symulacji
        let time = 0;
        let running = false;
        let paused = false;
        let lastFrameTime = null; // timestamp ostatniej klatki

        // ### FUNKCJE ###

        // Dynamiczne ustalanie skali w zależności od szerokości okna
        function determineScale() {
            const width = window.innerWidth;
            scale = width < 800 ? 2 : width < 1100 ? 3 : 4;
        } 


        // Ustawienie wymiarów canvas na podstawie skali i paddingu
        function setupCanvas() {
            determineScale();
            canvas.width = 270 * scale + padding * 2;
            canvas.height = 140 * scale + padding * 2;

}
        
            
        // Obliczanie i wyświetlanie danych początkowych w panelu wyników
        function updateInitialValues() {
            const rad = angle * Math.PI / 180; // zamiana stopni na radiany
            const vx = speed * Math.cos(rad); // vx = v0 * cos(α) ---- trygonometria
            const vy0 = speed * Math.sin(rad); // vy0 = v0 * sin(α) ---- trygonometria

            v0Val.textContent = speed.toFixed(2);
            hMaxVal.textContent = ((vy0 * vy0) / (2 * g)).toFixed(2); // wzor na max wysokosc
            czasVal.textContent = "0.00";
            xVal.textContent = "0.00";
            yVal.textContent = "0.00";
            vxVal.textContent = vx.toFixed(2);
            vyVal.textContent = vy0.toFixed(2);
            vVal.textContent = "0.00";
        }
        // Reset symulacji: czas, stan, ekran, siatka i dane początkowe
        function reset() {
            time = 0;
            running = false;
            paused = false;
            lastFrameTime = null;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawGrid();
            updateInitialValues();
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            stopBtn.disabled = true;
        }
        // Rysowanie siatki pomocniczej oraz oznaczeń metrowych osi X i Y
        function drawGrid() {
            const gridSpacing = scale * 10;
            const labelStep = (scale >= 4) ? 10 : (scale >= 3 ? 20 : 30);
            const labelOffset = 10 + scale * 2;

            //siatka
            ctx.strokeStyle = "#333";
            ctx.lineWidth = 1;
            ctx.beginPath();

            for (let x = 0; x <= canvas.width - padding * 2; x += gridSpacing) {
                ctx.moveTo(padding + x, padding);
                ctx.lineTo(padding + x, canvas.height - padding);
            }

            for (let y = 0; y <= canvas.height - padding * 2; y += gridSpacing) {
                const py = canvas.height - padding - y;
                ctx.moveTo(padding, py);
                ctx.lineTo(canvas.width - padding, py);
            }
            //labelki
            ctx.stroke();
            ctx.fillStyle = "#888";
            ctx.font = "10px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";

            for (let x = 0; x <= canvas.width - padding * 2; x += gridSpacing) {
                const val = x / scale;
                if (val % labelStep === 0) {
                    ctx.fillText(val.toFixed(0) + " m", padding + x, canvas.height - padding + 4);
                }
            }

            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            for (let y = 0; y <= canvas.height - padding * 2; y += gridSpacing) {
                const val = y / scale;
                if (val % labelStep === 0) {
                    const py = canvas.height - padding - y;
                    ctx.fillText(val.toFixed(0) + " m", padding - labelOffset, py);
                }
            }
        }
        // Rysowanie trajektorii lotu i aktualnej pozycji obiektu
        function drawTrajectory(time) {
            const rad = angle * Math.PI / 180; // zamiana stopni na radiany
            const vx = speed * Math.cos(rad); // vx = v0 * cos(α) ---- trygonometria
            const vy0 = speed * Math.sin(rad); // vy0 = v0 * sin(α) ---- trygonometria
            const totalTime = (2 * vy0) / g; // czas wznoszenia to vy0 / g  ---- * 2 to czas calkowity
            const tMax = Math.min(time, totalTime);
            const steps = 300;

            ctx.beginPath();
            for (let i = 0; i <= steps; i++) {
                const t = (i / steps) * tMax;
                const x = vx * t;
                const y = vy0 * t - 0.5 * g * t * t;
                const px = padding + x * scale;
                const py = canvas.height - padding - y * scale;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }

            ctx.strokeStyle = "lime";
            ctx.lineWidth = 2;
            ctx.stroke();

            const x = vx * time;
            const y = vy0 * time - 0.5 * g * time * time;
            if (y >= 0) {
                const px = padding + x * scale;
                const py = canvas.height - padding - y * scale;
                ctx.beginPath();
                ctx.arc(px, py, 5, 0, 2 * Math.PI);
                ctx.fillStyle = "red";
                ctx.fill();
            }
        }
        // Główna pętla animacji: obliczenia fizyczne, rysowanie i aktualizacja wyników
        function update(timestamp) {
            if (!running) return;

            if (!lastFrameTime) lastFrameTime = timestamp;
            const deltaTime = (timestamp - lastFrameTime) / 1000;
            lastFrameTime = timestamp;
            time += deltaTime;

            const rad = angle * Math.PI / 180;     // zamiana stopni na radiany
            const vx = speed * Math.cos(rad);		// vx = v0 * cos(α) ---- trygonometria
            const vy0 = speed * Math.sin(rad);		// vy0 = v0 * sin(α) ---- trygonometria
            const totalTime = (2 * vy0) / g;		// czas wznoszenia to vy0 / g  ---- * 2 to czas calkowity

            if (time >= totalTime) {
                time = totalTime;
                running = false;
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                stopBtn.disabled = true;
                lastFrameTime = null;
            }

            const x = vx * time;			// s = v*t  bo ruch jednostajny	
            const y = vy0 * time - 0.5 * g * time * time;		 //  wzor na pozycje w czasie w ruchu jednostajnie opoznionym
            const vy = vy0 - g * time;  	// wzor na predkosc w ruchu jednostajnie opoznionym
            const v = Math.sqrt(vx * vx + vy * vy); // wzor na predkosc ruchu w dowolnej chwili z wykorzystaniem skladowych vx i vy

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawGrid();
            drawTrajectory(time);

            czasVal.textContent = time.toFixed(2);
            xVal.textContent = x.toFixed(2);
            yVal.textContent = y.toFixed(2);
            vxVal.textContent = vx.toFixed(2);
            vyVal.textContent = vy.toFixed(2);
            vVal.textContent = v.toFixed(2);

            if (running) requestAnimationFrame(update);
        }
        // Obsługa zmiany kąta i prędkości z suwaków
        angleSlider.oninput = () => {
            angle = parseFloat(angleSlider.value);
            angleVal.textContent = angle;
            reset();
        };

        speedSlider.oninput = () => {
            speed = parseFloat(speedSlider.value);
            speedVal.textContent = speed;
            reset();
        };
        // Obsługa przycisków Start / Pauza / Stop i przełączanie stanów symulacji
        startBtn.onclick = () => {
            if (!running && paused) {
                running = true;
                paused = false;
                lastFrameTime = null;
                startBtn.disabled = true;
                pauseBtn.disabled = false;
                stopBtn.disabled = false;
                requestAnimationFrame(update);
            } else if (!running && !paused) {
                reset();
                running = true;
                lastFrameTime = null;
                startBtn.disabled = true;
                pauseBtn.disabled = false;
                stopBtn.disabled = false;
                requestAnimationFrame(update);
            }
        };

        pauseBtn.onclick = () => {
            running = false;
            paused = true;
            startBtn.disabled = false;
            pauseBtn.disabled = true;
        };

        stopBtn.onclick = () => {
            reset();
        };
        // Nasluchiwanie zmiany rozmiaru okna – przerysowanie siatki
        window.addEventListener("resize", () => {
            setupCanvas();
          //  drawGrid();
          reset();
        });

        // Inicjalizacja: konfiguracja canvas i wyświetlenie danych startowych
        setupCanvas();
        reset();