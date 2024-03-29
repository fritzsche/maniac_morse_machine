const keyShape = 0.004;
const noSound = 0.00001;

class Morse {
    constructor(cpm = 60, farnsworthFactor = 1, frequency = 650, volume = 1) {
        this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        this._scheduleTime = this._ctx.currentTime;
        this._frequency = frequency;
        this._volume = volume;

        // set audio to 

        this._errorGain = Morse.initGain(this._ctx);
        this._errorOscillator = Morse.initOscillator(this._ctx, "sawtooth", 100, this._errorGain);

        this._gain = Morse.initGain(this._ctx);

        this._oscillator = Morse.initOscillator(this._ctx, "sine", this._frequency, this._gain);
        this._farnsworthFactor = farnsworthFactor;
        this._cpm = cpm;

    }

    static initGain(ctx) {
        let gain = ctx.createGain();
        gain.gain.value = noSound;
        gain.connect(ctx.destination);
        return gain;
    }

    static initOscillator(ctx, type, frequency, gain) {
        let oscillator = ctx.createOscillator()
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        oscillator.connect(gain);
        oscillator.start();
        return oscillator;
    }

    set frequency(f) {
        this._frequency = f
        this._oscillator.frequency.setValueAtTime(this._frequency, 0);
    }

    set volume(v) {
        this._volume = v
    }

    static wpmToCpm(wpm) {
        return wpm * 5;
    }

    static cpmToWpm(cpm) {
        return cpm / 5;
    }

    set cpm(cpm) {
        this.cancelSheduledAndMute();
        this._cpm = cpm;
    }

    set farnsworthFactor(factor) {
        this._farnsworthFactor = factor;
    }

    _ditLength(cpm) {
        // The standard word "PARIS" has 50 units of time. 
        // .--.  .-  .-.  ..  ... ==> "PARIS"
        // 10 dit + 4 dah + 9 dit space + 4 dah space = 19 dit + 24 dit = 43 dit.
        // 43 dit + 7 dit between words results in 50 dits total time
        //
        // 100cpm (character per minute) 
        // means we need to give 20 times to word "PARIS".
        // means we give 20 times 50 units of time = 1000 units of time per minute (or 60 seconds).
        // 60 seconds devided by 1000 unit of time, means each unit (dit) takes 60ms.
        // Means at  speed of 100 cpm  a dit has 60ms length
        // length of one dit in s = ( 60ms * 100 ) / 1000        
        const cpmDitSpeed = (60 * 100) / 1000;
        return cpmDitSpeed / cpm;
    }

    _additionalPause(characterSpeed, factor) {
        let cWord = 50 * this._ditLength(characterSpeed);
        let tWord = 50 * this._ditLength(characterSpeed / factor);
        return tWord - cWord;
    }

    get _dit() {
        return this._ditLength(this._cpm);
    }


    get _dah() {
        return 3 * this._dit;
    }

    get currentTime() {
        return this._ctx.currentTime;
    }

    get latestScheduleTime() {
        return this._scheduleTime;
    }

    get _farnsworthLetterSpace() {
        if (this.farnsworthFactor <= 1) return 0;
        let pause = this._additionalPause(this._cpm, this._farnsworthFactor);
        return (pause * 3) / 19;
    }

    get _farnsworthWordSpace() {
        if (this.farnsworthFactor <= 1) return 0;
        let pause = this._additionalPause(this._cpm, this._farnsworthFactor);
        return (pause * 7) / 19;
    }

    cancelSheduledAndMute() {
        let origSchedule = this._scheduleTime;
        this._scheduleTime = this._ctx.currentTime;
        if (origSchedule >= this._scheduleTime) {
            this._scheduleTime = this._ctx.currentTime;
            this._gain.gain.cancelScheduledValues(this._scheduleTime)
            this._errorGain.gain.cancelScheduledValues(this._scheduleTime)
            this._scheduleTime += keyShape
            this._gain.gain.exponentialRampToValueAtTime(noSound, this._scheduleTime)
            this._errorGain.gain.exponentialRampToValueAtTime(noSound, this._scheduleTime)
            this._scheduleTime += 0.2;
        }
    }

