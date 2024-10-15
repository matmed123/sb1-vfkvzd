import React, { useState, useEffect } from 'react';
import { Play, Square } from 'lucide-react';

function App() {
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  useEffect(() => {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.transcription) {
        setTranscription(prev => prev + request.transcription + '\n');
      }
    });
  }, []);

  const startTranscription = () => {
    setIsTranscribing(true);
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id!},
        files: ['src/contentScript.ts']
      });
    });
  };

  const stopTranscription = () => {
    setIsTranscribing(false);
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id!, {action: 'stop'});
    });
  };

  return (
    <div className="w-80 p-4 bg-gray-100">
      <h2 className="text-xl font-bold mb-4">YouTube Transcriber</h2>
      <div className="flex justify-between mb-4">
        <button
          onClick={startTranscription}
          disabled={isTranscribing}
          className={`flex items-center px-4 py-2 bg-blue-500 text-white rounded ${isTranscribing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
        >
          <Play size={16} className="mr-2" />
          Iniciar
        </button>
        <button
          onClick={stopTranscription}
          disabled={!isTranscribing}
          className={`flex items-center px-4 py-2 bg-red-500 text-white rounded ${!isTranscribing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'}`}
        >
          <Square size={16} className="mr-2" />
          Detener
        </button>
      </div>
      <div className="bg-white p-2 rounded shadow-inner h-48 overflow-y-auto">
        <pre className="whitespace-pre-wrap">{transcription}</pre>
      </div>
    </div>
  );
}

export default App;