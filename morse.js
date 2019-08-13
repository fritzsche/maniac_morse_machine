const keyShape = 0.004;
const noSound = 0.0001;

class Morse {
    constructor(cpm = 60) {
        this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        this._scheduleTime = this._ctx.currentTime;
        // set audio to 

        this._errorGain = Morse.initGain(this._ctx);
        this._errorOscillator = Morse.initOscillator(this._ctx, "sawtooth", 100, this._errorGain);

        this._gain = Morse.initGain(this._ctx);
        this._oscillator = Morse.initOscillator(this._ctx, "sine", 750, this._gain);

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

    get _dit() {
        // The standard word "PARIS" has 50 units of time. 100cpm (character per minute) 
        // means we need to give 20 times to word "PARIS".
        // means we give 20 times 50 units of time = 1000 units of time per minute (or 60 seconds).
        // 60 seconds devided by 1000 unit of time, means each unit (dit) takes 60ms.
        // Means at  speed of 100 cpm  a dit has 60ms length
        // length of one dit in s = ( 60ms * 100 ) / 1000
        const cpmDitSpeed = (60 * 100) / 1000;
        return cpmDitSpeed / this._cpm;
    }


    get _dah() {
        return 3 * this._dit;
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
        this._gain.gain.setValueAtTime(noSound, this._scheduleTime);
        this._scheduleTime += keyShape;
        this._gain.gain.exponentialRampToValueAtTime(1, this._scheduleTime)
        this._scheduleTime += len
        this._gain.gain.setValueAtTime(1, this._scheduleTime);
        this._scheduleTime += keyShape;
        this._gain.gain.exponentialRampToValueAtTime(noSound, this._scheduleTime);
    }

    errorSound() {
        this.cancelSheduledAndMute();

        this._scheduleTime += 0.3;
        this._errorGain.gain.setValueAtTime(noSound, this._scheduleTime)
        this._scheduleTime += keyShape
        this._errorGain.gain.exponentialRampToValueAtTime(1, this._scheduleTime)
        this._scheduleTime += 0.2;
        this._errorGain.gain.setValueAtTime(1, this._scheduleTime);
        this._scheduleTime += keyShape;
        this._errorGain.gain.exponentialRampToValueAtTime(noSound, this._scheduleTime);
        this._scheduleTime += 0.3;
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
            ' ': '/',
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
                    this._scheduleTime += this._dah
                    break;
                // space between words is 7 dits    
                case "/":
                    this._scheduleTime += 7 * this._dit;
                    break;
            }
        });
    }
    morseText(text) {
        var txt = text.toLowerCase();

        txt.trim();
        txt = txt.replace(/./g, match => this.toMorse(match) + ' ')
        txt = txt.replace(/ \/ /g, "/");
        txt.trim();
        return this.morseCode(txt);
    }
}

class ManiacMorseMachine {
    constructor(cpm = 60, active = "KMURESNAPTLWI.JZ=FOY,VG5/Q92H38B?47C1D60X") {
        this._allCharacters = active.toLowerCase();
        this.selectRandomCharacter();
        this._morse = new Morse(cpm);
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
        this._morse.morseText(this._currentCharacter)
    }

    playCurrentCharacterNow() {
        this.stopSound();
        this.playCurrentCharacter()
    }

    set cpm(cpm) {
        this._morse.cpm = cpm;
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

}



document.addEventListener("DOMContentLoaded", function (event) {
    // the main controller is hold in mmm, but we wait to instantiate it until 
    // the first user event. This is to provide problem with chrome-autoplay protection
    var mmm = null;

    const cpmKey = "CpM";

    const getCpM = () => localStorage.getItem(cpmKey) || 60
    const getActiveChars = () => localStorage.getItem("activeChar") || "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    let cpMInputField = document.getElementById("cpm");

    // configuration for character per minute
    let cpm = getCpM();
    cpMInputField.value = cpm;
    cpMInputField.addEventListener('change', e => {
        let cpm = e.target.value;
        if (mmm) mmm.cpm = cpm;
        localStorage.setItem(cpmKey, cpm);
    })


    let morseInputField = document.getElementById("txt");
    morseInputField.focus();
    morseInputField.addEventListener('keydown', e => {
        // we can just start sound after first event
        if (!mmm) mmm = new ManiacMorseMachine(getCpM(), getActiveChars());
        mmm.processKeyInput(e.key);
        e.preventDefault();
    }
    );
    morseInputField.addEventListener('keyup', e => {
        e.target.value = "";
        e.target.focus();
        e.preventDefault();
    });


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
    const allCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890.,?/";
    allCharacters.split("").forEach(letter => {
        var button = document.createElement("button");
        if (activeChars.indexOf(letter) !== -1) button.setAttribute('data-active', 'true');
        button.addEventListener('click', event => {
            let ch = event.target.innerHTML;
            if (activeChars.indexOf(ch) === -1) activeChars += ch; else activeChars = activeChars.replace(ch, "");
            updateActiveChars(activeChars);
            if(mmm) mmm.activeCharacter = activeChars;
         //   document.getElementById("txt").focus();
            event.preventDefault();
        })
        var node = document.createTextNode(letter);
        button.appendChild(node);
        chars.appendChild(button);
    })
    morseInputField.focus();

});