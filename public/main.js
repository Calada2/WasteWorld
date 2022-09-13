let isCoil = false
let gameStarted = false
const camera = {
    X: 0,
    Y: 0,
    x: 0,
    y: 0,
    z: 0,
    mask: false
}
let status;

let paused = false
document.body.onmousemove = e => {
    if(!paused && inChat/* && e.movementX < 100 && e.movementX > -100*/)
    {
        camera.Y += (e.movementX / 500);
        camera.X -= (e.movementY / 500);
        if (camera.X < -Math.PI / 2) camera.X = -Math.PI / 2;
        else if (camera.X > Math.PI / 2) camera.X = Math.PI / 2;
    }
};




const KeyPressed = {}
addEventListener('keydown', e => {

    if(!gameStarted)
        return

    switch (e.code)
    {
        case 'Enter':
            if(!paused)
                startChat()
            break;

        case 'KeyF':
            if(inChat)
                toggleMask()
            break;

        case 'KeyG':
            shareResource()
            break;

        case 'KeyE':
            if(inChat && (paused === inInventory))
                toggleInventory()
            break;

    }

    if(paused || !inChat)
        return

    KeyPressed[e.code] = true
})
addEventListener('keyup', e => KeyPressed[e.code] = false)

addEventListener('mousedown', e => {
    if(paused || !inChat)
        return

    if (e.which === 3) {
        placeBlock()
    }
    else if(e.which === 2)
    {
        const block = world.getBlock(raycastResult.x,raycastResult.z, raycastResult.y)
        if(block !== BLOCK.AIR)
            changeBlock(block)
    }
    else
    {
        breakBlock()
    }
})
function placeBlock()
{
    const target = raycastPrevious

    if(selectedBlock >= 100 && hasItem(selectedBlock))
    {
        useItem(selectedBlock)
        return
    }

    if(target === null)
        return

    if(selectedBlock < 100 && hasItem(selectedBlock) && world.getBlock(target.x, target.z, target.y) === BLOCK.AIR && canPlaceBlock(target.x, target.z, target.y))
    {

        playSound('place')
        updateBlock(target.x, target.z, target.y, selectedBlock)
        removeItem(selectedBlock)
    }

}

function useItem(id)
{
    if(!consumables.includes(id))
        return

    switch (id)
    {
        case BLOCK.APPLE:
            getHp(25)
            break
        case BLOCK.CAN:
            getHp(50)
            break
        case BLOCK.CAN_APPLE:
            getHp(100)
            break
        case BLOCK.PATRON:
            status.mask_hp = 100
            break
    }
    removeItem(id)
}
function getHp(amount)
{
    status.hp = Math.min(status.hp + amount, 100)
}

function updateBlock(x,z,y,id)
{
    if(GAME_TYPE === 'host')
        world.setBlock(x, z, y, id)

    sendBlockUpdate(x, z, y, id)
}

function canPlaceBlock(x, z, y)
{
    if(y < 0 || y >= CHUNK_HEIGHT)
        return false

    for (const [id,pos] of Object.entries(playersPos)) {

        if(pos)
        {

            for(let dx = -1; dx <= 1; dx += 2)
                for(let dz = -1; dz <= 1; dz += 2)
                    for(let dy = 0; dy <= 2; dy++)
                    {
                        const cords = posToCords(pos.x + pRadius * dx, pos.z  + pRadius * dz, pos.y + [25, -135, -55][dy])
                            if(cords.x === x && cords.z === z && cords.y === y)
                                return false
                    }
        }
    }
    return true
}
function posToCords(x,z,y)
{
    return {
        x: Math.floor(-x / 100),
        z: Math.floor(-z / 100),
        y: Math.floor(-y / 100)
    }
}

function breakBlock()
{
    const r = raycastResult
    if(r === null || r.y < 0 || r.y >= CHUNK_HEIGHT - 1 || world.getBlock(r.x,r.z,r.y) === BLOCK.BEDROCK)
        return

    playSound('break')
    getItem(world.getBlock(r.x,r.z,r.y), !(selectedId === BLOCK.PICKAXE && inventory[selectedId] > 0))
    if(GAME_TYPE === 'host')
        world.setBlock(r.x,r.z,r.y,0)
    sendBlockUpdate(r.x,r.z,r.y, BLOCK.AIR)
}
const soundEffects =
    {
        'break': [2.1,0,1594,,.03,.01,2,2.62,-0.1,,-745,.06,,,54,1,,.66,.02,.1],
        'place': [1.5,0,987,,.02,0,2,1.26,1.9,52,305,,,,14,.6,.01,,.01,.08]
    }
function playSound(name)
{
    zzfx(...soundEffects[name])
}
function updateCSS()
{
    const cam = s('camera')
    cam.style.setProperty('--x', camera.x + 'px')
    cam.style.setProperty('--y', camera.y + 'px')
    cam.style.setProperty('--z', camera.z + 'px')
    cam.style.setProperty('--X', camera.X + 'rad')
    cam.style.setProperty('--Y', camera.Y + 'rad')
}
function sendBlockUpdate(x,z,y,type)
{
    //TODO: itt megkéne nézni hogy az adott blokkon volt-e már update és ha igen akkor kiszedni azt
    blockUpdates.push([x,z,y,type])
    emit('block_update', [x,z,y,type])
}


