import { io } from 'socket.io-client'

const socket = io('https://chat-backend-nl2o.onrender.com/', {
  autoConnect: true,
})

export default socket
