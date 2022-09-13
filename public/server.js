/**
 * Socket.IO on connect event
 * @param {Socket} socket
 */

const hosts = {}
const clients = {}
const clientIds = {}
const seed = {}
const isPublic = {}
const worldName = {}

function emit(target, name, data)
{
    if(target)
        target.emit(name, data)
}

function emitForAllClients(id, name, data)
{
    clients[id].forEach(client => {
        emit(client,name, data)
    })
}


module.exports = {

    io: (socket) => {

        let SESSION_ID;
        let GAME_TYPE



        socket.on("set_id", (data) => {
            console.log("The session ID is: " + data[0]);
            GAME_TYPE = 'host'
            SESSION_ID = data[0];
            seed[SESSION_ID] = data[1]
            hosts[SESSION_ID] = socket
            clients[SESSION_ID] = []
            clientIds[SESSION_ID] = []
            console.log(SESSION_ID + ' seed is: ' + data[1])
            const public = data[2]

            worldName[SESSION_ID] = data[3]

            if(public)
                isPublic[SESSION_ID] = true
        });



        socket.on('block_update', data =>
        {
            if(GAME_TYPE === 'host')
                emitForAllClients(SESSION_ID, 'block_update', data)
            else
                emit(hosts[SESSION_ID],'block_update', data)
        })


        socket.on("session_join", (data) => {
            SESSION_ID = data[0];

            if(!hosts[SESSION_ID])
                return
            console.log("The session ID is: " + data[0]);
            GAME_TYPE = 'client'

            emit(hosts[SESSION_ID], 'player_join', [socket.id, ...(data.splice(1,4))])
            clientIds[SESSION_ID][socket.id] = clients[SESSION_ID].length
            clients[SESSION_ID].push(socket)


            socket.emit("send_seed", seed[SESSION_ID]);
        })

        socket.on('send_block_updates', data => {
           emit(clients[SESSION_ID][clientIds[SESSION_ID][data[0]]],'send_block_updates', data[1])
        })



        socket.on('movement_all', players => {
            if(!SESSION_ID)
                return
            emitForAllClients(SESSION_ID,'movement_all', players)
        })

        socket.on('player_join', data => {
            if(GAME_TYPE === 'host')
                emitForAllClients(SESSION_ID, 'update_data', data)
        })


        socket.on('movement', pos => {
            emit(hosts[SESSION_ID],'movement', [socket.id, pos])
        })



        socket.on("error", (e) => {
            console.log("Connection error!");
            console.log(e);
        });

        socket.on("disconnect", () => {
            if(GAME_TYPE === 'client' && hosts[SESSION_ID])
                emit(hosts[SESSION_ID], 'player_disconnect', socket.id)
            else if(GAME_TYPE === 'host')
            {
                //emit a gameend for the clients and repload the game for them
                emitForAllClients(SESSION_ID, 'host_disconnect')
                delete hosts[SESSION_ID]
                //delete clients[SESSION_ID]
            }
        });

        socket.on('server_list', (e) => {
            const list = []

            for (const [id,host] of Object.entries(hosts)) {
                if(isPublic[id])
                    list.push([id, worldName[id]])
            }

           emit( socket, 'server_list', list)
        });

        socket.on('message', data => {

            if(GAME_TYPE === 'host')
                emitForAllClients(SESSION_ID,'message', data)
            else
                emit(hosts[SESSION_ID], 'message', data)
        })

        socket.on('give_resource', data => {
            let target;

            if(data[0] === 'host')
                target = hosts[SESSION_ID]
            else
                target = clients[SESSION_ID][clientIds[SESSION_ID][data[0]]]

            emit(target, 'give_resource', data[1])
        })

        socket.on('game_complete', data => {
            emitForAllClients(SESSION_ID,'game_complete')
            emit(hosts[SESSION_ID], 'game_complete')
        })

        socket.on('server_exists', data => {
            emit(socket, 'server_exists', [Boolean(hosts[data]), data])
        })

        console.log("Connected: " + socket.id);
    }

};
