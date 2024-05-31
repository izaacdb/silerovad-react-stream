// @ts-nocheck

import React, { useEffect, useReducer, useState } from "react"
import * as ort from "onnxruntime-web"
import { createRoot } from "react-dom/client"
import { useMicVAD, utils } from "@ricky0123/vad-react"

ort.env.wasm.wasmPaths = {
  "ort-wasm-simd-threaded.wasm": "/ort-wasm-simd-threaded.wasm",
  "ort-wasm-simd.wasm": "/ort-wasm-simd.wasm",
  "ort-wasm.wasm": "/ort-wasm.wasm",
  "ort-wasm-threaded.wasm": "/ort-wasm-threaded.wasm"
}

const domContainer = document.querySelector("#root")
const root = createRoot(domContainer)
root.render(<App />)

function App() {
  const [audioList, setAudioList] = useState([])
  const vad = useMicVAD({
    workletURL: "http://localhost:8080/vad.worklet.bundle.min.js",
    modelURL: "http://localhost:8080/silero_vad.onnx",
    startOnReady: false,
    initOnLoad: false,
    onVADMisfire: () => {
      console.log("Vad misfire")
    },
    onSpeechStart: () => {
      console.log("Speech start")
    },
    onSpeechEnd: (audio) => {
      console.log("Speech end")
      const wavBuffer = utils.encodeWAV(audio)
      const base64 = utils.arrayBufferToBase64(wavBuffer)
      const url = `data:audio/wav;base64,${base64}`
      setAudioList((old) => [url, ...old])
    }
  })


  return (
    <section className="section">
      <div className="container">
        <h1 className="title">Microphone fix fork of vad-react</h1>

        <div className="block ">
          <div>state: {JSON.stringify({ "vad.ready": vad.ready ? 1 : 0, "vad.listening": vad.listening ? 1 : 0 })}</div>
          <button
            style={{marginRight:'1rem'}}
            className={
              vad.loading ? "button is-primary is-loading" : "button is-primary"
            }
            onClick={() => {
              console.log("initialize")
              vad.initialize()
            }}
            disabled={vad.ready}
          >
            Start microphone
          </button>
          <button
            style={{marginRight:'1rem'}}
            className={
              vad.loading ? "button is-primary is-loading" : "button is-primary"
            }
            onClick={() => {
              console.log("vad.start")
              vad.start()
            }}
            disabled={!vad.ready || vad.listening}
          >
            Start VAD
          </button>
          <button
            style={{marginRight:'1rem'}}
            className={
              vad.loading ? "button is-primary is-loading" : "button is-primary"
            }
            onClick={() => {
              console.log("vad.terminate")
              vad.terminate()
            }}
            disabled={!vad.ready || !vad.listening}
          >
            Stop microphone & vad
          </button>
        </div>

        <div className="block">
          <ul>
            {audioList.map((audioURL) => {
              return (
                <li key={audioURL.substring(-10)}>
                  <audio controls src={audioURL} />
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
