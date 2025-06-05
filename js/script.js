    // ### ZMIENNE POBRANE ZE STYLOW CSS ###
        const rootStyles = getComputedStyle(document.documentElement);
        const gridColor = rootStyles.getPropertyValue('--grid-color').trim();
        const labelColor = rootStyles.getPropertyValue('--label-color').trim();    
        const trajectoryColor = rootStyles.getPropertyValue('--trajectory-color').trim();    
        const ballColor = rootStyles.getPropertyValue('--ball-color').trim();   
    // ### STAŁE FIZYCZNE I KONFIGURACYJNE ### 
    // ### PHYSICS AND CONFIGURATION CONSTANTS ###
        const PHYSICS = {
            GRAVITY: 9.81,              // Przyspieszenie ziemskie w m/s² - Earth's gravitational acceleration
            DEG_TO_RAD: Math.PI / 180   // Konwersja stopni na radiany - Degrees to radians conversion
        };

        const CANVAS = {
            BASE_WIDTH: 270,            // Podstawowa szerokość canvas - Base canvas width
            BASE_HEIGHT: 140,           // Podstawowa wysokość canvas - Base canvas height  
            PADDING_TOP: 20,            // Margines Górny - Padding Top
            PADDING_BOTTOM: 30,         // Margines Dolny - Padding Bottom
            PADDING_LEFT: 35,           // Margines Lewy - Padding Left
            PADDING_RIGHT: 18,          // Margines Prawy - Padding Right
            PADDING_SIDE: 0,            // Margines LEFT I RIGHT obszaru rysowania - Padding LEFT RIGHT around drawing area
            PADDING_UPDOWN: 0,        // Margines TOP I BOTTOM obszaru rysowania - Padding around drawing area
            TRAJECTORY_STEPS: 300       // Liczba kroków do rysowania trajektorii - Number of steps for trajectory drawing
        };
             CANVAS.PADDING_SIDE = CANVAS.PADDING_LEFT + CANVAS.PADDING_RIGHT; //  PADDING LEFT + RIGHT
             CANVAS.PADDING_UPDOWN = CANVAS.PADDING_BOTTOM + CANVAS.PADDING_TOP; // PADDING TOP + BOTTOM
             
        const VISUAL = {
            GRID_SPACING_MULTIPLIER: 10,    // Mnożnik odstępów siatki - Grid spacing multiplier
            BALL_RADIUS: 5,                 // Promień kulki - Ball radius in pixels
            TRAJECTORY_WIDTH: 2,            // Grubość linii trajektorii - Trajectory line width
            GRID_WIDTH: 1                   // Grubość linii siatki - Grid line width
        };

        // ### ELEMENTY DOM ### 
        // ### DOM ELEMENTS ###
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
        const rangeMaxVal = document.getElementById("rVal");
        const vVal = document.getElementById("vVal");
        const hMaxVal = document.getElementById("hMaxVal");

        // ### ZMIENNE STANU ### 
        // ### STATE VARIABLES ###
        let scale = 4;                  // Skala rysowania - Drawing scale
        let angle = 45;                 // Kąt rzutu w stopniach - Launch angle in degrees
        let speed = 25;                 // Prędkość początkowa w m/s - Initial speed in m/s
        let time = 0;                   // Aktualny czas symulacji - Current simulation time
        let running = false;            // Czy symulacja jest uruchomiona - Is simulation running
        let paused = false;             // Czy symulacja jest wstrzymana - Is simulation paused
        let lastFrameTime = null;       // Czas ostatniej klatki animacji - Last animation frame time

        // Cache'owane obliczenia fizyczne - Cached physics calculations
        let cachedPhysics = null;

        // ### FUNKCJE OBLICZEŃ FIZYCZNYCH ###
        // ### PHYSICS CALCULATION FUNCTIONS ###
        
        /**
         * Oblicza parametry fizyczne rzutu na podstawie kąta i prędkości
         * Calculates physics parameters for projectile motion based on angle and speed
         * 
         * Wzory używane - Formulas used:
         * - vx = v₀ · cos(α) - składowa pozioma prędkości
         * - vy₀ = v₀ · sin(α) - początkowa składowa pionowa prędkości  
         * - H = vy₀² / (2g) - maksymalna wysokość
         * - T = 2vy₀ / g - całkowity czas lotu
         */
        function calculatePhysics(angleInput, speedInput) {
            const rad = angleInput * PHYSICS.DEG_TO_RAD;        // Konwersja kąta na radiany
            const vx = speedInput * Math.cos(rad);              // Składowa pozioma prędkości (stała)
            const vy0 = speedInput * Math.sin(rad);             // Początkowa składowa pionowa prędkości
            const maxHeight = (vy0 * vy0) / (2 * PHYSICS.GRAVITY);// Wzór na maksymalną wysokość
            const maxRange = (speedInput ** 2) * Math.sin(2*rad) / PHYSICS.GRAVITY  //x = (v₀² * sin(2α)) / g
            const totalTime = (2 * vy0) / PHYSICS.GRAVITY;          // Wzór na całkowity czas lotu
            
            return {
                rad,
                vx,
                vy0,
                maxHeight,
                maxRange,
                totalTime,
                initialSpeed: speedInput
            };
        }

        /*
         * Oblicza pozycję i prędkość obiektu w danym czasie
         * Calculates object position and velocity at given time
         * 
         * Wzory kinematyczne - Kinematic formulas:
         * - x(t) = vx · t - pozycja pozioma
         * - y(t) = vy₀ · t - ½gt² - pozycja pionowa  
         * - vy(t) = vy₀ - gt - prędkość pionowa
         * - v(t) = √(vx² + vy²) - prędkość chwilowa
         */
        function getPositionAtTime(physics, t) {
            const x = physics.vx * t;                                           // Pozycja pozioma
            const y = physics.vy0 * t - 0.5 * PHYSICS.GRAVITY * t * t;        // Pozycja pionowa (równanie ruchu jednostajnie przyspieszonego)
            const vy = physics.vy0 - PHYSICS.GRAVITY * t;                      // Prędkość pionowa (zmniejsza się przez grawitację)
            const currentSpeed = Math.sqrt(physics.vx * physics.vx + vy * vy); // Prędkość wypadkowa (twierdzenie Pitagorasa)
            
            return { x, y, vy, currentSpeed };
        }

        // ### FUNKCJE KONFIGURACJI CANVAS ###
        // ### CANVAS SETUP FUNCTIONS ###
        
        /*
         * Ustala skalę rysowania na podstawie szerokości okna
         * Determines drawing scale based on window width
         */
        function determineScale() {
            const width = window.innerWidth;
            scale = width < 577 ? 2 : width < 939 ? 3 : width < 1279 ? 4 : 4;
        }

        /*
         * Konfiguruje wymiary canvas
         * Sets up canvas dimensions
         */
        function setupCanvas() {
            determineScale();
            canvas.width = CANVAS.BASE_WIDTH * scale + CANVAS.PADDING_LEFT + CANVAS.PADDING_RIGHT;
            canvas.height = CANVAS.BASE_HEIGHT * scale + CANVAS.PADDING_TOP + CANVAS.PADDING_BOTTOM;
        }

        // ### FUNKCJE RYSOWANIA ###
        // ### DRAWING FUNCTIONS ###
        
        /*
         * Rysuje siatkę współrzędnych z etykietami
         * Draws coordinate grid with labels
         */
        function drawGrid() {
            const gridSpacing = scale * VISUAL.GRID_SPACING_MULTIPLIER;     // Odstęp między liniami siatki
            const labelStep = (scale >= 4) ? 10 : (scale >= 3 ? 20 : 30);  // Krok etykiet zależny od skali
            const labelOffset = 8;                            // Przesunięcie etykiet

            // Rysowanie linii siatki - Drawing grid lines
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = VISUAL.GRID_WIDTH;
            ctx.beginPath();

            // Linie pionowe - Vertical lines
            for (let x = 0; x <= canvas.width - CANVAS.PADDING_LEFT - CANVAS.PADDING_RIGHT; x += gridSpacing) {
                ctx.moveTo(CANVAS.PADDING_LEFT + x, CANVAS.PADDING_BOTTOM);
                ctx.lineTo(CANVAS.PADDING_LEFT + x, canvas.height - CANVAS.PADDING_TOP);
            }

            // Linie poziome - Horizontal lines  
            for (let y = 0; y <= canvas.height - CANVAS.PADDING_TOP - CANVAS.PADDING_BOTTOM; y += gridSpacing) {
                const py = canvas.height - CANVAS.PADDING_TOP - y;
                ctx.moveTo(CANVAS.PADDING_LEFT, py);
                ctx.lineTo(canvas.width - CANVAS.PADDING_RIGHT, py);
            }
            ctx.stroke();

            // Rysowanie etykiet - Drawing labels
            ctx.fillStyle = labelColor;
            ctx.font = `${Math.max(10, scale * 2.5)}px sans-serif`;
            
            // Etykiety osi X - X-axis labels
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            for (let x = 0; x <= canvas.width - CANVAS.PADDING_LEFT - CANVAS.PADDING_RIGHT; x += gridSpacing) {
                const val = x / scale;
                if (val % labelStep === 0) {
                    ctx.fillText(val.toFixed(0) + " m", CANVAS.PADDING_LEFT + x, canvas.height - CANVAS.PADDING_TOP + labelOffset);
                }
            }

            // Etykiety osi Y - Y-axis labels
            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            for (let y = 0; y <= canvas.height - CANVAS.PADDING_TOP - CANVAS.PADDING_BOTTOM; y += gridSpacing) {
                const val = y / scale;
                if (val % labelStep === 0) {
                    const py = canvas.height - CANVAS.PADDING_TOP - y;
                    ctx.fillText(val.toFixed(0) + " m", CANVAS.PADDING_LEFT - labelOffset, py);
                }
            }
        }

        /*
         * Rysuje trajektorię lotu i aktualną pozycję obiektu
         * Draws flight trajectory and current object position
         */
        function drawTrajectory(physics, currentTime) {
            const tMax = Math.min(currentTime, physics.totalTime);  // Ograniczenie czasu do maksymalnego czasu lotu
            
            // Rysowanie ścieżki trajektorii - Drawing trajectory path
            ctx.beginPath();
            for (let i = 0; i <= CANVAS.TRAJECTORY_STEPS; i++) {
                const t = (i / CANVAS.TRAJECTORY_STEPS) * tMax;     // Czas dla danego kroku
                const position = getPositionAtTime(physics, t);     // Pozycja w czasie t
                const px = CANVAS.PADDING_LEFT + position.x * scale;     // Konwersja na piksele X
                const py = canvas.height - CANVAS.PADDING_TOP - position.y * scale;  // Konwersja na piksele Y (odwrócona oś Y)
                
                if (i === 0) {
                    ctx.moveTo(px, py);
                } else {
                    ctx.lineTo(px, py);
                }
            }
            
            ctx.strokeStyle = trajectoryColor;                               // Kolor trajektorii - zielony
            ctx.lineWidth = VISUAL.TRAJECTORY_WIDTH;
            ctx.stroke();

            // Rysowanie aktualnej pozycji obiektu - Drawing current position ball
            const currentPosition = getPositionAtTime(physics, currentTime);
            if (currentPosition.y >= 0) {  // Rysuj tylko jeśli obiekt jest nad ziemią
                const px = CANVAS.PADDING_LEFT + currentPosition.x * scale;
                const py = canvas.height - CANVAS.PADDING_TOP - currentPosition.y * scale;
                
                ctx.beginPath();
                ctx.arc(px, py, VISUAL.BALL_RADIUS, 0, 2 * Math.PI);
                ctx.fillStyle = ballColor;                              // Kolor obiektu - czerwony
                ctx.fill();
            }
        }

        // ### FUNKCJE AKTUALIZACJI ###
        // ### UPDATE FUNCTIONS ###
        
        /**
         * Aktualizuje wyświetlane wartości w interfejsie
         * Updates displayed values in the interface
         */
        function updateDisplayValues(physics, position) {
            czasVal.textContent = time.toFixed(2);
            xVal.textContent = position.x.toFixed(2);
            yVal.textContent = position.y.toFixed(2);
            vxVal.textContent = physics.vx.toFixed(2);
            vyVal.textContent = position.vy.toFixed(2);
            RVal.textContent = physics.maxRange.toFixed(2);
            vVal.textContent = position.currentSpeed.toFixed(2);
            hMaxVal.textContent = physics.maxHeight.toFixed(2);
        }

        /**
         * Aktualizuje wartości początkowe symulacji
         * Updates initial simulation values
         */
        function updateInitialValues() {
            cachedPhysics = calculatePhysics(angle, speed);         // Oblicz fizykę dla nowych parametrów
            const initialPosition = getPositionAtTime(cachedPhysics, 0);    // Pozycja początkowa (t=0)
            
            updateDisplayValues(cachedPhysics, initialPosition);
            // Wyzeruj wartości czasowe - Reset time values
            czasVal.textContent = "0.00";
            xVal.textContent = "0.00";
            yVal.textContent = "0.00";
            vVal.textContent = cachedPhysics.initialSpeed.toFixed(2);
        }

        // ### KONTROLA SYMULACJI ###
        // ### SIMULATION CONTROL ###
        
        /**
         * Resetuje symulację do stanu początkowego
         * Resets simulation to initial state
         */
        function reset() {
            time = 0;                       // Wyzeruj czas
            running = false;                // Zatrzymaj symulację
            paused = false;                 // Usuń pauzę
            lastFrameTime = null;           // Wyzeruj czas ostatniej klatki
            
            // Wyczyść canvas i narysuj siatkę - Clear canvas and draw grid
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawGrid();
            updateInitialValues();
            
            // Aktualizuj stan przycisków - Update button states
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            stopBtn.disabled = true;
        }

        /**
         * Główna pętla animacji symulacji
         * Main simulation animation loop
         * 
         * Używa requestAnimationFrame dla płynnej animacji
         * Uses requestAnimationFrame for smooth animation
         */
        function update(timestamp) {
            if (!running) return;

            // Oblicz czas delta dla płynnej animacji niezależnej od FPS
            // Calculate delta time for smooth FPS-independent animation
            if (!lastFrameTime) lastFrameTime = timestamp;
            const deltaTime = (timestamp - lastFrameTime) / 1000;  // Konwersja na sekundy
            lastFrameTime = timestamp;
            time += deltaTime;

            // Sprawdź czy symulacja powinna się zakończyć
            // Check if simulation should end
            if (time >= cachedPhysics.totalTime) {
                time = cachedPhysics.totalTime;     // Ogranicz czas do maksymalnego
                running = false;                    // Zatrzymaj symulację
                startBtn.disabled = false;          // Włącz przycisk Start
                pauseBtn.disabled = true;           // Wyłącz przycisk Pauza
                stopBtn.disabled = true;            // Wyłącz przycisk Stop
                lastFrameTime = null;
            }

            // Oblicz aktualną pozycję obiektu - Calculate current object position
            const currentPosition = getPositionAtTime(cachedPhysics, time);

            // Aktualizuj wyświetlanie - Update display
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawGrid();                                             // Narysuj siatkę
            drawTrajectory(cachedPhysics, time);                   // Narysuj trajektorię
            updateDisplayValues(cachedPhysics, currentPosition);    // Aktualizuj wartości

            // Kontynuuj animację jeśli symulacja jest uruchomiona
            // Continue animation if simulation is running
            if (running) {
                requestAnimationFrame(update);
            }
        }

        // ### OBSŁUGA ZDARZEŃ ###
        // ### EVENT LISTENERS ###
        
        // Obsługa suwaka kąta - Angle slider handler
        angleSlider.oninput = () => {
            angle = parseFloat(angleSlider.value);
            angleVal.textContent = angle;
            reset();    // Resetuj symulację po zmianie parametru
        };

        // Obsługa suwaka prędkości - Speed slider handler
        speedSlider.oninput = () => {
            speed = parseFloat(speedSlider.value);
            speedVal.textContent = speed;
            reset();    // Resetuj symulację po zmianie parametru
        };

        // Obsługa przycisku Start - Start button handler
        startBtn.onclick = () => {
            if (!running && paused) {
                // Wznów z pauzy - Resume from pause
                running = true;
                paused = false;
                lastFrameTime = null;
            } else if (!running && !paused) {
                // Rozpocznij nową symulację - Start new simulation
                reset();
                running = true;
                lastFrameTime = null;
            }
            
            // Aktualizuj stan przycisków - Update button states
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            stopBtn.disabled = false;
            requestAnimationFrame(update);          // Rozpocznij animację
        };

        // Obsługa przycisku Pauza - Pause button handler
        pauseBtn.onclick = () => {
            running = false;        // Zatrzymaj animację
            paused = true;          // Oznacz jako wstrzymana
            startBtn.disabled = false;
            pauseBtn.disabled = true;
        };

        // Obsługa przycisku Stop - Stop button handler
        stopBtn.onclick = () => {
            reset();    // Pełny reset symulacji
        };

        // Obsługa zmiany rozmiaru okna - Window resize handler
        window.addEventListener("resize", () => {
            setupCanvas();      // Przebuduj canvas
            reset();           // Resetuj symulację
        });

        // ### INICJALIZACJA ###
        // ### INITIALIZATION ###
        setupCanvas();      // Skonfiguruj canvas
        reset();           // Zainicjalizuj symulację w stanie początkowym

