const r = e => Math.random()
const setTransform = (elem, value) => elem.style.transform = value
const s = id => document.getElementById(id)
function on(name, funct)
{
    if(window.socket)
        socket.on(name, funct)
}
function emit(name, data)
{
    if(window.socket)
        socket.emit(name, data)
}