    tone(len) {
        var volume = 0.9 * this._volume
        if (volume < noSound) volume = noSound
        this._gain.gain.setValueAtTime(noSound, this._scheduleTime);
        //        this._gain.gain.exponentialRampToValueAtTime(noSound, this._scheduleTime)        
        this._scheduleTime += keyShape;
        this._gain.gain.exponentialRampToValueAtTime(volume, this._scheduleTime)
        this._scheduleTime += len
        this._gain.gain.setValueAtTime(volume, this._scheduleTime);
        this._scheduleTime += keyShape;
        this._gain.gain.exponentialRampToValueAtTime(noSound, this._scheduleTime);
    }

    errorSound() {
        this.cancelSheduledAndMute();
        var volume = 0.4 * this._volume
        if (volume < noSound) volume = noSound
        this._scheduleTime += 0.3;
        this._errorGain.gain.setValueAtTime(noSound, this._scheduleTime)
        this._scheduleTime += keyShape
        this._errorGain.gain.exponentialRampToValueAtTime(volume, this._scheduleTime)
        this._scheduleTime += 0.2;
        this._errorGain.gain.setValueAtTime(volume, this._scheduleTime);
        this._scheduleTime += keyShape;
        this._errorGain.gain.exponentialRampToValueAtTime(noSound, this._scheduleTime);
        this._scheduleTime += 0.6;
        this._errorGain.gain.setValueAtTime(noSound, this._scheduleTime);
    }

    toMorse(ch) {
        const code_map = {
            a: '.-', b: '-...', c: '-.-.', d: '-..',
            e: '.', f: '..-.', g: '--.', h: '....',
            i: '..', j: '.---', k: '-.-', l: '.-..',
            m: '--', n: '-.', o: '---', p: '.--.',
            q: '--.-', r: '.-.', s: '...', t: '-',
            u: '..-', v: '...-', w: '.--', x: '-..-',
            y: '-.--', z: '--..', 1: '.----', 2: '..---',
            3: '...--', 4: '....-', 5: '.....', 6: '-....',
            7: '--...', 8: '---..', 9: '----.', 0: '-----',
            '.': '.-.-.-', ',': '--..--', '?': '..--..',
            "'": '.----.', '/': '-..-.', '(': '-.--.',
            ')': '-.--.-', '&': '.-...', ':': '---...',
            ';': '-.-.-.', '=': '-...-', '+': '.-.-.',
            '-': '-....-', '_': '..--.-', '"': '.-..-.',
            '$': '...-..-', '!': '-.-.--', '@': '.--.-.',
            ' ': '/', // seperator for words
            '#': '-.-.-', // start sign
            '~': '.-.-.' // end sign
        }
        return code_map[ch]
    }
    morseCode(code) {
        let c1 = code.replace(/\S*/g, match => match.split("").join("*"))
        // we might have spaces added around word space, remove them for correct timing
        let c = c1.replace(/\*\/\*/g, "/")
        c.split("").forEach(letter => {
            switch (letter) {
                case ".":
                    this.tone(this._dit);
                    break;
                case "-":
                    this.tone(this._dah);
                    break;
                // space between each tone is 1 dit
                case "*":
                    this._scheduleTime += this._dit;
                    break;
                // between character space is 3 dits (or one dah)    
                case " ":
                    this._scheduleTime += this._dah + this._farnsworthLetterSpace;
                    break;
                // space between words is 7 dits    
                case "/":
                    this._scheduleTime += 7 * this._dit + this._farnsworthWordSpace;
                    break;
            }
        });
    }
    morseText(text) {
        var txt = text.toLowerCase();

        //        txt = txt.trim();
        txt = txt.replace(/./g, match => this.toMorse(match) + ' ')
        txt = txt.replace(/ \/ /g, "/");
        txt = txt.trim();
        return this.morseCode(txt);
    }
}

