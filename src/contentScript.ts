let mediaRecorder: MediaRecorder | null = null;
let chunks: Blob[] = [];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'stop') {
    stopTranscription();
  }
});

function startTranscription() {
  const video = document.querySelector('video');
  if (!video) {
    console.error('No se encontró el elemento de video.');
    return;
  }

  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContext();
  const source = audioContext.createMediaElementSource(video);
  const destination = audioContext.createMediaStreamDestination();
  source.connect(destination);
  source.connect(audioContext.destination);

  mediaRecorder = new MediaRecorder(destination.stream);
  chunks = [];

  mediaRecorder.ondataavailable = (e) => {
    chunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { 'type' : 'audio/webm; codecs=opus' });
    chunks = [];

    const formData = new FormData();
    formData.append('audio', blob, 'audio.webm');

    fetch('http://localhost:3000/transcribe', {
      method: 'POST',
      body: formData
    })
    .then(response => response.text())
    .then(data => {
      chrome.runtime.sendMessage({ transcription: data });
    })
    .catch(error => {
      console.error('Error al transcribir:', error);
    });
  };

  mediaRecorder.start();

  const transcriptionInterval = setInterval(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      mediaRecorder.start();
    }
  }, 30000); // Transcribe cada 30 segundos

  video.addEventListener('ended', () => {
    stopTranscription();
    clearInterval(transcriptionInterval);
  });
}

function stopTranscription() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
  mediaRecorder = null;
}

startTranscription();