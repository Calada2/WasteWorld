
function createTextures()
{
    const textureData = [
        null,
        [
            {h:140,s:60,l:35, n:15},
            {h:'y>(ss=(3+r()*3))?20:140', s:'y>ss?50:60', l: 'y>ss?45:35', n:13},
        ],
        {h:60,s:'r()*30+60',l:70, n:15},
        {h:0, s:0, l: '(Math.abs(noise(x/6,y/6)) < .35 ? 35 : 50)', n:8},
        {h:0, s:0, l: 50, n:8},
        {h:30, s:70, l: 'y%4===0?40:55', n:10},
        {h:20, s:50, l: 45, n:13},
        {h:0, s:0, l: '((x%16===y%16)||((16-x)%16===y%16)?30:40)',n:-15},
        [
            {h:24, s: 68, l: 'Math.min(8-Math.abs(x-8),8-Math.abs(y-8))/10*50+30', n: 5},
            {h:24, s: 68, l: '(noise(x/10-4,y/2-4)>.4?20:30)', n: 5},
        ], //log
        {h:295,s:90,l:'(y%4===x%4?40:50)', n: 3}, //fallguys
        [
            {h:90, s:70, l: '((y%15===0||~~(x%3)===0||~~(y%3)===0?2:0)?40:65)', n:5},
            {e:'⚡',h:90, s:70, l: '((y%15===0||~~(x%3)===0?2:0)?40:65)', n:5},
        ],
        {h:0, s:50, l: '((y%4===0||x%8===(~~(y/4)%2===0?2:0))?45:55)', n:5},  //brick
        [
            {h:38,s:65,l:'(((side||x===7||x===8)?0:(((x+y)/32)*30+10))+40)', n:5},
            {h:38,s:65,l:'((side?0:(((x+y)/32)*30+10))+40)', n:5}
        ],  //box
        {h:110, s:75, l: '(Math.abs(noise(x/6-4,y/6-4)) < .35 ? 35 : 50)', n:15},
        {h:40, s:'noise(x/6-4,y/6-4) > .2 ? 30: 0', l: 50,n:8},
        {h:40, s:'noise(x/6-4,y/6-4) > .2 ? 80: 0', l: 50,n:8},
        {h:340, s:'noise(x/6-4,y/6-4) > .2 ? 60: 0', l: 50,n:8},
        {h:210, s:'noise(x/6-4,y/6-4) > .2 ? 60: 0', l: 50,n:8},
        {h:140, s:'noise(x/6-4,y/6-4) > .2 ? 60: 0', l: 50,n:8},
        {h:20, s:50, l: '((y%4===0||x%4===(~~(y/4)%2===0?2:0))?30:45)',n:13},
        {h:40,s:20,l:'((side?0:(((32-(x+y))/32)*40))+50)',n:3},
        {h:60,s:80,l:'((side?0:(((32-(x+y))/32)*30))+40)',n:3},
        {h:350,s:80,l:'((side?0:(((32-(x+y))/32)*30))+40)',n:3},
        {h:220,s:80,l:'((side?0:(((32-(x+y))/32)*30))+40)',n:3},
        {h:120,s:80,l:'((side?0:(((32-(x+y))/32)*30))+40)',n:3}, //uranium block
        //{h:0, s:0, l: '((y%4===0||x%8===(~~(y/4)%2===0?2:0))?40:50)+r()*8'}, stone brick, maybe the better looking
        {h:0, s:0, l: '((y%8===0||x%8===(~~(y/8)%2===0?4:0))?40:50)', n: 8},
        {e: '🌱', b: '🌱'},
        {h:60, s:75, l: '((y%8===0||x%8===(~~(y/8)%2===0?4:0))?55:70)',n:10},
        {h:40, s:20, l: '(((y%4===0||x%8===(~~(y/4)%2===0?2:0))?0:20))+50',n:4},
        {h:60, s:80, l: '(((y%4===0||x%8===(~~(y/4)%2===0?2:0))?0:10))+40',n:4},
        {h:350,s:80, l: '(((y%4===0||x%8===(~~(y/4)%2===0?2:0))?0:10))+40',n:4},
        {h:220,s:80, l: '(((y%4===0||x%8===(~~(y/4)%2===0?2:0))?0:10))+40',n:4},
        {h:120,s:80, l: '(((y%4===0||x%8===(~~(y/4)%2===0?2:0))?0:10))+40',n:4},
        {h: 60, s:'(x < 8 === y < 8) ? 0 : 75 ', l: '((y%8===0||x%8===0)?40:50)+((x < 8 === y < 8) ? 0 : 20)',n:8},
        {h: 60, s:'(x < 8 === y < 8) ? 0 : 10 ', l: '((y%8===0||x%8===0)?20:30)+((x < 8 === y < 8) ? 0 : 60)',n:8},
        {h: '(x < 8 === y < 8) ? 0 : 240', s:60, l: '((y%8===0||x%8===0)?52:60)', n:5},
        {h:0, s:0, l: '((y%8===0||x%8===(~~(y/8)%2===0?4:0))?80:90)', n:8},
        {e: '🌷', b: '🌷'},
        {e: '🌹', b: '🌹'},
        {e: '🌼', b: '🌼'},
        {e: '🌹', b: '🌹', filter: 'hue-rotate(200deg) brightness(1.5)'},
        {e: '🦆', b: '🦆'},
    ]
    textureData[100] = null;
    textureData.push(
        ...[
            {e: '🪨', b: '=', filter: 'contrast(.5) sepia(.5) saturate(1.3) hue-rotate(0deg)'},
            {e: '🪨', b: '=', filter: 'contrast(.3) sepia(1) saturate(2) hue-rotate(10deg)'},
            {e: '🪨', b: '=', filter: 'contrast(.3) sepia(1) saturate(2) hue-rotate(300deg)'},
            {e: '🪨', b: '=', filter: 'contrast(.3) sepia(1) saturate(2) hue-rotate(180deg)'},
            {e: '🪨', b: '=', filter: 'contrast(.3) sepia(1) saturate(2) hue-rotate(100deg)'},
            {e: '⛏', b: '⛏'},
            {e: '🍎', b: '🍎'},
            {e: '🥫', b: '🥫'},
            {e: '🥫', b: '🥫', filter: 'hue-rotate(260deg)'},
            {e: '🧵', b: '🧵', filter: 'grayscale(1)'},
            {e: '🧭', b: '🧭'},
            {e: '🧭', b: '🧭', filter: 'hue-rotate(120deg)'},

        ]
    )
    const c = s('texture')
    const ctx = c.getContext('2d')
    ctx.font = '14px emoji'
    const size = 16
    c.width = c.height = size
    const noise = createNoise2D(()=>0)

    for(let i in textureData) if(textureData[i] !== null)
    {
        let loopamount = textureData[i].length || 1
        for(let j = 0; j < loopamount; ++j)
        {
            const t = loopamount > 1 ? textureData[i][j] : textureData[i]
            c.width = c.height = size
            if(i < 100) {
                for(let x = 0; x < size; ++x)for(let y = 0; y < size; ++y)
                {

                    const side = (x===0||x===size-1||y===0||y===size-1)
                    const color = `hsl(${eval(t.h)}, ${eval(t.s)}%, ${eval(t.l) + t.n * r()}%)`
                    ctx.fillStyle = color
                    ctx.fillRect(x,y,1,1)

                }

                if(isPlant(+i))
                {
                    c.width = c.height = 1
                    c.width = c.height = size
                }
                ctx.font = '13px emoji'
                if(t.e)
                    ctx.fillText(t.e,1,12.5)

                ctx.filter = t.filter
                ctx.drawImage(c,0,0)
            }

            else
            {
                //ctx.filter = 'contrast(.3) sepia(1)'
                c.width = c.height = 1
                c.width = c.height = size
                //ctx.fillText('🪨',1,13)
                ctx.font = '14px emoji'
                ctx.fillText(t.b,1,13)
                ctx.fillText(t.e,1,13)
                ctx.filter = t.filter
                ctx.drawImage(c,0,0)

            }
            c.toBlob(blob => {
                if(loopamount > 1)
                {
                    if(!blockTextures[i])
                        blockTextures[i] = []

                    blockTextures[i][j]=(URL.createObjectURL(blob))
                }
                else
                    blockTextures[i]=(URL.createObjectURL(blob))
            })
        }
    }
}


