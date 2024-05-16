import { useCallback, useEffect, useRef, useState } from "react";
import UseStateWithCallback from "./useStateWithCallback";
import socket from "../Socket/index";
import ACTIONS from "../Socket/action";
import freeice from "freeice";

export const LOCAL_VIDEO = "LOCAL_VIDEO";

const useWebRTC = (roomID) => {
  const [clients, updateClients] = UseStateWithCallback([]);
  const [inVideoChat, setInVideoChat] = useState(false);
  console.log(setInVideoChat);

  const addNewClient = useCallback(
    (newClient, cb) => {
      if (!clients.includes(newClient)) {
        updateClients((prevClients) => [...prevClients, newClient], cb);
      }
    },
    [clients, updateClients]
  );
  const peerConnections = useRef({});
  const localMediaStream = useRef(null);
  const peerMediaElements = useRef({
    [LOCAL_VIDEO]: null,
  });

  useEffect(() => {
    async function handleNewPeer({ peerID, createOffer }) {
      if (peerID in peerConnections.current) {
        return console.warn(`Already connect to peer ${peerID}`);
      }

      peerConnections.current[peerID] = new RTCPeerConnection({
        iceServers: freeice(),
      });
      peerConnections.current[peerID].onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit(ACTIONS.RELAY_ICE, {
            peerID,
            iceCandidate: event.candidate,
          });
        }
      };
      let trackNumber = 0;
      peerConnections.current[peerID].ontrack = ({
        streams: [remoteStream],
      }) => {
        trackNumber++;
        if (trackNumber === 2) {
          addNewClient(peerID, () => {
            if (peerMediaElements.current[peerID]) {
              peerMediaElements.current[peerID].srcObject = remoteStream;
            } else {
              console.error("peerMediaElements.current[peerID] is undefined");
            }
          });
        }
      };
      localMediaStream.current.getTracks().forEach((track) => {
        if (track.kind === "audio") {
          if (peerMediaElements.current[peerID]) {
            peerMediaElements.current[peerID].addTrack(
              track,
              localMediaStream.current
            );
          } else {
            console.error("peerMediaElements.current[peerID] is undefined");
          }
        }
      });
      if (createOffer) {
        const offer = await peerConnections.current[peerID].createOffer();

        await peerConnections.current[peerID].setLocalDescription(offer);

        socket.emit(ACTIONS.RELAY_SDP, {
          peerID,
          sessionDescription: offer,
        });
      }
    }
    socket.on(ACTIONS.ADD_PEER, handleNewPeer);
  });

  useEffect(() => {
    const setRemoteMedia = async ({
      peerID,
      sessionDescription: remoteDescription,
    }) => {
      await peerConnections.current[peerID].setRemoteDescription(
        new RTCSessionDescription(remoteDescription)
      );

      if (remoteDescription.type === "offer") {
        const answer = await peerConnections.current[peerID].createAnswer();

        await peerConnections.current[peerID].setLocalDescription(answer);
        socket.emit(ACTIONS.RELAY_SDP, {
          peerID,
          sessionDescription: answer,
        });
      }
    };

    socket.on(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia);
  });

  useEffect(() => {
    socket.on(ACTIONS.ICE_CANDIDATE, ({ peerID, iceCandidate }) => {
      peerConnections.current[peerID].addIceCandidate(
        new RTCIceCandidate(iceCandidate)
      );
    });
  }, []);

  useEffect(() => {
    const handleRemovePeer = ({ peerID }) => {
      if (peerConnections.current[peerID]) {
        peerConnections.current[peerID].close();
      }
      delete peerConnections.current[peerID];
      delete peerMediaElements.current[peerID];

      updateClients((list) => list.filter((c) => c !== peerID));
    };
    socket.on(ACTIONS.REMOVE_PEER, handleRemovePeer);
  });

  useEffect(() => {
    async function startCapture() {
      localMediaStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: 1280, height: 720 },
      });

      addNewClient(LOCAL_VIDEO, () => {
        const localVideoElement = peerMediaElements.current[LOCAL_VIDEO];
        if (localVideoElement) {
          localVideoElement.volume = 0;
          localVideoElement.srcObject = localMediaStream.current;
        }
      });
    }

    startCapture()
      .then(() => socket.emit(ACTIONS.JOIN, { room: roomID }))
      .catch((e) => console.error("Error getting user media", e));

    return () => {
      if (inVideoChat) {
        localMediaStream.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [roomID, addNewClient, inVideoChat]);

  const provideMediaRef = useCallback((id, node) => {
    peerMediaElements.current[id] = node;
  }, []);

  return { clients, provideMediaRef };
};

export default useWebRTC;

// TEST