function receiveBlockUpdate(data)
{
    //create a list of changes if the chunk is not loaded. THis way we dont even need to load it
    const chunkX = Math.floor(data[0] / CHUNK_SIZE)
    const chunkZ = Math.floor(data[1] / CHUNK_SIZE)
    const blockX = (data[0] % CHUNK_SIZE + CHUNK_SIZE) % CHUNK_SIZE
    const blockZ = (data[1] % CHUNK_SIZE + CHUNK_SIZE) % CHUNK_SIZE

    if(world.chunkExists(chunkX, chunkZ))
        world.setBlock(data[0], data[1], data[2], data[3])
    else
    {
        if(!world.blockUpdates[chunkX + '_' + chunkZ])
            world.blockUpdates[chunkX + '_' + chunkZ] = []
        world.blockUpdates[chunkX + '_' + chunkZ].push([blockX, blockZ, data[2], data[3]])
    }

    blockUpdates.push(data)


    if(GAME_TYPE === 'host')
        emit('block_update', data)
}
let prevTime = Date.now()
const movementSpeed = .35
const currentChunk = {x: 0, z: 0}
let raycastResult = null
let raycastPrevious = null
let iter = 0;
let sinceLastEmit = 0
let sinceLastTick = 0
const pRadius = 30;
let accelerationY = 0;
let targetPlayer
function gameloop()
{
    const currentTime = Date.now()
    const delta = Math.max((prevTime - currentTime), -1000)
    prevTime = currentTime



    const speedX = (KeyPressed['KeyA'] ? -1 : 0) + (KeyPressed['KeyD'] ? 1 : 0)
    const speedZ = (KeyPressed['KeyW'] ? -1 : 0) + (KeyPressed['KeyS'] ? 1 : 0)
    //const speedY = (KeyPressed['KeyE'] ? -1 : 0) + (KeyPressed['KeyQ'] ? 1 : 0)

    if(KeyPressed['Space'] && accelerationY === 0 && checkForCollision(camera.x, camera.z, camera.y - 2, true))
        accelerationY = 2.5


    const speedY = -accelerationY

    const changeX = (speedZ * delta * -Math.sin(camera.Y) * movementSpeed) + (speedX * delta * Math.cos(camera.Y) * movementSpeed)
    const changeZ = (speedZ * delta * Math.cos(camera.Y) * movementSpeed) + (speedX * delta * Math.sin(camera.Y) * movementSpeed)
    const changeY = speedY * delta * movementSpeed


    accelerationY += delta / 100

    if(accelerationY < -10)
        accelerationY = -10

    let addX = false
    let addZ = false
    let addY = false


    if(!checkForCollision(camera.x + changeX, camera.z, camera.y))
    {
        addX = true
    }

    if(!checkForCollision(camera.x, camera.z + changeZ, camera.y))
    {
        addZ = true
    }

    if(!checkForCollision(camera.x, camera.z, camera.y  + changeY - 0.01))
    {
        addY = true
    }
    else
    {
        accelerationY = 0
    }




    if(addX)
        camera.x += changeX
    if(addZ)
        camera.z += changeZ
    if(addY)
        camera.y += changeY


    if(camera.y < CHUNK_HEIGHT * -100)
        camera.y = 0

    //camera.y += changeY

    const chunkX = Math.floor(-camera.x / 100 / CHUNK_SIZE)
    const chunkZ = Math.floor(-camera.z / 100 / CHUNK_SIZE)

    if(chunkZ !== currentChunk.z || chunkX !== currentChunk.x)
    {
        const directionX = currentChunk.x - chunkX
        const directionZ = currentChunk.z - chunkZ

        currentChunk.x = chunkX
        currentChunk.z = chunkZ
        world.loadChunks2(directionX, directionZ)
        chunkChange()
    }

    const rad = world.getRadiation2(-camera.x / 100, -camera.z / 100)
    toggleBadVision(~~(rad * 4))
    s('rad').innerHTML = Math.round(rad * 100) + '% RADIATION<br>' + ['LOW', 'MODERATE', 'HIGH', 'EXTREME'][~~(rad * 4)] + '<br><br>[F] Toggle Mask<br>[E] Open Inventory'


    if(++iter % 5 === 0)
    {
        raycastResult = raycast()
        if(raycastResult !== null)
            setTransform(indicator, `translate3D(${raycastResult.x * 100 - .5}px, ${raycastResult.y * 100 - .5}px, ${raycastResult.z * 100 + 50 - .5}px)`)
        else
            setTransform(indicator, `translateY(3000px)`)

    }


    if(status.mask && status.mask_hp > 0)
    {
        status.mask_hp = Math.max(0, status.mask_hp + (delta / 3000))
        s('mask').style.setProperty('--progress', status.mask_hp + '%')
    }
    else
    {
        status.hp += rad * rad * (delta / 200)
        s('hp').style.setProperty('--progress', status.hp + '%')
        if(status.hp < 0)
            gameOver()
    }


    sinceLastEmit -= delta
    sinceLastTick -= delta

    if(sinceLastEmit > 100)
    {
        if(GAME_TYPE === 'client')
            emit('movement', camera)
        else
            emit('movement_all', JSON.stringify(playersPos))

        sinceLastEmit = 0

        targetPlayer = document.elementsFromPoint(innerWidth/2,innerHeight/2)[1].idp
        s('give').hidden = !Boolean(targetPlayer)
    }

    if(sinceLastTick > (5000 / world._loadedChunks.length))
    {
        sinceLastTick = 0
        tick2()
    }

    updateCSS()
    rotate2Ditems()

    requestAnimationFrame(gameloop)

}
function rotate2Ditems()
{
    const pos = {x: (-camera.x-50)/100, z: (-camera.z-50)/100}
    for(let i in world._loadedChunks)
    {
        const c = world._loadedChunks[i]
        for(let j in c._blocks2D) if(c._blocks2D[j])
        {
            const elem = c._blocks2D[j]
            const angle = -Math.atan2(elem.z - pos.z, elem.x - pos.x) + Math.PI/2
            c._blocks2D[j].style.setProperty('--rot', angle + 'rad')
        }
    }
}
function tick2()
{
    let i = ~~(world._loadedChunks.length * r())
    const c = world._loadedChunks[i]

    for(let i in c._sapplings) if(c._sapplings[i])
    {
        const id = c._sapplings[i].split('|')
        if(c.getBlock(+id[0],+id[1],+id[2]+1) === BLOCK.GRASS)
            placeTree(+id[0]+CHUNK_SIZE*c._id.x,+id[1]+CHUNK_SIZE*c._id.z,+id[2])
    }
    for(let i in c._grassBlocks) if(c._grassBlocks[i])
    {
        const id = c._grassBlocks[i]
        const [x,z,y] = id.split('|')
        if(!isTransparent(c.getBlock(x,z,+y-1)) && r() < .1)
        {
            updateBlock(+x+CHUNK_SIZE*c._id.x,+z+CHUNK_SIZE*c._id.z,+y,BLOCK.DIRT)
        }
        if(isTransparent(c.getBlock(x,z,+y-1)) && c._plantCount < 1 && r() < .005)
        {
            updateBlock(+x+CHUNK_SIZE*c._id.x,+z+CHUNK_SIZE*c._id.z,+y-1,[BLOCK.TULIP,BLOCK.POPPY,BLOCK.ROSE,BLOCK.FLOWER_CYAN][~~(r()*4)])
        }

        for(let y2 = -1; y2 < 2; ++y2)
            for(let x2 = 0; x2 < 2; ++x2)
                for(let z2 = 0; z2 < 2; ++z2)
                {
                    const [x3,z3,y3] = [+x - 1 + x2*2, +z - 1 + z2*2, +y + y2]
                    const b = c.getBlock(x3,z3,y3)
                    if(b === BLOCK.DIRT && isTransparent(c.getBlock(x3,z3,y3-1)) && world.getRadiation2(x3+CHUNK_SIZE*c._id.x,z3+CHUNK_SIZE*c._id.z) < .25 && r() < .05)
                        updateBlock(x3+CHUNK_SIZE*c._id.x,z3+CHUNK_SIZE*c._id.z, y3, BLOCK.GRASS)
                }

    }
}
function chunkChange()
{

}
function checkForCollision(x, z, y, yOnly = false)
{
    for(let dx = -1; dx <= 1; dx += 2)
        for(let dz = -1; dz <= 1; dz += 2)
            for(let dy = 0; dy <= 2; dy++)
            {
                const b = world.getBlockFromCamera(x + pRadius * dx, z + pRadius * dz, y + [25, -135, -55][yOnly ? 1 : dy])
                if(b > 0 && !isPlant(b))
                    return true
            }


    return false
}

