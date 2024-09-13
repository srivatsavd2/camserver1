const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import the cors package
const webrtc = require('wrtc');

const app = express();
let senderStream;

// Enable CORS for all origins (adjust for production as needed)
app.use(cors());

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/consumer', async (req, res) => {
    const peer = new webrtc.RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.stunprotocol.org' }
        ]
    });

    const desc = new webrtc.RTCSessionDescription(req.body.sdp);
    await peer.setRemoteDescription(desc);

    if (senderStream) {
        senderStream.getTracks().forEach(track => peer.addTrack(track, senderStream));
    }

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    res.json({ sdp: peer.localDescription });
});

app.post('/broadcast', async (req, res) => {
    const peer = new webrtc.RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.stunprotocol.org' }
        ]
    });

    peer.ontrack = (event) => {
        senderStream = event.streams[0];
    };

    const desc = new webrtc.RTCSessionDescription(req.body.sdp);
    await peer.setRemoteDescription(desc);

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    res.json({ sdp: peer.localDescription });
});

app.listen(5000, () => console.log('Server started on port 5000'));
