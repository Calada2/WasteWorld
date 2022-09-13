const CHUNK_SIZE = 6
const CHUNK_HEIGHT = 32
let RENDER_DISTANCE = 2

let SESSION_ID = (function(){
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let txt = '';
    for(let i = 0; i < 4; ++i)
    {
        txt += letters[~~(r() * letters.length)];
    }
    return txt;
})()
const blockTextures = []



//let SESSION_ID = '1'

//0 H0ST
//1 CLIENT
let GAME_TYPE

class World
{
    _chunks = []
    _loadedChunks = []
    blockUpdates = []

    constructor(seed)
    {
        //this._seed = +(r()+[]).replace('0.','')
        this._seed = seed || r()
        this._terrainNoise = createNoise2D(()=>this._seed)
        this._biomeNoise = createNoise2D(()=>1-this._seed)
        this._radiationNoise = createNoise2D(()=>this._seed + .3 % 1)
        this._gameComplete = false
        this.setupWorld()
    }
    chunkExists(x,z)
    {
        return (this._chunks[x] && this._chunks[x][z])
    }
    getChunk(x,z,needsFlat)
    {
        if(!this._chunks[x])
        {
            this._chunks[x] = []
        }
        if(!this._chunks[x][z])
        {
            this._chunks[x][z] = this.generateChunk(x, z, needsFlat)
        }

        return this._chunks[x][z]
    }
    getRadiation(x, z)
    {
        return (z < 30 && z > -30 && x < 30 && x > -30) ? 0 : (this._radiationNoise(x / 500, z / 500) + 1) / 2
    }
    getRadiation2(x, z)
    {
        return this._gameComplete ? 0 : this.getRadiation(x, z)
    }
    getBlockFromCamera(x,z,y)
    {
        x = Math.floor(-x / 100)
        z = Math.floor(-z / 100)
        y = Math.floor(-y / 100)
        return this.getBlock(x, z, y)
    }
    getBlock(x,z,y)
    {
        const chunkX = Math.floor(x / CHUNK_SIZE)
        const chunkZ = Math.floor(z / CHUNK_SIZE)
        const blockX = (x % CHUNK_SIZE + CHUNK_SIZE) % CHUNK_SIZE
        const blockZ = (z % CHUNK_SIZE + CHUNK_SIZE) % CHUNK_SIZE

        if(this._chunks[chunkX] && this._chunks[chunkX][chunkZ])
        {
            const block = this._chunks[chunkX][chunkZ].getBlock(blockX, blockZ, y)
            return block
        }

        return null

    }
    setBlock(x,z,y,id)
    {
        if(y < 0 || y >= CHUNK_HEIGHT - 1)
            return
        const chunkX = Math.floor(x / CHUNK_SIZE)
        const chunkZ = Math.floor(z / CHUNK_SIZE)
        const blockX = (x % CHUNK_SIZE + CHUNK_SIZE) % CHUNK_SIZE
        const blockZ = (z % CHUNK_SIZE + CHUNK_SIZE) % CHUNK_SIZE

        if(this._chunks[chunkX] && this._chunks[chunkX][chunkZ])
        {
            this._chunks[chunkX][chunkZ].setBlock(blockX, blockZ, y, id)
        }

        if(this._loadedChunks.includes(this._chunks[chunkX][chunkZ]))
        {
            if(blockX === 0 && this.chunkExists(chunkX - 1, chunkZ))
                this._chunks[chunkX - 1][chunkZ].rerender()
            else if(blockX === CHUNK_SIZE - 1 && this.chunkExists(chunkX + 1, chunkZ))
                this._chunks[chunkX + 1][chunkZ].rerender()
            if(blockZ === 0 && this.chunkExists(chunkX, chunkZ - 1))
                this._chunks[chunkX][chunkZ - 1].rerender()
            else if(blockZ === CHUNK_SIZE - 1 && this.chunkExists(chunkX, chunkZ + 1))
                this._chunks[chunkX][chunkZ + 1].rerender()
        }
    }
    generateChunk(x, z, needsFlat)
    {
        const chunk = new Chunk(x, z, this._terrainNoise, this._biomeNoise, this, needsFlat)
        if(this.blockUpdates[x + '_' + z])
        {
            this.blockUpdates[x + '_' + z].forEach(data => chunk.setBlock(data[0], data[1], data[2], data[3]))
        }
        return chunk
    }
    setupWorld()
    {
        this.setupEnd()
        this.loadChunks2()
        this.render()
    }
    setupEnd()
    {
        const endX = ~~(Math.sin(this._seed * Math.PI * 2) * 60)
        const endZ = ~~(Math.cos(this._seed * Math.PI * 2) * 60)
        this._endChunkId = {x: endX, z: endZ}
        this._endChunk = this.getChunk(endX, endZ, true)
        for(let x = -1; x <= 1; ++x)for(let z = -1; z <= 1; ++z)
            this.getChunk(endX + x, endZ + z, true)
        setTransform(waypointElems[1], `translate3D(${(endX+.5)*CHUNK_SIZE*100}px,-70%,${(endZ+.5)*CHUNK_SIZE*100}px)`)

    }
    render()
    {
        for(let i in this._loadedChunks) if(this._loadedChunks[i])
        {
            s('scene').appendChild(this._loadedChunks[i].elem)
        }
    }
    loadChunks2()
    {
        const visibleChunks = []
        for(let x = -(RENDER_DISTANCE + 1); x <= RENDER_DISTANCE + 1; ++x) for(let z = -(RENDER_DISTANCE + 1); z <= RENDER_DISTANCE + 1; ++z)
        {
            this.getChunk(currentChunk.x  + x,currentChunk.z + z)
        }
        for(let x = -RENDER_DISTANCE; x <= RENDER_DISTANCE; ++x) for(let z = -RENDER_DISTANCE; z <= RENDER_DISTANCE; ++z)
        {
            const chunk = this.getChunk(currentChunk.x  + x,currentChunk.z + z)
            visibleChunks.push(chunk)

            chunk.loaded = true

            if(!this._loadedChunks.includes(chunk))
                this._loadedChunks.push(chunk)
        }


        const toRemove = []
        for(let i = 0; i < this._loadedChunks.length; ++i) if(this._loadedChunks[i])
        {
            const chunk = this._loadedChunks[i]
            if(visibleChunks.includes(chunk))
            {
                if(!chunk.rendered)
                    chunk.renderChunk()
                if(!s('scene').contains(chunk.elem))
                {
                    s('scene').appendChild(chunk.elem)
                    chunk.flyInOut(false)
                }
            }
            else
            {
                toRemove.push(chunk)
            }
        }
        toRemove.forEach(chunk => this.unloadChunk2(chunk))

    }
    unloadChunk2(chunk)
    {
        if(this._loadedChunks.includes(chunk))
        {
            chunk.flyInOut(true)
            this._loadedChunks.splice(this._loadedChunks.indexOf(chunk),1)
            setTimeout(()=>{
                if(s('scene').contains(chunk.elem))
                    s('scene').removeChild(chunk.elem)
            },400)

        }
    }

}
class Chunk
{
    _blocks = []
    _grassBlocks = []
    _sapplings = []
    _plantCount = 0

