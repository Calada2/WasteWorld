function createPointer(color = 'black')
{
    const elem = createElement('container')
    for(let i = 0; i < 6; i++)
    {
        const face = createElement('face2')
        face.style.width = face.style.height = '102px'
        face.style.transformOrigin = '50% 50%'
        face.style.boxSizing = 'border-box'
        face.style.border = 'solid 3px ' + color
        if(i < 4)
            setTransform(face, `rotateY(${i*90}deg) translateZ(51px)`)
        else
            setTransform(face, `rotateX(${i*180+90}deg) translateZ(51px)`)
        elem.appendChild(face)
    }
    return elem
}

function createPlayerModel(color, hair, skin, id)
{
    const elem = createElement('container')
    const head = createElement('container')
    elem.style.setProperty('--hair', hair || '#ff3f5a')
    elem.style.setProperty('--bg', color || '#deac9d')
    elem.style.setProperty('--skin', skin || '#deac9d')
    head.style.transformOrigin = '50% 25px'
    for(let i = 0; i < 6; i++) {
        const face = createElement('face2 playerFace')
        face.style.width = face.style.height = '50px'
        face.style.transformOrigin = '50% 50%'
        face.style.border = 'solid 1px rgba(0,0,0,.5)'
        face.idp = id
        if (i < 4)
            face.style.transform = `translate(-50%,-50%) rotateY(${i * 90}deg) translateZ(25px)`
        else
            face.style.transform = `translate(-50%,-50%) rotateX(${i * 180 + 90}deg) translateZ(25px)`
        head.appendChild(face)
    }
    elem.appendChild(head)
    head.style.transform = 'translateY(-135px)'

    for(let i = 0; i < 4; ++i)
    {
        const side = createElement('face2 playerSide')
        side.style.transform = `translate(-50%, -100%) rotateY(${i * 90}deg) translateZ(30px) rotateX(12deg)`
        side.idp = id
        elem.appendChild(side)
    }
    head.style.transition = elem.style.transition = 'transform 100ms linear'
    elem.head = head

    /*const mask = createGasMask()
    mask.style.transform = 'translate3D(-15px, 0px,-35px)'
    head.appendChild(mask)*/

    elem.mask = createGasMask()
    head.appendChild(elem.mask)
    elem.mask.hidden = true


    return elem
}

function createGasMask()
{
    const elem = createElement('container mask')
    for(let i = 0; i < 3; ++i)
    {
        const side = createElement('face2 maskSide')
        setTransform(side, `rotateZ(${120*i}deg) translateY(-8.5px) rotateX(90deg) `)
        elem.appendChild(side)
    }
    elem.appendChild(createElement('face2 maskFront'))
    for(let i = 0; i < 2; ++i)
    {
        const filter = createElement('face2 maskFilter')
        setTransform(filter, `translateY(-5px) rotate(${-50 + 100*i}deg) translateY(10px) scale(.9)`)
        elem.appendChild(filter)
    }
        elem.style.transform = 'translate3D(-15px, 0px,-35px)'
    return elem
}
