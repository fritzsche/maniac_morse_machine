// target speed
const wpmTarget = 12;
const bpmTarget = wpmTarget * 5;
const bpmDitSpeed = 60 * 100;
const dit = bpmDitSpeed / bpmTarget / 1000;
const dah = 3 * dit;
const oscillatorFrequency = 750;
const keyShape = 0.003;
const noSound = 0.000001;

let audioCtx = new (window.AudioContext || window.webkitAudioContext)();

class Morse {
    constructor() {
        this.oscillatorFrequency = oscillatorFrequency;
        this.oscillatorType = "sine";
    }

    /**
     * @param {number} f
     */
    set frequency(f) {
        this.oscillatorFrequency = f;
    }

    /**
     * @param {string} ty
     */
    set type(ty) {
        this.oscillatorType = ty;
    }

    initialize() {
        this.ctx = audioCtx;
        this.gainNode = this.ctx.createGain();
        // set audio to 
        this.oscillator = this.ctx.createOscillator()
        this.oscillator.type = this.oscillatorType;
        this.oscillator.frequency.value = this.oscillatorFrequency;
        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.ctx.destination);
    }

    tone(time, l) {
        this.gainNode.gain.setValueAtTime(noSound, time)
        this.gainNode.gain.exponentialRampToValueAtTime(1, time + keyShape)
        time += l
        this.gainNode.gain.setValueAtTime(1, time);
        this.gainNode.gain.exponentialRampToValueAtTime(noSound, time + keyShape);
        time += keyShape;
        return time;
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
        this.initialize();
        let t = this.ctx.currentTime;
        console.log(`code: ${code}`)
        let c1 = code.replace(/\S*/g, match => match.split("").join("*"))
        // we might have spaces added around word space, remove them for correct timing
        let c = c1.replace(/\*\/\*/g, "/")
        console.log(`c: ${c}`)
        c.split("").forEach(letter => {
            switch (letter) {
                case ".":
                    t = this.tone(t, dit);
                    break;
                case "-":
                    t = this.tone(t, dah);
                    break;
                // space between each tone is 1 dit
                case "*":
                    t += dit;
                    break;
                // between character space is 3 dits (or one dah)    
                case " ":
                    t += dah
                    break;
                // space between words is 7 dits    
                case "/":
                    t += 7 * dit;
                    break;
            }
        });
        this.oscillator.start();
        this.oscillator.stop(t);
        return t;
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
        this.currentSymbol = this.getRandomSymbol();
    }
    getRandomSymbol() {
        const morse_char = 'KMURESNAPTLWI.JZ=FOY,VG5/Q92H38B?47C1D60X';

        return morse_char.charAt(this.getRandomInt(morse_char.length)).toLowerCase();
    }
    getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }
    playCurrentSymbol() {
        (new Morse()).morseText(this.currentSymbol)
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async playErrorSound() {
        let m = new Morse();
        m.frequency = 90;
        m.type = "sawtooth";
        let t =  m.morseText("i")*1000;
        await this.sleep(t);
        this.playCurrentSymbol();
    }

    processKeyInput(key) {
        let letter = key.toLowerCase();
        switch (letter) {
            case " ":
                this.playCurrentSymbol();
                break;
            default:
                if (letter === this.currentSymbol) {
                    this.currentSymbol = this.getRandomSymbol();
                    this.playCurrentSymbol()
                } else {
                    let time = this.playErrorSound();


                }
                break;
        }
    }

}

document.addEventListener("DOMContentLoaded", function (event) {
    let morse = new Morse();
    let mm = new MorseManic();
    document.getElementById("txt").addEventListener('keydown', e => mm.processKeyInput(e.key));
    document.getElementById("txt").addEventListener('keyup', e => e.target.value = "");

    // morse.morseText("CQ CQ CQ DE DJ1TF");
    //    morse.morseCode("-.. .--- .---- - ..-.")
});