let AudioContext = window.AudioContext || window.webkitAudioContext;
let ctx = new AudioContext();

// target speed
const wpmTarget = 12;
const bpmTarget = wpmTarget * 5;
const bpmDitSpeed = 60 * 100;
const dit = bpmDitSpeed / bpmTarget / 1000;
const dah = 3 * dit;
const oscillatorFrequency = 750;
const keyShape = 0.003;
const noSound = 0.000001;




function tone(gainNode, t, l) {
    gainNode.gain.setValueAtTime(noSound, t)
    gainNode.gain.exponentialRampToValueAtTime(1, t + keyShape)
    t += l

    gainNode.gain.setValueAtTime(1, t);
    gainNode.gain.exponentialRampToValueAtTime(noSound, t + keyShape);
    t += dit;
    return t;
}

function morse(code) {
    let t = ctx.currentTime;

    let oscillator = ctx.createOscillator()
    oscillator.type = "sine";
    oscillator.frequency.value = oscillatorFrequency;

    let gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(noSound, t);

    code.split("").forEach(function (letter) {
        switch (letter) {
            case ".":
                t = tone(gainNode, t, dit);
                break;
            case "-":
                t = tone(gainNode, t, dah);
                break;
            case " ":
                t += dah
                break;
        }
    });

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start();
}

class Morse {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
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
    morse(code) {
        let t = this.ctx.currentTime;
        let that = this;
        code.split("").forEach(function (letter) {
            switch (letter) {
                case ".":
                    t = tone(that.gainNode, t, dit);
                    break;
                case "-":
                    t = tone(that.gainNode, t, dah);
                    break;
                case " ":
                    t += dah
                    break;
            }
        });
        this.oscillator.start();
    }
}

document.addEventListener("DOMContentLoaded", function (event) {
 //   morse("-.. .--- .---- - ..-.");
      let morse = new Morse()
      morse.morse("-.. .--- .---- - ..-.")
      
});