const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { RTCPeerConnection, RTCSessionDescription } = require('wrtc');

let senderStream;

app.use(express.static('public')); // Serve static files from 'public' directory
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Handle incoming video streams
app.post("/broadcast", async (req, res) => {
    const peer = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.stunprotocol.org"
            }
        ]
    });
    peer.ontrack = (e) => handleTrackEvent(e, peer);

    const desc = new RTCSessionDescription(req.body.sdp);
    await peer.setRemoteDescription(desc);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    res.json({ sdp: peer.localDescription });
});

app.post("/consumer", async (req, res) => {
    const peer = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.stunprotocol.org"
            }
        ]
    });

    const desc = new RTCSessionDescription(req.body.sdp);
    await peer.setRemoteDescription(desc);

    if (senderStream) {
        senderStream.getTracks().forEach(track => peer.addTrack(track, senderStream));
    }

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    res.json({ sdp: peer.localDescription });
});

function handleTrackEvent(e) {
    senderStream = e.streams[0];
}

app.listen(5000, () => console.log('Server started on port 5000'));