    constructor(x, z, terrainNoise, biomeNoise, world, needsFlat = false)
    {
        this._id = {x: x, z: z}
        this._terrainNoise = terrainNoise
        this._biomeNoise = biomeNoise
        this._world = world // TODO: Create a new method for passing neighbouring chunk data to renderer
        this.generateBlocks()
        if(needsFlat)
            this.flattenChunk()
        if(x === world._endChunkId.x && z === world._endChunkId.z)
            this.setupEndChunk()
        this.rendered = false
        this.loaded = false

        this.elem = createElement('container')
        this.elem.style.transform = `translate3D(${this._id.x * CHUNK_SIZE * 100}px, 0, ${this._id.z * CHUNK_SIZE * 100}px)`

        this._blocks2D = []
        this._blocks2Dref = {}

    }
    renderChunk()
    {
        this.render()
        this.rendered = true
    }
    generateBlocks()
    {
        //this._blocks = (new Array(CHUNK_SIZE)).fill((()=>new Array(CHUNK_SIZE)).fill((new Array(CHUNK_HEIGHT)).fill(0)))

        this._blocks = []
        for(let x = 0; x < CHUNK_SIZE; ++x)
        {
            this._blocks[x] = []
            for(let z = 0; z < CHUNK_SIZE; ++z)
            {
                this._blocks[x][z] = []
                for(let y = 0; y < CHUNK_HEIGHT; ++y)
                    this._blocks[x][z][y] = 0;
            }

        }

        let h0;
        let oreType;
        if(Math.abs(this._id.x) % 4 === 1 && Math.abs(this._id.z) % 2 === 1)
            oreType = 2
        else if(Math.abs(this._id.x) % 4 === 3 && Math.abs(this._id.z) % 2 === 1)
            oreType = 3
        else if(Math.abs(this._id.x) % 2 === 0 && Math.abs(this._id.z) % 2 === 0)
            oreType = 1
        else
            oreType = 0

        for(let x = 0; x < CHUNK_SIZE; ++x) for(let z = 0; z < CHUNK_SIZE; ++z)
        {
            const tx = (this._id.x * CHUNK_SIZE + x) / 40
            const ty = (this._id.z * CHUNK_SIZE + z) / 40
            const height = Math.floor(this._terrainNoise(tx,ty) * 5 + 18)
            if(x === 0 && z === 0)
                h0 = height
            const biomeType = this._biomeNoise(tx / 5, ty / 5) > -.2 ? 'plains' : 'desert'
            const radiationLevel = this._world.getRadiation(tx*40,ty*40)
            const biome = biomeType === 'plains' ? (radiationLevel > .5 ? BLOCK.DIRT : BLOCK.GRASS) : BLOCK.SAND
            this._blocks[x][z][height] = biome
            if(biome === BLOCK.GRASS)
                this._grassBlocks.push(`${x}|${z}|${height}`) //Only works for single digit chunk sizes
            let j=0;

            if(radiationLevel > .75)
                oreType = 4

            for(let y2 = height + 1; y2 < CHUNK_HEIGHT; ++y2)
            {
                if(j++ < 4)
                {
                    this._blocks[x][z][y2] = biome === BLOCK.SAND ? BLOCK.SAND : BLOCK.DIRT
                }
                else
                {
                    let block = BLOCK.STONE
                    if(this._terrainNoise(ty*7, tx*7) > (1-(y2 / ((CHUNK_HEIGHT) * 2.2))))
                        block = BLOCK.ORE_IRON + oreType

                    this._blocks[x][z][y2] = block
                }
                if(y2 === CHUNK_HEIGHT - 1)
                this._blocks[x][z][y2] = BLOCK.BEDROCK
            }

            if(biomeType === 'plains' && (x+z)%3===0 && x > 0 && x < CHUNK_SIZE - 1 && z > 0 && z < CHUNK_SIZE - 1 && (this._biomeNoise((this._id.x + x)*10, (this._id.z + z)*10) * this._terrainNoise((this._id.z+z)*10, (this._id.x+x)*10)) > .5)
                placeStructure(this._blocks, 'tree' + (radiationLevel > .5 ? '2' : ''), height, x, z)

        }



        if((this._terrainNoise(this._id.x*5, this._id.z*5) * this._terrainNoise(this._id.z*5, this._id.x*5)) > .75)
            placeStructure(this._blocks, 'house', h0)



    }
    flattenChunk()
    {
        for(let x = 0; x < CHUNK_SIZE; ++x) for(let z = 0; z < CHUNK_SIZE; ++z)for(let y = 0; y < CHUNK_HEIGHT - 8; ++y)
            if(y < CHUNK_HEIGHT - 12)
                this._blocks[x][z][y] = BLOCK.AIR
            else
                this._blocks[x][z][y] = BLOCK.STONE_BRICK
    }
    setupEndChunk()
    {
        this._endSlots = []
        this._isEndChunk = true
        for(let x = 0; x < CHUNK_SIZE; ++x) for(let z = 0; z < CHUNK_SIZE; ++z)for(let y = CHUNK_HEIGHT - 15; y < CHUNK_HEIGHT - 12; ++y)
            if(((x === 1 || x === CHUNK_SIZE - 2) && (z === 0 || z === CHUNK_SIZE - 1) || ((z === 1  || z === CHUNK_SIZE - 2) && (x === 0 || x === CHUNK_SIZE - 1))) && y === CHUNK_HEIGHT - 14)
            {
                this._blocks[x][z][y] = BLOCK.AIR
                this._endSlots.push(() => this.getBlock(x,z,y))
            }
        else
            this._blocks[x][z][y] = BLOCK.BEDROCK
    }
    getBlock(x,z,y)
    {
        if(this._blocks[+x] && this._blocks[+x][+z] && this._blocks[+x][+z][+y])
            return this._blocks[+x][+z][+y]
        else if(x === -1 || z === -1 || x === CHUNK_SIZE || z === CHUNK_SIZE)
            return this._world.getBlock(this._id.x * CHUNK_SIZE + x, this._id.z * CHUNK_SIZE + z, y)
        else
            return  0

    }
    setBlock(x,z,y,id)
    {
        if(isPlant(this.getBlock(x,z,y)) && this._blocks2Dref[`${x}|${z}|${y}`])
        {
            this._blocks2Dref[`${x}|${z}|${y}`].parentElement.removeChild(this._blocks2Dref[`${x}|${z}|${y}`])
            this._blocks2D[this._blocks2D.indexOf(this._blocks2Dref[`${x}|${z}|${y}`])] = undefined
            this._blocks2Dref[`${x}|${z}|${y}`] = undefined
            --this._plantCount
        }
        if(isPlant(id))
        {
            const b = this.create2dBlock(id,x,y,z)
            this._blocks2D.push(b)
            this._blocks2Dref[`${x}|${z}|${y}`] = b
            ++this._plantCount
        }

        if(this.getBlock(x,z,y) === BLOCK.GRASS)
            delete this._grassBlocks[this._grassBlocks.indexOf(`${x}|${z}|${y}`)]
        if(id === BLOCK.GRASS)
            this._grassBlocks.push(`${x}|${z}|${y}`)

        if(this.getBlock(x,z,y) === BLOCK.SAPPLING)
            delete this._sapplings[this._grassBlocks.indexOf(`${x}|${z}|${y}`)]
        if(id === BLOCK.SAPPLING)
            this._sapplings.push(`${x}|${z}|${y}`)

        this._blocks[x][z][y] = id
        this.rerender()
        if(this._isEndChunk && !this._world._gameComplete)
            this.checkCompletion()
    }
    checkCompletion()
    {
        for(let i in this._endSlots)
            if(this._endSlots[i]() !== BLOCK.NUKE)
                return

        completeGame()
    }
    flyInOut(out)
    {
        this.elem.style.transform = `translate3D(${this._id.x * CHUNK_SIZE * 100}px, ${!out * 1000}px, ${this._id.z * CHUNK_SIZE * 100}px)`
        this.elem.style.transition = 'transform 400ms'
        setTimeout(()=>{
            this.elem.style.transform = `translate3D(${this._id.x * CHUNK_SIZE * 100}px, ${out * 1000}px, ${this._id.z * CHUNK_SIZE * 100}px)`
        })
    }


