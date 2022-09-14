let inventory = []
function getItem(type, transform = true, amount = 1)
{
    if(type === 0)
        return

    if(transform)
    {
        const isBox = type === BLOCK.BOX
        type = transformItem(type)
        if(type === BLOCK.FALLGUYS)
            amount = 10 + ~~(r()*20)
        else if(type === BLOCK.CAN)
            amount = 2 + ~~(r()*5)
        else if(type === BLOCK.PATRON)
            amount = 1 + ~~(r()*2)
        else if(type === BLOCK.SAPPLING)
            amount = 2 + ~~(r()*3)
    }

    if(type === -1)
        return;

    const empty = isInventoryEmpty()

    if(!inventory[type])
        inventory[type] = amount
    else
        inventory[type] += amount
    refreshCounter()

    if(empty)
        scrollBlock(true)
}
function transformItem(type)
{
    if(type === BLOCK.GRASS)
        return  BLOCK.DIRT
    else if(type === BLOCK.STONE)
        return  BLOCK.COBBLESTONE
    else if(type === BLOCK.ORE_IRON)
        return  BLOCK.IRON
    else if(type === BLOCK.ORE_GOLD)
        return  BLOCK.GOLD
    else if(type === BLOCK.ORE_RED)
        return  BLOCK.REDIUM
    else if(type === BLOCK.ORE_BLUE)
        return  BLOCK.BLUEIUM
    else if(type === BLOCK.ORE_URANIUM)
        return  BLOCK.URANIUM
    else if(type === BLOCK.LEAVES)
        return r() > .75 ? (r() > .5 ? BLOCK.SAPPLING : BLOCK.APPLE) : -1
    else if(type === BLOCK.BOX)
        return [BLOCK.FALLGUYS, BLOCK.CAN, BLOCK.PATRON, BLOCK.PICKAXE,BLOCK.SAPPLING][~~(r()*5)]

    return type
}
function hasItem(type)
{
    return (inventory[type] && inventory[type] > 0)
}
function removeItem(type)
{
    if(inventory[type])
        inventory[type] = Math.max(0, inventory[type] - 1)
    refreshCounter()

    if(inventory[type] === 0)
        scrollBlock(true)
}
function refreshCounter()
{
    s('itemCount').innerHTML = inventory[selectedBlock] ? inventory[selectedBlock] : 0
}
function isInventoryEmpty()
{
    for(let i = 1; i < inventory.length; ++i)
        if(inventory[i])
            return false
    return true
}
function saveInventory()
{
    const data = JSON.parse(localStorage.getItem('js13kraft_inventories'))
    data[invSaveName] = [inventory, status, camera]
    localStorage.setItem('js13kraft_inventories', JSON.stringify(data))
}
let invSaveName;
function loadInventory(name)
{
    invSaveName = name
    const savestring = localStorage.getItem('js13kraft_inventories')
    let save
    if(savestring === null)
    {
        localStorage.setItem('js13kraft_inventories', JSON.stringify({}))
        save = {}
    }
    else
    {
        save = JSON.parse(savestring)
        if(save[name])
        {
            inventory = save[name][0]
            status.hp = save[name][1].hp
            status.mask_hp = save[name][1].mask_hp
            camera.x = save[name][2].x
            camera.y = save[name][2].y
            camera.z = save[name][2].z
        }

        else
            inventory = []
    }
    scrollBlock(true)
}

function shareResource()
{
    if(!targetPlayer || !hasItem(selectedId))
        return
    emit('give_resource', [targetPlayer, selectedId])
    removeItem(selectedId)
}
function getResource(id)
{
    getItem(+id, false)
}