class ManiacMorseMachine {
    constructor(cpm = 60, active = "KMURESNAPTLWI.JZ=FOY,VG5/Q92H38B?47C1D60X", frequency = 650, volume = 1) {
        this._allCharacters = active.toLowerCase();
        this._frequency = frequency;
        this.selectRandomCharacter();
        this._morse = new Morse(cpm, 1, frequency);
        this._morse.volume = volume;
    }
    selectRandomCharacter() {
        this._currentCharacter = this._allCharacters.charAt(
            this.getRandomInt(this._allCharacters.length)
        ).toLowerCase();
    }
    getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }

    stopSound() {
        this._morse.cancelSheduledAndMute();
    }

    playCurrentCharacter() {
        this._morse.farnsworthFactor = 1;
        this._morse.morseText(this._currentCharacter)
    }

    playCurrentCharacterNow() {
        this.stopSound();
        this.playCurrentCharacter()
    }

    set cpm(cpm) {
        this._morse.cpm = cpm;
    }

    set frequency(f) {
        this._morse.frequency = f;
    }

    set volume(v) {
        this._morse.volume = v;
    }

    set activeCharacter(active) {
        this.stopSound();
        this._allCharacters = active.toLowerCase();
        this.selectRandomCharacter();
    }

    processKeyInput(key) {
        if (!key) return;
        let letter = key.toLowerCase();
        if (this._allCharacters.indexOf(letter) === -1 && letter !== " ") return;
        switch (letter) {
            case " ":
                this.playCurrentCharacterNow();
                break;
            default:
                if (letter === this._currentCharacter) {
                    this.selectRandomCharacter();
                    this.playCurrentCharacterNow()
                } else {
                    this._morse.errorSound()
                    this.playCurrentCharacter()
                }
                break;
        }
    }

    getGroupOfRandom(number = 5) {
        var str = "";
        for (var i = 0; i < number; i++) {
            this.selectRandomCharacter();
            str += this._currentCharacter;
        }
        return str;
    }

    _escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    displayGroup(text) {
        document.getElementById("gof-result").innerHTML += this._escapeHtml(text.toUpperCase());
    }

    getRandomWord() {
        var number = localStorage.getItem("noChar")
        this._randomWord = this.getGroupOfRandom(number);
    }

    playRandom() {
        this.stopSound();
        if (!this._randomWord) this.getRandomWord();
        this._morse.morseText(this._randomWord);
        document.getElementById("random_next_btn").classList.remove("nodisplay");
        document.getElementById("random_btn").innerHTML = 'Repeat Word';
    }

    nextRandom() {
        this.stopSound();
        var last = this._randomWord
        document.getElementById("random_btn").innerHTML = 'Repeat Word';
        this.getRandomWord();
        document.getElementById("random_result").innerHTML = last;
        this._morse.morseText(this._randomWord);
    }

    playGroup(repeat, factor) {
        if (repeat === 0) {
            this.stopGroupOfFive();
            return;
        }
        let gof = this.getGroupOfRandom();
        this._morse.farnsworthFactor = factor;
        let startTime = this._morse.currentTime;
        this._morse.morseText(gof + " ")
        this.displayGroup(gof);
        if (repeat == 1) {
            this._morse.morseText("~")
            this.displayGroup(" <end>");
        }
        let endTime = this._morse.latestScheduleTime;

        if (repeat > 1) this.displayGroup(" ");
        let targetTime = ((endTime - startTime) * 1000) - 5;
        if (repeat >= 1) {
            this._timerId = setTimeout(() => {
                this.playGroup(repeat - 1, factor)
            }, targetTime)
        }
    }

    playGroupOfFive(repeat, factor) {
        this.stopSound();
        document.getElementById("gof-result").innerHTML = '';
        // start sign
        this._morse.morseText('# ')
        this.displayGroup("<start> ");

        this.playGroup(repeat, factor);
        //  this.stopSound() 
    }

    stopGroupOfFive() {
        clearTimeout(this._timerId);
        this.stopSound();
        document.getElementById("gof").classList.remove("nodisplay");
        document.getElementById("gof-stop").classList.add("nodisplay");
    }

}



