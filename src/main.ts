import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('Missing app container')
}

const canvas = document.createElement('canvas')
canvas.width = 960
canvas.height = 540
canvas.className = 'game-canvas'
app.appendChild(canvas)

const overlay = document.createElement('div')
overlay.className = 'overlay'
overlay.innerText = 'Fun Game loading...'
app.appendChild(overlay)