function raycast()
{
    const pos = {x: -camera.x/100, y: -camera.y/100, z: -camera.z/100}
    const stepAmount = .1
    let stepTotal = 0
    const step = {
        x: Math.cos(camera.X) * Math.sin(camera.Y) * stepAmount,
        z: Math.cos(camera.X) * -Math.cos(camera.Y) * stepAmount,
        y: -Math.sin(camera.X) * stepAmount
    }
    while(stepTotal < 5)
    {
        pos.x += step.x
        pos.z += step.z
        pos.y += step.y
        stepTotal += stepAmount

        const blockId = {x:Math.floor(pos.x),z:Math.floor(pos.z),y:Math.floor(pos.y)}
        if(world.getBlock(blockId.x, blockId.z, blockId.y) > 0)
            return blockId

        raycastPrevious = blockId
    }
    raycastPrevious = null
    return null

}



const indicator = createPointer()
s('scene').appendChild(indicator)
function hostGame(slot)
{
    startCommon()
    startServer(slot)
}
function joinGame(id)
{
    emit('server_exists' ,id)
}
function startCommon()
{
    window.pName = s('name').value
    window.pColor = s('color').value
    window.pHair = s('hair').value
    window.pSkin = s('skin').value
    removeEventListener('mousemove', previewEvent)
    clearInterval(previewInterval)
    s('crosshair').hidden = false
    s('currentBlock').hidden = false
    on('give_resource', data => getResource(data))
}
function startGame(seed)
{
    gameStarted = true
    window.world = new World(seed)
    camera.x = camera.z = 10

    s('menu').hidden = true
    s('hp').hidden = false
    document.querySelector('#camera').requestPointerLock();
    loadInventory(seed)
    setTimeout(()=>gameloop())
}
function joinServer(sessionId)
{
    //window.socket = io({ upgrade: false, transports: ["websocket"] })
    //on("connect", () => onClientConnect())
    GAME_TYPE = 'client'

    on('update_data', data => updatePlayerData(data))
    on('host_disconnect', () => hostDisconnect())

    onClientConnect(sessionId)
}
function updatePlayerData(data)
{
    for (const [id, player] of Object.entries(data)) {
        if(id !== socket.id)
        {
            if(!playersElem[id])
            {
                playerJoin([id,player.name,player.color,player.hair,player.skin])
            }
        }
    }

    for (const [id, player] of Object.entries(playersData)) {
        if(!data[id])
        {
           removePlayer(id)
        }
    }
}
function startServer(slot)
{
    //window.socket = io({ upgrade: false, transports: ["websocket"] })
    //on("connect", () => onHostConnect(slot))


    GAME_TYPE = 'host'

    on('player_join', data => playerJoin(data))
    playersPos['host'] = camera
    playersData['host'] = {name: pName, color: pColor, hair: pHair, skin: pSkin}
    status = playersStatus['host'] = {mask: false, hp: 100, mask_hp: 100}

    onHostConnect(slot)
}
const playersPos = {}
const playersElem = []
const playersData = {}
const playersStatus = {}

