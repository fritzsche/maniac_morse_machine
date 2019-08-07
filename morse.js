
// target speed
const wpmTarget = 12;
const bpmTarget = wpmTarget * 5;
const bpmDitSpeed = 60 * 100;
const dit = bpmDitSpeed / bpmTarget / 1000;
const dah = 3 * dit;
const oscillatorFrequency = 750;
const keyShape = 0.003;
const noSound = 0.000001;



class Morse {
    constructor() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            window.alert(
                `Sorry, but your browser doesn't support the Web Audio API!`
            );
        }
        let t = this.ctx.currentTime;
        this.gainNode = this.ctx.createGain();
        // set audio to 
        this.gainNode.gain.setValueAtTime(noSound, t);
        this.oscillator = this.ctx.createOscillator()
        this.oscillator.type = "sine";
        this.oscillator.frequency.value = oscillatorFrequency;
        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.ctx.destination);
    }
    tone(t, l) {
        this.gainNode.gain.setValueAtTime(noSound, t)
        this.gainNode.gain.exponentialRampToValueAtTime(1, t + keyShape)
        t += l
        this.gainNode.gain.setValueAtTime(1, t);
        this.gainNode.gain.exponentialRampToValueAtTime(noSound, t + keyShape);
        t += dit;
        return t;
    }

    toMorse(c) {
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
        return code_map[i]
    }
    morseCode(code) {
        let t = this.ctx.currentTime;
        code.split("").forEach( letter => {
            switch (letter) {
                case ".":
                    t = this.tone(t, dit);
                    break;
                case "-":
                    t = this.tone(t, dah);
                    break;
                case " ":
                    t += dah
                    break;
            }
        });
        this.oscillator.start();
        this.oscillator.stop(t);
    }
    morseText(text) {
        let txt = text.toLowerCase();
    }
}

document.addEventListener("DOMContentLoaded", function (event) {
    let morse = new Morse()
    morse.morseCode("-.. .--- .---- - ..-.")
});