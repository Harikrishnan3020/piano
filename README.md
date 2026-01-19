# 🎹 Virtual Piano Studio

A professional, production-ready interactive piano website with real-time keyboard control, stunning visual effects, and advanced audio features.

## ✨ Features

### Core Functionality
- **Real-time Keyboard Control**: Play piano using your laptop keyboard with ultra-low latency
- **Polyphony Support**: Play multiple notes simultaneously for complex chords
- **Visual Feedback**: Smooth neon glow effects on key presses with professional animations
- **Web Audio API**: High-quality synthesized piano sounds with realistic timbre

### Advanced Features
- **Volume Control**: Adjustable master volume with smooth slider
- **Sustain Pedal**: Spacebar acts as sustain pedal for natural piano playing
- **Recording & Playback**: Record your performances and play them back
- **Metronome**: Built-in metronome to keep time
- **Real-time Statistics**: Track notes played and system status

### Premium UI/UX
- **Dark Theme**: Professional studio-grade design with subtle gradients
- **Neon Accents**: Modern color palette with vibrant highlights
- **Micro-animations**: Smooth transitions and hover effects
- **Fully Responsive**: Works seamlessly on desktop, tablet, and mobile
- **Glassmorphism**: Modern frosted glass effects throughout

## 🎮 Controls

### Keyboard Mapping

#### White Keys (Natural Notes)
- `A` → C
- `S` → D
- `D` → E
- `F` → F
- `G` → G
- `H` → A
- `J` → B
- `K` → C (octave higher)
- `L` → D (octave higher)
- `;` → E (octave higher)

#### Black Keys (Sharps)
- `W` → C#
- `E` → D#
- `T` → F#
- `Y` → G#
- `U` → A#
- `O` → C# (octave higher)
- `P` → D# (octave higher)

#### Special Controls
- `Spacebar` → Sustain Pedal (hold for sustain)

### UI Controls
- **Volume Slider**: Adjust master volume (0-100%)
- **Sustain Button**: Toggle sustain mode
- **Record Button**: Start/stop recording
- **Play Button**: Playback recorded performance
- **Metronome Button**: Toggle metronome (120 BPM)

## 🚀 Getting Started

### Installation
1. Clone or download this repository
2. No build process required - pure HTML/CSS/JavaScript

### Running the Application
Simply open `index.html` in a modern web browser:
- Chrome (recommended)
- Firefox
- Safari
- Edge

Or use a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Using PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000`

## 🎵 How to Use

1. **Start Playing**: Click anywhere on the page or press any mapped key
2. **Play Chords**: Press multiple keys simultaneously for polyphony
3. **Use Sustain**: Hold spacebar while playing for sustained notes
4. **Record Performance**: 
   - Click "Record" button
   - Play your melody
   - Click "Record" again to stop
   - Click "Play" to hear your recording
5. **Adjust Volume**: Use the volume slider in the header
6. **Enable Metronome**: Click the metronome button for timing reference

## 🏗️ Technical Architecture

### File Structure
```
piano/
├── index.html          # Main HTML structure
├── styles.css          # Complete styling and animations
├── script.js           # Audio engine and interaction logic
└── README.md          # Documentation
```

### Technologies Used
- **HTML5**: Semantic structure
- **CSS3**: Advanced animations, gradients, and responsive design
- **JavaScript (ES6+)**: Modern syntax with classes
- **Web Audio API**: Real-time audio synthesis
- **Custom Fonts**: Google Fonts (Inter, Outfit)

### Audio Engine
The piano uses a sophisticated Web Audio API implementation:
- **Oscillator-based synthesis**: Multiple oscillators for rich timbre
- **ADSR Envelope**: Attack, Decay, Sustain, Release for natural sound
- **Polyphony**: Unlimited simultaneous notes
- **Low Latency**: Optimized for real-time performance

### Performance Optimizations
- Efficient event handling with Set-based key tracking
- Optimized CSS animations using GPU acceleration
- Minimal DOM manipulation
- Debounced key repeat prevention

## 🎨 Design Philosophy

### Color Palette
- **Primary Background**: Deep navy (#0a0e27, #151b3d)
- **Accent Colors**: 
  - Purple gradient (#667eea → #764ba2)
  - Pink gradient (#f093fb → #f5576c)
  - Cyan gradient (#4facfe → #00f2fe)

### Typography
- **Primary Font**: Inter (clean, modern sans-serif)
- **Display Font**: Outfit (bold headings)

### Visual Effects
- Smooth glow animations on key press
- Subtle hover states
- Glassmorphism with backdrop blur
- Gradient overlays for depth

## 🔧 Customization

### Changing BPM
Edit the `Metronome` class in `script.js`:
```javascript
this.bpm = 120; // Change to desired BPM
```

### Adding More Keys
1. Add HTML elements in `index.html`
2. Add frequency in `noteFrequencies` object
3. Add key mapping in `keyMap` object

### Adjusting Sound
Modify the `createPianoSound` method in `script.js`:
- Change oscillator types
- Adjust envelope parameters (attack, decay, sustain, release)
- Modify oscillator ratios for different timbres

## 🌐 Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 14+
- ✅ Edge 79+

**Note**: Web Audio API requires user interaction to start (browser autoplay policy)

## 📱 Responsive Breakpoints

- **Desktop**: 1024px and above
- **Tablet**: 768px - 1023px
- **Mobile**: 480px - 767px
- **Small Mobile**: Below 480px

## 🎯 Future Enhancements

Potential features for future versions:
- [ ] Multiple instrument sounds
- [ ] MIDI keyboard support
- [ ] Export recordings as audio files
- [ ] Visual piano roll for recordings
- [ ] Adjustable octave range
- [ ] Chord detection and display
- [ ] Tutorial mode with guided lessons
- [ ] Customizable key bindings
- [ ] Dark/light theme toggle

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Development

Built with modern web technologies and best practices:
- Semantic HTML5
- BEM-inspired CSS methodology
- ES6+ JavaScript features
- Mobile-first responsive design
- Accessibility considerations

## 🙏 Acknowledgments

- Web Audio API documentation
- Modern web design inspiration from professional music software
- Google Fonts for typography

---

**Enjoy playing! 🎹🎶**

For issues or suggestions, please create an issue in the repository.