document.addEventListener("DOMContentLoaded", function (event) {
    // the main controller is hold in mmm, but we wait to instantiate it until 
    // the first user event. This is to provide problem with chrome-autoplay protection
    var mmm = null;

    const cpmKey = "CpM";

    const getCpM = () => localStorage.getItem(cpmKey) || 60
    const getActiveChars = () => localStorage.getItem("activeChar") || "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const getFrequency = () => localStorage.getItem("frequency") || 650
    const getVolume = () => localStorage.getItem("volume") || 1
    const getNoChar = () => localStorage.getItem("noChar") || 3
    const setMorseMachine = () => {
        if (!mmm) mmm = new ManiacMorseMachine(getCpM(), getActiveChars(), getFrequency(), getVolume());
    }

    let cpMInputField = document.getElementById("cpm");

    // configuration for character per minute
    let cpm = getCpM();
    cpMInputField.value = cpm;
    cpMInputField.addEventListener('change', e => {
        let cpm = e.target.value;
        if (mmm) mmm.cpm = cpm;
        localStorage.setItem(cpmKey, cpm);
    })
    // Number of Character
    let noChar = document.getElementById("random");
    noChar.value = getNoChar()
    localStorage.setItem("noChar", getNoChar());
    noChar.addEventListener('change', e => {
        let noChar = e.target.value;
        //       if (mmm) mmm.cpm = noChar;
        localStorage.setItem("noChar", noChar);
        if (mmm) 
            mmm.getRandomWord()

    })

    let random_btn = document.getElementById("random_btn")
    random_btn.onclick = e => {
        setMorseMachine();
        mmm.playRandom();
    };

    let random_next = document.getElementById("random_next_btn")
    random_next.onclick = e => {
        setMorseMachine();
        mmm.nextRandom();
    };

    let freqInputField = document.getElementById("freq");
    freqInputField.value = getFrequency();
    freqInputField.onchange = (e => {
        let freq = e.target.value;
        if (mmm) mmm.frequency = freq;
        localStorage.setItem('frequency', freq);
    });

    let volumeInputField = document.getElementById("volume");
    volumeInputField.value = getVolume();
    volumeInputField.onchange = (e => {
        let volume = e.target.value;
        if (mmm) mmm.volume = volume;
        localStorage.setItem('volume', volume);
    });


    let morseInputField = document.getElementById("txt");
    morseInputField.focus();
    morseInputField.onkeydown = e => {
        // we can just start sound after first event
        setMorseMachine();
        mmm.processKeyInput(e.key);
        e.preventDefault();
    };
    morseInputField.onkeyup = e => {
        e.target.value = "";
        e.target.focus();
        e.preventDefault();
    };


    const updateActiveChars = (active) => {
        localStorage.setItem("activeChar", active);
        document.querySelectorAll("#chars button").forEach(
            domElement => {
                let ch = domElement.innerHTML;
                if (activeChars.indexOf(ch) === -1) domElement.removeAttribute('data-active');
                else domElement.setAttribute('data-active', 'true');
            }
        )

    }

    var activeChars = getActiveChars();
    let chars = document.getElementById("chars");
    const allCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890.,?/=";
    allCharacters.split("").forEach(letter => {
        var button = document.createElement("button");
        if (activeChars.indexOf(letter) !== -1) button.setAttribute('data-active', 'true');
        button.addEventListener('click', event => {
            let ch = event.target.innerHTML;
            if (activeChars.indexOf(ch) === -1) activeChars += ch; else activeChars = activeChars.replace(ch, "");
            updateActiveChars(activeChars);
            if (mmm) mmm.activeCharacter = activeChars;
            event.preventDefault();
        })
        var node = document.createTextNode(letter);
        button.appendChild(node);
        chars.appendChild(button);
    })

    document.getElementById("ff").value = localStorage.getItem("farnsworth-factor") || 2;
    document.getElementById("ff").onchange = e => {
        localStorage.setItem("farnsworth-factor", e.target.value);
    }

    document.getElementById("repeat").value = localStorage.getItem("group-of-five-repeat") || 10;
    document.getElementById("repeat").onchange = e => {
        localStorage.setItem("group-of-five-repeat", e.target.value);
    }

    document.getElementById("gof").onclick = e => {
        setMorseMachine();
        document.getElementById("gof").classList.add("nodisplay");
        document.getElementById("gof-stop").classList.remove("nodisplay");
        let repeat = document.getElementById("repeat").value;
        let factor = document.getElementById("ff").value;
        mmm.playGroupOfFive(repeat, factor);
    }

    document.getElementById("gof-stop").onclick = e => {
        mmm.stopGroupOfFive();
    }
    morseInputField.focus();
});