const blockUpdates = []

function onConnectCommon()
{
    on('message', data => receiveMessage(data[0], data[1]))
    on('game_complete', () => completeGame())
}
function playerJoin(data)
{
    const id = data[0]
    playersPos[id] = {
        x: 0,
        y: 0,
        z: 0,
        Y: 0,
        X: 0
    }
    //playersElem[id] = createPointer(data[2])
    playersElem[id] = createPlayerModel(data[2], data[3], data[4], id)
    playersData[id] = {
        color: data[2],
        name: data[1],
        hair: data[3],
        skin: data[4]
    }
    s('scene').appendChild(playersElem[id])

    printMessage(playersData[id].name + ' joined the game')

    if(GAME_TYPE === 'host')
    {
        emit('player_join', playersData)
        emit('send_block_updates', [id, blockUpdates])
    }

}
function updateClientPos(data)
{
    const id = data[0]
    const pos = data[1]

    Object.assign(playersPos[id], pos)

    setTransform( playersElem[id], `translateY(135px) translate3D(${-pos.x}px, ${-pos.y}px, ${-pos.z}px) rotateY(${-pos.Y}rad)`)
    setTransform(playersElem[id].head, `translateY(-135px) rotateX(${-pos.X/2}rad)`)
    playersElem[id].mask.hidden = !pos.mask

}
let currentSlot;
//const saveData = [[[0.7093673760043906,[[-2,-7,6,3],[-1,-6,6,3],[-1,-8,6,3],[0,-7,6,3],[0,-6,6,3],[0,-6,7,3],[0,-8,6,3],[0,-8,7,3],[-2,-8,6,3],[-2,-6,6,3],[-2,-8,7,3],[-2,-6,7,3],[-2,-6,8,3],[-2,-7,8,3],[-2,-8,8,3],[-1,-8,8,3],[-1,-6,8,3],[-1,-7,8,3],[0,-6,8,3],[0,-7,8,3],[0,-8,8,3]]],[[0,-4,7,0],[1,-4,8,0],[-1,-4,7,0],[-2,-4,7,0],[-2,-5,8,0],[-1,-5,8,0],[0,-5,8,0],[0,-5,7,0],[-1,-5,7,0],[-2,-5,7,0],[-2,-5,6,0],[0,-8,8,3],[0,-7,8,3],[0,-6,8,3],[-1,-7,8,3],[-1,-6,8,3],[-1,-8,8,3],[-2,-8,8,3],[-2,-7,8,3],[-2,-6,8,3],[-2,-6,7,3],[-2,-8,7,3],[-2,-6,6,3],[-2,-8,6,3],[0,-8,7,3],[0,-8,6,3],[0,-6,7,3],[0,-6,6,3],[0,-7,6,3],[-1,-8,6,3],[-1,-6,6,3],[-2,-7,6,3]]]]
let saveData;// = [[[0.7093673760043906,[[-2,-7,6,3],[-1,-6,6,3],[-1,-8,6,3],[0,-7,6,3],[0,-6,6,3],[0,-6,7,3],[0,-8,6,3],[0,-8,7,3],[-2,-8,6,3],[-2,-6,6,3],[-2,-8,7,3],[-2,-6,7,3],[-2,-6,8,3],[-2,-7,8,3],[-2,-8,8,3],[-1,-8,8,3],[-1,-6,8,3],[-1,-7,8,3],[0,-6,8,3],[0,-7,8,3],[0,-8,8,3]]],[[0,-4,7,0],[1,-4,8,0],[-1,-4,7,0],[-2,-4,7,0],[-2,-5,8,0],[-1,-5,8,0],[0,-5,8,0],[0,-5,7,0],[-1,-5,7,0],[-2,-5,7,0],[-2,-5,6,0],[0,-8,8,3],[0,-7,8,3],[0,-6,8,3],[-1,-7,8,3],[-1,-6,8,3],[-1,-8,8,3],[-2,-8,8,3],[-2,-7,8,3],[-2,-6,8,3],[-2,-6,7,3],[-2,-8,7,3],[-2,-6,6,3],[-2,-8,6,3],[0,-8,7,3],[0,-8,6,3],[0,-6,7,3],[0,-6,6,3],[0,-7,6,3],[-1,-8,6,3],[-1,-6,6,3],[-2,-7,6,3]]]]
function onHostConnect(slot = -1)
{
    if(slot === -1 || !saveData[slot])
    {
        startGame()
        currentSlot = saveData.length
        saveData.push([world._seed, [], s('worldName').value])
    }
    else
    {
        currentSlot = slot
        startGame(saveData[slot][0])
        setTimeout(()=>receivePastBlockUpdates(saveData[slot][1]))
    }

    //TODO: maybe add back
    //setInterval(()=>save(), 30000)

    emit("set_id", [SESSION_ID, world._seed, s('public').checked, saveData[currentSlot][2]])
    on('movement', data => updateClientPos(data))
    on('block_update', data => receiveBlockUpdate(data))
    on('player_disconnect', id => removePlayer(id))
    onConnectCommon()

    printMessage('Game started! Session ID: ' + SESSION_ID)
}
function removePlayer(id)
{
    if(playersData[id])
    {
        printMessage(playersData[id].name + ' left the game')
        delete playersData[id]
        delete playersPos[id]
        playersElem[id].outerHTML = ''
        delete playersElem[id]

        if(GAME_TYPE === 'host')
            emit('player_join', playersData)
    }
}
function onClientConnect(id)
{
    SESSION_ID = id
    emit("session_join", [SESSION_ID, pName, pColor, pHair, pSkin])
    on("send_seed", seed =>  {if(seed)startGame(seed)})
    on('movement_all', players => updateMovement(JSON.parse(players)))
    on('block_update', data => receiveBlockUpdate(data))
    on('send_block_updates', data => receivePastBlockUpdates(data))
    playersData[socket.id] = {name: pName, color: pColor,hair: pHair, skin: pSkin}
    playersPos[socket.id] = camera
    status = playersStatus[socket.id] = {mask: false, hp: 100, mask_hp: 100}
    onConnectCommon()
}
function receivePastBlockUpdates(data)
{
   data.forEach(change => receiveBlockUpdate(change))
}
function updateMovement(players)
{
    for (const [id, player] of Object.entries(players)) {
        if(id !== socket.id)
        {
            if(playersElem[id])
                updateClientPos([id, player])
        }
    }
}