    rerender()
    {
        if(!this.rendered)
            return
        this.elem.innerHTML = ''
        this.render()
    }
    render()
    {
        const elem = this.elem


        for(let y = 0; y < CHUNK_HEIGHT; ++y)
        {
            const face = this.renderSide(y, 'y')
            if(face)
                elem.appendChild(face)
        }

        for(let z = 0; z < CHUNK_SIZE; ++z)
        {
            const face = this.renderSide(z, 'z')
            if(face)
                elem.appendChild(face)
        }

        for(let x = 0; x < CHUNK_SIZE; ++x)
        {
            const face = this.renderSide(x, 'x')
            if(face)
                elem.appendChild(face)
        }

        for(let i in this._blocks2D)if(this._blocks2D[i])
            elem.appendChild(this._blocks2D[i])


        return elem
    }
    create2dBlock(id,x,y,z)
    {
        const elem = createElement('face2 block2D')
        elem.x = x + CHUNK_SIZE*this._id.x
        elem.y = y
        elem.z = z + CHUNK_SIZE*this._id.z
        elem.style.backgroundImage = `url(${blockTextures[id]})`
        setTransform(elem, `translate3D(${x*100}px, ${y*100}px, ${z*100+50}px) rotateY(var(--rot))`)
        return elem
    }
    renderSide(pos, side)
    {
        /*
            side Y
            1 = X
            2 = Z

            side Z
            1 = X
            2 = Y

            side X
            1 = Z
            2 = Y
         */
        let face
        //let y = pos
        let pos1, pos2, size1, size2
        let [min1, max1, min2, max2] = [-1, -1, -1, -1]

        if(side === 'y')
        {
            size1 = CHUNK_SIZE
            size2 = CHUNK_SIZE
        }
        else if(side === 'z')
        {
            size1 = CHUNK_SIZE
            size2 = CHUNK_HEIGHT
        }
        else if(side === 'x')
        {
            size1 = CHUNK_SIZE
            size2 = CHUNK_HEIGHT
        }

        for(let p1 = 0; p1 < size1; ++p1) for(let p2 = 0; p2 < size2; ++p2)
        {
            let x, y, z, x2, y2, z2;
            if(side === 'y')
            {
                x = p1
                y = pos
                z = p2
                x2 = p1
                y2 = pos - 1
                z2 = p2
            }
            else if(side === 'z')
            {
                x = p1
                y = p2
                z = pos
                x2 = p1
                y2 = p2
                z2 = pos - 1
            }
            else if(side === 'x')
            {
                x = pos
                y = p2
                z = p1
                x2 = pos - 1
                y2 = p2
                z2 = p1
            }
            const block = this.getBlock(x,z,y)
            const block2 = this.getBlock(x2,z2,y2)
            if((!isTransparent(block) || !isTransparent(block2)) && !(!isTransparent(block) && !isTransparent(block2)))
            {
                if(min1 === -1)
                    min1 = p1
                if(min2 === -1)
                    min2 = p2
                max2 = Math.max(p2, max2)
                max1 = Math.max(p1, max1)
                min1 = Math.min(p1, min1)
                min2 = Math.min(p2, min2)
            }
        }
        if(min1 > -1)
        {
            let width = max1 - min1 + 1
            let height = max2 - min2 + 1
            face = createElement('face2')
            face.setAttribute('face-orientation', side)
            face.style.width = width * 100 + 'px'
            face.style.height = height * 100 + 'px'
            if(side === 'y')
                face.style.transform = `translate3D(${min1 * 100}px, ${pos*100}px, ${min2 * 100}px) rotateX(90deg)`
            else if(side === 'z')
                face.style.transform = `translate3D(${min1 * 100}px, ${min2*100}px, ${pos * 100}px) rotateX(0deg)`
            else if(side === 'x')
                face.style.transform = `translate3D(${pos * 100}px, ${min2*100}px, ${min1 * 100}px) rotateY(-90deg)`
            let bgImgString = ''
            let bgPosString = ''
            let bgSizeString = ''

            if(side === 'y')
                face.style.filter = 'brightness(90%)'
            else if(side === 'z')
                face.style.filter = 'brightness(80%)'



            for(let p1 = min1; p1 <= max1; ++p1) for(let p2 = min2; p2 <= max2; ++p2)
            {
                let x, y, z, x2, y2, z2;
                if(side === 'y')
                {
                    x = p1
                    y = pos
                    z = p2
                    x2 = p1
                    y2 = pos - 1
                    z2 = p2
                }
                else if(side === 'z')
                {
                    x = p1
                    y = p2
                    z = pos
                    x2 = p1
                    y2 = p2
                    z2 = pos - 1
                }
                else if(side === 'x')
                {
                    x = pos
                    y = p2
                    z = p1
                    x2 = pos - 1
                    y2 = p2
                    z2 = p1
                }

                const block = this.getBlock(x,z,y)
                const block2 = this.getBlock(x2,z2,y2)
                if((!isTransparent(block) || !isTransparent(block2)) && !(!isTransparent(block) && !isTransparent(block2)))
                {
                    if(bgImgString !== '')
                        bgImgString += ', '
                    if(bgPosString !== '')
                        bgPosString += ', '
                    if(bgSizeString !== '')
                        bgSizeString += ', '
                    const blockActive = !isTransparent(block) ? block : block2
                    let imgName;

                    const texture = blockTextures[blockActive]
                    const imgPos = `${(p1 - min1) * 100}px ${(p2 - min2) * 100}px`

                    if(typeof texture === 'string')
                        imgName = texture
                    else if(side === 'y')
                        imgName = texture[0]
                    else
                        imgName = texture[1]


                    imgName = imgName.includes('blob') ? imgName : 'textures/' + imgName
                    bgImgString += `url(${imgName})`
                    bgPosString += imgPos
                    bgSizeString += '100px 100px'
                }
            }
            face.style.backgroundImage = bgImgString
            face.style.backgroundPosition = bgPosString
            face.style.backgroundSize = bgSizeString
        }

        return face
    }
}
function createElement(className)
{
    const elem = document.createElement('div')
    elem.className = className
    return elem
}
function placeStructure(blocks, name, height, sx = 0, sz = 0, biome = 'plains')
{
    if(name === 'house')
    {
        for(let x = 0; x < 5; ++x)for(let z = 0; z < 6; ++z)for(let y = 0; y < 4; ++y)
        {
            if((x === 0 || x === 4 || z === 0 || z === 5 || y === 0 || y === 3))
                blocks[x][z][height - y] = BLOCK.BRICK
            else
                blocks[x][z][height - y] = BLOCK.AIR
        }
        blocks[0][2][height - 1] = blocks[0][2][height - 2] = BLOCK.AIR
        blocks[3][4][height - 1] = BLOCK.BOX
    }
    else if(name === 'tree' || name === 'tree2')
    {
        for(let y = 0; y < 6; ++y)
        {
            blocks[sx][sz][height - y] = BLOCK.LOG
            if(name === 'tree')
            {
                for(let n = 0; n < 9; ++n) if(y > 2 && (n !== 4 || y === 5))
                {
                    blocks[sx + (n % 3) - 1][sz + ~~(n / 3) - 1][height - y] = BLOCK.LEAVES
                }
            }
        }
    }
}

function placeTree(x, z, y)
{
    for(let y2 = 1; y2 < 6; ++y2)
    {
        const b = world.getBlock(x,z,y-y2)
        if((b !== BLOCK.AIR && b !== BLOCK.LEAVES))
            return
    }

    for(let y2 = 0; y2 < 6; ++y2)
    {
        updateBlock(x,z,y - y2, BLOCK.LOG)
        for(let n = 0; n < 9; ++n) if(y2 > 2 && (n !== 4 || y2 === 5))
        {
            const x3 = x + (n%3) - 1
            const z3 = z + ~~(n/3) - 1
            const y3 = y - y2
            if(world.getBlock(x3,y3,z3) === BLOCK.AIR)
                updateBlock(x3,z3,y3,BLOCK.LEAVES)
        }
    }
}
function isTransparent(id)
{
    return (id === BLOCK.AIR || isPlant(id))
}
function isPlant(id)
{
    return (id === BLOCK.SAPPLING || id === BLOCK.TULIP || id === BLOCK.ROSE || id === BLOCK.POPPY || id === BLOCK.FLOWER_CYAN || id === BLOCK.DUCK)
}
