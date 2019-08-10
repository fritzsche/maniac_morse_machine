// at a speed of 100 cpm (character per minute) a dit has 60ms length
// length of one dit in s = ( 60ms * 100 ) / 1000
const cpmDitSpeed = ( 60 * 100 ) / 1000;


const keyShape = 0.004;
const noSound = 0.0001;

// target in cpm (character per minute)
const cpmTarget = 60;

const dit = cpmDitSpeed / cpmTarget;

// a dah is 3 times the time of a dit
const dah = 3 * dit;



class Morse {
    constructor() {
        this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        this._scheduleTime = this._ctx.currentTime;
        // set audio to 

        this._errorGain = Morse.initGain(this._ctx);
        this._errorOscillator = Morse.initOscillator(this._ctx,"sawtooth",100,this._errorGain);

        this._gain = Morse.initGain(this._ctx);       
        this._oscillator = Morse.initOscillator(this._ctx,"sine",750,this._gain);
    }

    static initGain(ctx) {
        let gain = ctx.createGain();
        gain.gain.value = noSound;
        gain.connect(ctx.destination);
        return gain;
    }

    static initOscillator(ctx,type,frequency,gain) {
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
        this._scheduleTime += 0.2;
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
                    this.tone(dit);
                    break;
                case "-":
                    this.tone(dah);
                    break;
                // space between each tone is 1 dit
                case "*":
                    this._scheduleTime += dit;
                    break;
                // between character space is 3 dits (or one dah)    
                case " ":
                    this._scheduleTime += dah
                    break;
                // space between words is 7 dits    
                case "/":
                    this._scheduleTime += 7 * dit;
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
    constructor() {
        this._allSymbols = "KMURESNAPTLWI.JZ=FOY,VG5/Q92H38B?47C1D60X".toLowerCase();
        this._currentSymbol = this.getRandomSymbol();
        this._morse = new Morse();
    }
    getRandomSymbol() {
        return this._allSymbols.charAt(
            this.getRandomInt(this._allSymbols.length)
        ).toLowerCase();
    }
    getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }
    playCurrentCharacter() {
        this._morse.morseText(this._currentSymbol)
    }

    playCurrentCharacterNow() {
        this._morse.cancelSheduledAndMute();
        this.playCurrentCharacter()
    }

    processKeyInput(key) {
        if (!key) return;
        let letter = key.toLowerCase();
        if (this._allSymbols.indexOf(letter) === -1 && letter !== " ") return;
        switch (letter) {
            case " ":
                this.playCurrentCharacterNow();
                break;
            default:
                if (letter === this._currentSymbol) {
                    this._currentSymbol = this.getRandomSymbol();
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
    var mmm = null;
    let formElement = document.getElementById("txt");
    formElement.focus();
    formElement.addEventListener('keydown', e => {
        // we can just start sound after first event
        if (!mmm) mmm = new ManiacMorseMachine();
        mmm.processKeyInput(e.key);
        e.preventDefault();
        return false;
    }
    );
    formElement.addEventListener('keyup', e => {
        e.target.value = "";
        e.target.focus();
        e.preventDefault();
        return false
    });
});