function isImgChat(msg)
{
    if(msg.includes('/img'))
    {
        const p = msg.split(' ')
        if(p.length === 2 || (p.length === 3 && p[2] === ''))
            return true
    }
    return false
}
function sendMessage(msg, from)
{
    emit('message', [msg, from])
    if(GAME_TYPE === 'host')
        printMessage(msg, from)
}
function cleanMessage(msg)
{
    msg = msg.replaceAll('<', '&#60;')
    msg = msg.replaceAll('>', '&#62;')
    msg = msg.replaceAll(',', '&#44;')
    msg = msg.replaceAll('`', '&#96;')
    msg = msg.replaceAll('\\', '&#92;')
    msg = msg.replaceAll('/', '&#47;')
    msg = msg.replaceAll('(', '&#40;')
    msg = msg.replaceAll(')', '&#41;')
    return msg
}
function receiveMessage(msg, from)
{
    if(GAME_TYPE === 'host')
        sendMessage(msg, from)
    else
        printMessage(msg, from)
}
function printMessage(msg, from)
{



    const elem = createElement('msg')
    let imgElem;

    if(isImgChat(msg))
    {
        imgElem = new Image()
        imgElem.src = msg.split(' ')[1]
        imgElem.onload = () => {
            if(imgElem.width > imgElem.height && imgElem.width > 300)
                imgElem.width = 300
            else if(imgElem.height > imgElem.width && imgElem.height > 300)
                imgElem.height = 300
        }
        msg = ''
    }

    msg = cleanMessage(msg)

    if(from)
        elem.innerHTML = `<b class='name' style='background: ${playersData[from].color}'>${playersData[from].name}: </b> ${msg}`
    else
        elem.innerHTML = msg

    if(imgElem)
        elem.appendChild(imgElem)

    s('chatlog').appendChild(elem)
    s('chatlog').scrollTo(0, s('chatlog').scrollHeight);

    toggleChatlog(true)

    if(inChat)
    {
        setTimeout(()=>{
            if(inChat)  toggleChatlog(false)
        },4000)
    }


}
function chat(msg)
{
    if(msg === '/unlockduck')
    {
        if(!isDuck)
        {
            isDuck = true
            recipes.push({result: BLOCK.DUCK, amount: 1, reqs: [BLOCK.IRON_BLOCK, 1,BLOCK.GOLD_BLOCK, 1,BLOCK.REDIUM_BLOCK, 1,BLOCK.BLUEIUM_BLOCK, 1,BLOCK.URANIUM_BLOCK, 1], coil: false})
        }
    }
    else if(msg === '/forcecoil')
        startCoil()
    else
        sendMessage(msg, GAME_TYPE === 'host' ? 'host' : socket.id)
}


