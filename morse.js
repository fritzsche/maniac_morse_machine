// target speed
const wpmTarget = 12;
const bpmTarget = wpmTarget * 5;
const bpmDitSpeed = 60 * 100;
const dit = bpmDitSpeed / bpmTarget / 1000;
const dah = 3 * dit;

const keyShape = 0.003;
const noSound = 0.000001;

class Morse {
    constructor() {
        this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        this._scheduleTime = this._ctx.currentTime;

        // set audio to 

        this._errorGain = this._ctx.createGain();
        this._errorGain.gain.value = noSound;
        this._errorGain.connect(this._ctx.destination);

        this._errorOscillator = this._ctx.createOscillator()
        this._errorOscillator.type = "sawtooth"
        this._errorOscillator.frequency.value = 100;
        this._errorOscillator.connect(this._errorGain);
        this._errorOscillator.start();

        this._gain = this._ctx.createGain();
        this._gain.gain.value = noSound;
        this._gain.connect(this._ctx.destination);

        this._oscillator = this._ctx.createOscillator()
        this._oscillator.type = "sine";
        this._oscillator.frequency.value = 750;
        this._oscillator.connect(this._gain);
        this._oscillator.start();
    }


    cancelSheduledAndMute(time) {
        this._gain.gain.cancelScheduledValues(time)
        this._oscillator.frequency.cancelScheduledValues(time)
        this._errorOscillator.frequency.cancelScheduledValues(time)
        this._gain.gain.setValueAtTime(noSound, time)
        this._errorGain.gain.setValueAtTime(noSound, time)
    }

    tone(len) {
        this.cancelSheduledAndMute(this._scheduleTime);
        this._gain.gain.exponentialRampToValueAtTime(1, this._scheduleTime + keyShape)
        this._scheduleTime += len
        this._gain.gain.setValueAtTime(1, this._scheduleTime);
        this._gain.gain.exponentialRampToValueAtTime(noSound, this._scheduleTime + keyShape);
        this._scheduleTime += keyShape;
    }

    errorSound() {
        this._scheduleTime = this._ctx.currentTime;
        this.cancelSheduledAndMute(this._scheduleTime);
        this._errorGain.gain.exponentialRampToValueAtTime(1, this._scheduleTime + keyShape)
        this._scheduleTime += keyShape
        this._scheduleTime += 0.5;
        this._errorGain.gain.setValueAtTime(1, this._scheduleTime);
        this._errorGain.gain.exponentialRampToValueAtTime(noSound, this._scheduleTime + keyShape);
        this._scheduleTime += keyShape + 0.5;
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
        //  this.initialize();
        let t = this._ctx.currentTime;
        if (this._scheduleTime < t) this._scheduleTime = t;
        console.log(`code: ${code}`)
        let c1 = code.replace(/\S*/g, match => match.split("").join("*"))
        // we might have spaces added around word space, remove them for correct timing
        let c = c1.replace(/\*\/\*/g, "/")
        console.log(`c: ${c}`)
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
        console.log(`txt: ${txt}`);
        return this.morseCode(txt);
    }
}

class MorseManic {
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
    playCurrentSymbol() {
        this._morse.morseText(this._currentSymbol)
    }

    processKeyInput(key) {
        let letter = key.toLowerCase();
        if (this._allSymbols.indexOf(letter) === -1 && letter !== " ") return;
        switch (letter) {
            case " ":
                this.playCurrentSymbol();
                break;
            default:
                if (letter === this._currentSymbol) {
                    this._currentSymbol = this.getRandomSymbol();
                    this.playCurrentSymbol()
                } else {
                    this._morse.errorSound()
                    this.playCurrentSymbol()
                }
                break;
        }
    }

}

document.addEventListener("DOMContentLoaded", function (event) {
    //    let morse = new Morse();
    let mm = new MorseManic();
    document.getElementById("txt").addEventListener('keydown', e => {
         mm.processKeyInput(e.key);
         e.preventDefault();
         return false;
        }
         );
    document.getElementById("txt").addEventListener('keyup', e => {
         e.target.value = ""; 
         e.target.focus(); 
         e.preventDefault();
         return false });

    // morse.morseText("CQ CQ CQ DE DJ1TF");
    //    morse.morseCode("-.. .--- .---- - ..-.")
});