let inChat = true
function startChat()
{
    const elem = s('chatField')

        if(document.activeElement === elem)
        {
            const msg = elem.value
            if(msg.length > 0)
                chat(msg, GAME_TYPE === 'host' ? 'host' : socket.id)
            elem.blur()
            elem.hidden = true
            elem.value = ''
            inChat = true
            toggleChatlog(false)
        }
        else
        {
            elem.hidden = false
            elem.focus()
            inChat = false
            toggleChatlog(true)
        }

}

function toggleChatlog(visible)
{
    const chatlog = s('chatlog')
    if(visible)
    {
        chatlog.style.transition = '0s opacity'
        chatlog.style.opacity = '1'
    }
    else
    {
        chatlog.style.transition = '3s opacity'
        chatlog.style.opacity = '0'
    }
}

document.addEventListener('pointerlockchange', lockChangeAlert, false);
function lockChangeAlert() {
    if (!(document.pointerLockElement === s('camera')))
        togglePause(true, inInventory)
    else
    {
        s('pause').hidden = true
        s('inv').hidden = true
        paused = false
        inInventory = false
    }

}

let inInventory = false
function togglePause(visible, inventoryMode = false)
{
    if(visible)
    {
        if(inventoryMode)
        {
            s('inv').hidden = false
            inInventory = true
            document.exitPointerLock()
        }
        else
            s('pause').hidden = false
        paused = true
        saveInventory()
        if(GAME_TYPE === 'host')
            save()
    }
    else
    {

        document.querySelector('#camera').requestPointerLock();
    }
}
function toggleInventory()
{
    if(!inInventory)
    {
        togglePause(true, true)
        if(uiInCrafting)
            listRecipes()
        else
            listInventory()
    }
    else
        togglePause(false)
}
function updateRenderDistance(value)
{
    RENDER_DISTANCE = value
    world.loadChunks2()
}

function initSave()
{
    const saves = localStorage.getItem('js13kraft_saves')
    if(saves)
    {
        saveData = JSON.parse(saves)
    }
    else
    {
        saveData = []
    }
}
let lastSaveEnd = 0;
function save()
{

    const blockUpdatesNew = []
    const changeSaved = []
    for(let i = blockUpdates.length - 1; i >= lastSaveEnd; --i)
    {
        const b = blockUpdates[i]
        const pos = b[0] + '_' + b[1] + '_' + b[2]
        if(!changeSaved[pos])
        {
            changeSaved[pos] = true
            blockUpdatesNew.push(b)
        }
    }
    for(let i = saveData[currentSlot][1].length - 1; i >= 0; --i)
    {
        const b = saveData[currentSlot][1][i]
        const pos = b[0] + '_' + b[1] + '_' + b[2]
        if(!changeSaved[pos])
        {
            changeSaved[pos] = true
            blockUpdatesNew.push(b)
        }
    }
    lastSaveEnd =  blockUpdates.length - 1

    saveData[currentSlot][1] = blockUpdatesNew
    localStorage.setItem('js13kraft_saves', JSON.stringify(saveData))
    printMessage('Game Saved')
}
function hostDisconnect()
{
    saveInventory()
    alert('The host has left the game')
    location.reload()
}


addEventListener('wheel', e => {

    if(!inChat || paused)
        return


    let delta;
    e => e.preventDefault();

    if (e.wheelDelta)
        delta = e.wheelDelta;
    else
        delta = -1 * e.deltaY;



    if (delta > 0)
        scrollBlock(true)

    else if (delta < 0)
        scrollBlock(false)


});

let selectedId = 0
function scrollBlock(increase)
{
    const empty = isInventoryEmpty()
    s('currentBlock').hidden = s('itemCount').hidden = empty
    if(empty)
        return


    for(let i = 1; i <= inventory.length; ++i)
    {
        const id = (selectedId + (increase ? i : -i) + inventory.length) % inventory.length
        if(hasItem(id))
        {
            changeBlock(id)
            return
        }

    }


    /*if(increase)
        changeBlock(selectedBlock === 11 ? 1 : selectedBlock + 1);
    else
        changeBlock(selectedBlock === 1 ? 11 : selectedBlock - 1);*/
}

function changeBlock(to)
{
    to = +to
    onDequip(+selectedId)
    const url = typeof blockTextures[to] === 'string' ? blockTextures[to] : blockTextures[to][0]
    const url2 = typeof blockTextures[to] === 'string' ? blockTextures[to] : blockTextures[to][1]
    s('currentBlock').style.setProperty('--img', `url(${url})`)
    s('currentBlock').style.setProperty('--img2', `url(${url2})`)
    s('currentBlock').style.setProperty('--dir', (to > 100 || isPlant(to)) ? 0 : 1)
    s('itemCount').innerHTML = inventory[to] ? (inventory[to] > 1 ? inventory[to] : '') : 0
    selectedBlock = to
    selectedId = to
    onEquip(+to)
}
function onEquip(id)
{
    if(id === BLOCK.COMPASS)
    {
        s('scene').appendChild(waypointElems[0])
        waypointElems[0].style.transform = `translateY(-70%) rotateY(${-Math.atan2(0-camera.z,0-camera.x) - Math.PI/2}rad)`
    }
    else if(id === BLOCK.COMPASS_END)
        s('scene').appendChild(waypointElems[1])
}
function onDequip(id)
{
    if(id === BLOCK.COMPASS)
        if(s('scene').contains(waypointElems[0]))
            s('scene').removeChild(waypointElems[0])
    if(id === BLOCK.COMPASS_END)
        if(s('scene').contains(waypointElems[1]))
            s('scene').removeChild(waypointElems[1])
}
let selectedBlock = BLOCK.COBBLESTONE

function toggleBadVision(level)
{
    s('camera').style.filter = `sepia(${[.4, .6, .8, 1][level]}) saturate(${[1,1.5,2.2,3][level]})`
}

let inMask = false
function toggleMask(bool = !inMask)
{
    inMask = bool
    status.mask = camera.mask = bool
    s('mask').hidden = !bool
}

function gameOver()
{
    printMessage('You Died')
    camera.x = 0
    camera.y = 0
    camera.z = 0
    status.hp = 100
    s('hp').style.setProperty('--progress', status.hp + '%')
}

//setTimeout(createTextures,2000)

const recipes = [
    'Tools',
    {result: BLOCK.COMPASS, amount: 1, reqs: [BLOCK.IRON, 10, BLOCK.GOLD, 5, BLOCK.REDIUM, 3], coil: false, desc: 'Shows you the way home'},
    {result: BLOCK.PATRON, amount: 1, reqs: [BLOCK.IRON, 3, BLOCK.SAND, 1, BLOCK.SAPPLING, 1], coil: false, desc: 'Refills your mask with oxygen'},
    {result: BLOCK.CAN_APPLE, amount: 1, reqs: [BLOCK.APPLE, 2, BLOCK.IRON, 2], coil: false, desc: 'Restores your health'},
    'Quest',
    {result: BLOCK.COMPASS_END, amount: 1, reqs: [BLOCK.URANIUM, 10, BLOCK.GOLD, 5, BLOCK.BLUEIUM, 3], coil: false, desc: 'Shows you where the WFS™ is'},
    {result: BLOCK.NUKE, amount: 1, reqs: [BLOCK.URANIUM_BLOCK, 1, BLOCK.IRON, 2, BLOCK.PLANK, 3], coil: false, desc: '8 of these batteries can power the World Filtration System™'},
    'Decorative',
    {result: BLOCK.PLANK, amount: 5, reqs: [BLOCK.LOG, 1], coil: false},
    {result: BLOCK.STONE_BRICK, amount: 5, reqs: [BLOCK.COBBLESTONE, 5], coil: false},
    {result: BLOCK.SAND_BRICK, amount: 5, reqs: [BLOCK.SAND, 10], coil: false},
    {result: BLOCK.MARBLE_BRICK, amount: 5, reqs: [BLOCK.STONE_BRICK, 5, BLOCK.IRON, 5], coil: false},
    {result: BLOCK.SAND_STONE_TILE, amount: 4, reqs: [BLOCK.STONE_BRICK, 2, BLOCK.SAND_BRICK, 2], coil: false},
    {result: BLOCK.KITCHEN_TILE, amount: 4, reqs: [BLOCK.SAND_STONE_TILE, 4, BLOCK.IRON, 4], coil: false},
    {result: BLOCK.BLUE_RED_TILE, amount: 4, reqs: [BLOCK.SAND_STONE_TILE, 4, BLOCK.REDIUM, 2, BLOCK.BLUEIUM, 2], coil: false},
    {result: BLOCK.DIRT_BRICK, amount: 5, reqs: [BLOCK.DIRT, 5], coil: true},
    {result: BLOCK.IRON_BRICK, amount: 1, reqs: [BLOCK.BRICK, 1, BLOCK.IRON_BLOCK, 1], coil: true},
    {result: BLOCK.GOLD_BRICK, amount: 1, reqs: [BLOCK.BRICK, 1, BLOCK.GOLD_BLOCK, 1], coil: true},
    {result: BLOCK.RED_BRICK, amount: 1, reqs: [BLOCK.BRICK, 1, BLOCK.REDIUM_BLOCK, 1], coil: true},
    {result: BLOCK.BLUE_BRICK, amount: 1, reqs: [BLOCK.BRICK, 1, BLOCK.BLUEIUM_BLOCK, 1], coil: true},
    {result: BLOCK.URANIUM_BRICK, amount: 1, reqs: [BLOCK.BRICK, 1, BLOCK.URANIUM_BLOCK, 1], coil: true},
    'Misc',
    {result: BLOCK.IRON_BLOCK, amount: 1, reqs: [BLOCK.IRON, 5], coil: false},
    {result: BLOCK.GOLD_BLOCK, amount: 1, reqs: [BLOCK.GOLD, 5], coil: false},
    {result: BLOCK.REDIUM_BLOCK, amount: 1, reqs: [BLOCK.REDIUM, 5], coil: false},
    {result: BLOCK.BLUEIUM_BLOCK, amount: 1, reqs: [BLOCK.BLUEIUM, 5], coil: false},
    {result: BLOCK.URANIUM_BLOCK, amount: 1, reqs: [BLOCK.URANIUM, 5], coil: false, desc: "Can only be found in zones with 'EXTREME' radiation"},
    {result: BLOCK.IRON, amount: 5, reqs: [BLOCK.IRON_BLOCK, 1], coil: false},
    {result: BLOCK.GOLD, amount: 5, reqs: [BLOCK.GOLD_BLOCK, 1], coil: false},
    {result: BLOCK.REDIUM, amount: 5, reqs: [BLOCK.REDIUM_BLOCK, 1], coil: false},
    {result: BLOCK.BLUEIUM, amount: 5, reqs: [BLOCK.BLUEIUM_BLOCK, 1], coil: false},
    {result: BLOCK.URANIUM, amount: 5, reqs: [BLOCK.URANIUM_BLOCK, 1], coil: false, desc: "Can only be found in zones with 'EXTREME' radiation"},
]
let isDuck = false
let selectedRecipe = -1
function
listRecipes()
{
    const list = s('invList')
    list.innerHTML = ''
    for(let i in recipes)
    {
        rec = recipes[i]
        if(typeof rec === 'string')
        {
            const elem = document.createElement('h2')
            elem.innerHTML = rec
            list.appendChild(elem)
        }
        else if(!rec.coil || (rec.coil && isCoil))
        {
            const elem = document.createElement('button')
            elem.className = 'item'
            elem.innerHTML = `${blockData[rec.result].name} ${rec.amount > 1 ? 'x'+rec.amount : ''} <img src='${typeof blockTextures[rec.result] === 'string' ? blockTextures[rec.result] : blockTextures[rec.result][1]}'>`
            if(rec.coil)
                elem.style.outline = '2px solid red'

            let has = true
            for(let j = 0; j < rec.reqs.length; j += 2)
                if(!(inventory[rec.reqs[j]] && inventory[rec.reqs[j]] >= rec.reqs[j+1]))
                    has = false

            elem.style.color = has ? 'black' : 'gray'

            list.appendChild(elem)
            elem.onclick = () => selectRecipe(i)
        }
    }
}
function listInventory()
{
    const list = s('invList')
    list.innerHTML = ''
    for(let i in inventory)if(inventory[i] && inventory[i] > 0)
    {
        const elem = document.createElement('button')
        elem.className = 'item'
        elem.innerHTML = `${blockData[i].name} ${inventory[i] > 1 ? 'x'+inventory[i] : ''} <img src='${typeof blockTextures[i] === 'string' ? blockTextures[i] : blockTextures[i][1]}'>`
        list.appendChild(elem)
        elem.onclick = () => changeBlock(i)
        elem.ondblclick = () => {useItem(+i); listInventory()}
    }
}

function selectRecipe(id)
{
    selectedRecipe = id
    const reqs = recipes[id].reqs
    s('reqs').innerHTML = ''
    for(let j = 0; j < reqs.length; j += 2)
    {
        const id = reqs[j]
        const amount = reqs[j+1]
        const elem = `<div class='reqelem' style='background-image: url(${typeof blockTextures[id] === 'string' ? blockTextures[id] :  blockTextures[id][1]})'>${inventory[id] || 0} / ${amount}</div>`
        s('reqs').innerHTML += elem


    }
    s('cDesc').innerHTML = recipes[id].desc || ''
}

function craftRecipe(id)
{
    const rec = recipes[id]
    for(let i = 0; i < rec.reqs.length; i += 2)
    {
        if(!(inventory[rec.reqs[i]] && inventory[rec.reqs[i]] >= rec.reqs[i+1]))
            return
    }

    for(let i = 0; i < rec.reqs.length; i += 2)
    {
        for(let j = 0; j < rec.reqs[i+1]; ++j)
            removeItem(rec.reqs[i])
    }

    getItem(rec.result, false, rec.amount)
    listRecipes()
    selectRecipe(id)
}

let uiInCrafting = true
function changeInventory(crafting)
{
    s('invList').style.width = crafting ? '300px' : '540px'
    s('reqs').hidden = !crafting
    s('cDesc').hidden = !crafting
    uiInCrafting = crafting

    if(crafting)
        listRecipes()
    else
        listInventory()
}

console.log(document.fonts.check('1px emoji'))

document.fonts.onloadingdone = () => createTextures()

const waypointElems = [
    createElement('face2 waypoint'),
    createElement('face2 waypoint')
]
waypointElems[1].style.setProperty('--c', 'red')

function completeGame()
{
    if(world._gameComplete)
        return
    printMessage('WFS has been activated')
    printMessage('The world has been cleaned of radiation!')
    printMessage('🥳🥳🥳')
    world._gameComplete = true
    emit('game_complete')
}


function startCoil()
{
    isCoil = true
    s('skinTypes').hidden = s('color2').hidden = false
}
if(document.monetization)
    document.monetization.addEventListener('monetizationstart', ()=>startCoil())
createTextures()
